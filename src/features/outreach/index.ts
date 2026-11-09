import { getAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CandidateStatus = 'pending' | 'approved' | 'dismissed'
export type CandidateEligibility =
  | 'eligible'
  | 'ineligible_no_profile'
  | 'ineligible_stale'
  | 'ineligible_conflicts'
  | 'ineligible_opted_out'

export interface OutreachCandidate {
  id: string
  agencyBuyerId: string
  buyerName: string
  status: CandidateStatus
  eligibility: CandidateEligibility
  hasHardConflicts: boolean
  conflictLabels: string[]
  matchReasons: string[]
  draftMessage: string | null
  communicationPrefs: { emailOk: boolean; smsOk: boolean }
  approvedAt: string | null
  approvedBy: string | null  // agent email
}

export interface PropertyShortlist {
  propertyId: string
  propertyAddress: string
  propertyPrice: string
  candidates: OutreachCandidate[]
  builtAt: string
}

// ─── Draft message template ───────────────────────────────────────────────────

export function draftOutreachMessage(
  buyerName: string,
  propertyAddress: string,
  propertyPrice: string,
  matchReasons: string[],
  agentName: string,
  agencyName: string
): string {
  const reasonSentence =
    matchReasons.length > 0
      ? `Based on what you've shared with us, it looks like ${matchReasons.slice(0, 2).join(' and ').toLowerCase()} may be of particular interest.`
      : `We think it may be worth your consideration.`

  return [
    `Hi ${buyerName},`,
    ``,
    `A property has just come to our attention that may suit your search — ${propertyAddress}, offered at ${propertyPrice}.`,
    ``,
    reasonSentence,
    ``,
    `If you'd like to find out more, please reply to this message or give us a call.`,
    ``,
    `${agentName}`,
    `${agencyName}`,
  ].join('\n')
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

// Profile is considered stale after 90 days without an approved version
const STALE_DAYS = 90

function isProfileFresh(lastApprovedAt: string): boolean {
  const ageMs = Date.now() - new Date(lastApprovedAt).getTime()
  return ageMs < STALE_DAYS * 24 * 60 * 60 * 1000
}

// ─── Build shortlist ──────────────────────────────────────────────────────────

/**
 * Builds a buyer shortlist for a property and persists it.
 * Only buyers who have an existing analysis for this property are assessed for
 * conflict/match data; buyers without analysis are marked ineligible_no_profile.
 * Uses UPSERT so calling again refreshes the shortlist without duplicates.
 */
export async function buildAndPersistShortlist(
  propertyId: string,
  agencyId: string
): Promise<void> {
  const admin = getAdminClient()

  // 1. Get property details for the draft message
  const { data: property } = await admin
    .from('properties')
    .select('address_line1, postcode, asking_price')
    .eq('id', propertyId)
    .eq('agency_id', agencyId)
    .single()

  if (!property) throw new Error('Property not found or not authorised')

  const propertyAddress = `${property.address_line1 as string}, ${property.postcode as string}`
  const propertyPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
    .format((property.asking_price as number) / 100)

  // 2. Get agency name for draft message
  const { data: agency } = await admin
    .from('agencies')
    .select('name')
    .eq('id', agencyId)
    .single()
  const agencyName = (agency?.name as string | null) ?? 'Your agency'

  // 3. All active buyers for this agency
  const { data: buyers } = await admin
    .from('agency_buyers')
    .select('id, buyer_subjects(name)')
    .eq('agency_id', agencyId)
    .eq('status', 'active')

  if (!buyers || buyers.length === 0) return

  // 4. Latest approved profile versions with timestamps
  const { data: versions } = await admin
    .from('home_profile_versions')
    .select('home_profile_id, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const approvedByBuyer = new Map<string, string>()
  for (const v of versions ?? []) {
    // home_profile → agency_buyer join is indirect; we map home_profile_id → created_at
    if (!approvedByBuyer.has(v.home_profile_id as string)) {
      approvedByBuyer.set(v.home_profile_id as string, v.created_at as string)
    }
  }

  // 5. Latest analysis per buyer for this property
  const buyerIds = buyers.map(b => b.id as string)
  const { data: analyses } = await admin
    .from('property_analyses')
    .select('id, agency_buyer_id, result_json, created_at')
    .eq('property_id', propertyId)
    .eq('agency_id', agencyId)
    .in('agency_buyer_id', buyerIds)
    .order('created_at', { ascending: false })

  type AnalysisRow = { id: string | null; agency_buyer_id: string | null; result_json: unknown; created_at: string | null }
  const latestAnalysisByBuyer = new Map<string, AnalysisRow>()
  for (const a of analyses ?? []) {
    if (!latestAnalysisByBuyer.has(a.agency_buyer_id as string)) {
      latestAnalysisByBuyer.set(a.agency_buyer_id as string, a)
    }
  }

  // 6. Home profiles per buyer (to link approved versions)
  const { data: profiles } = await admin
    .from('home_profiles')
    .select('id, agency_buyer_id')
    .in('agency_buyer_id', buyerIds)

  const profileByBuyer = new Map<string, string>()
  for (const p of profiles ?? []) {
    profileByBuyer.set(p.agency_buyer_id as string, p.id as string)
  }

  // 7. Communication preferences per buyer (includes explicit opt-out flag)
  const { data: prefs } = await admin
    .from('communication_preferences')
    .select('agency_buyer_id, email_ok, sms_ok, outreach_opt_out')
    .eq('agency_id', agencyId)
    .in('agency_buyer_id', buyerIds)

  const prefsByBuyer = new Map<string, { emailOk: boolean; smsOk: boolean; optedOut: boolean }>()
  for (const p of prefs ?? []) {
    prefsByBuyer.set(p.agency_buyer_id as string, {
      emailOk: Boolean(p.email_ok),
      smsOk: Boolean(p.sms_ok),
      optedOut: Boolean(p.outreach_opt_out),
    })
  }

  // 8. Build and upsert each candidate
  const rows = []
  for (const buyer of buyers) {
    const buyerId = buyer.id as string
    const subjects = buyer.buyer_subjects as Array<{ name: string }> | { name: string } | null
    const buyerName = Array.isArray(subjects)
      ? (subjects[0]?.name ?? 'Buyer')
      : ((subjects as { name?: string } | null)?.name ?? 'Buyer')

    const profileId = profileByBuyer.get(buyerId)
    const approvedAt = profileId ? approvedByBuyer.get(profileId) : undefined
    const analysis = latestAnalysisByBuyer.get(buyerId)

    let eligibility: CandidateEligibility
    let hasHardConflicts = false
    let conflictLabels: string[] = []
    let matchReasons: string[] = []

    const pref = prefsByBuyer.get(buyerId)

    if (pref?.optedOut) {
      eligibility = 'ineligible_opted_out'
    } else if (!approvedAt) {
      eligibility = 'ineligible_no_profile'
    } else if (!isProfileFresh(approvedAt)) {
      eligibility = 'ineligible_stale'
    } else if (analysis) {
      const result = analysis.result_json as { conflicts?: Array<{ label: string }>; strongMatches?: Array<{ label: string }> } | null
      conflictLabels = (result?.conflicts ?? []).map((c) => c.label)
      matchReasons = (result?.strongMatches ?? []).map((m) => m.label)
      hasHardConflicts = conflictLabels.length > 0
      eligibility = hasHardConflicts ? 'ineligible_conflicts' : 'eligible'
    } else {
      eligibility = 'eligible'
    }

    const draft =
      eligibility === 'eligible'
        ? draftOutreachMessage(buyerName, propertyAddress, propertyPrice, matchReasons, 'Your agent', agencyName)
        : null

    rows.push({
      agency_id: agencyId,
      property_id: propertyId,
      agency_buyer_id: buyerId,
      analysis_id: analysis?.id ?? null,
      eligibility,
      has_hard_conflicts: hasHardConflicts,
      conflict_labels: conflictLabels,
      match_reasons: matchReasons,
      draft_message: draft,
    })
  }

  if (rows.length === 0) return

  // Insert new candidates only — preserves existing agent decisions (approved/dismissed).
  // New buyers added after the initial build are picked up on subsequent calls.
  const { error } = await admin
    .from('outreach_candidates')
    .upsert(rows, {
      onConflict: 'agency_id,property_id,agency_buyer_id',
      ignoreDuplicates: true,
    })

  if (error) throw new Error(`Failed to build shortlist: ${error.message}`)
}

// ─── Load shortlist ───────────────────────────────────────────────────────────

export async function loadShortlistForProperty(
  propertyId: string,
  agencyId: string
): Promise<PropertyShortlist | null> {
  const admin = getAdminClient()

  const { data: property } = await admin
    .from('properties')
    .select('address_line1, postcode, asking_price')
    .eq('id', propertyId)
    .eq('agency_id', agencyId)
    .single()

  if (!property) return null

  const propertyAddress = `${property.address_line1 as string}, ${property.postcode as string}`
  const propertyPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
    .format((property.asking_price as number) / 100)

  const { data: rows } = await admin
    .from('outreach_candidates')
    .select('id, agency_buyer_id, status, eligibility, has_hard_conflicts, conflict_labels, match_reasons, draft_message, approved_by, approved_at')
    .eq('property_id', propertyId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true })

  if (!rows || rows.length === 0) return null

  // Load buyer names
  const buyerIds = rows.map(r => r.agency_buyer_id as string)
  const { data: buyerRows } = await admin
    .from('agency_buyers')
    .select('id, buyer_subjects(name)')
    .in('id', buyerIds)

  const nameById = new Map<string, string>()
  for (const b of buyerRows ?? []) {
    const subjects = b.buyer_subjects as Array<{ name: string }> | { name: string } | null
    const name = Array.isArray(subjects)
      ? (subjects[0]?.name ?? 'Buyer')
      : ((subjects as { name?: string } | null)?.name ?? 'Buyer')
    nameById.set(b.id as string, name)
  }

  // Load approver emails for approved candidates
  const approverIds = rows
    .filter(r => r.approved_by)
    .map(r => r.approved_by as string)

  const approverEmailById = new Map<string, string>()
  if (approverIds.length > 0) {
    for (const userId of approverIds) {
      const { data: { user } } = await admin.auth.admin.getUserById(userId)
      if (user?.email) approverEmailById.set(userId, user.email)
    }
  }

  // Load communication preferences
  const { data: prefs } = await admin
    .from('communication_preferences')
    .select('agency_buyer_id, email_ok, sms_ok')
    .eq('agency_id', agencyId)
    .in('agency_buyer_id', buyerIds)

  const prefsByBuyer = new Map<string, { emailOk: boolean; smsOk: boolean; optedOut?: boolean }>()
  for (const p of prefs ?? []) {
    prefsByBuyer.set(p.agency_buyer_id as string, {
      emailOk: Boolean(p.email_ok),
      smsOk: Boolean(p.sms_ok),
    })
  }

  const candidates: OutreachCandidate[] = rows.map(r => ({
    id: r.id as string,
    agencyBuyerId: r.agency_buyer_id as string,
    buyerName: nameById.get(r.agency_buyer_id as string) ?? 'Buyer',
    status: r.status as CandidateStatus,
    eligibility: r.eligibility as CandidateEligibility,
    hasHardConflicts: Boolean(r.has_hard_conflicts),
    conflictLabels: (r.conflict_labels as string[]) ?? [],
    matchReasons: (r.match_reasons as string[]) ?? [],
    draftMessage: r.draft_message as string | null,
    communicationPrefs: prefsByBuyer.get(r.agency_buyer_id as string) ?? { emailOk: false, smsOk: false },
    approvedAt: r.approved_at as string | null,
    approvedBy: r.approved_by ? (approverEmailById.get(r.approved_by as string) ?? null) : null,
  }))

  return {
    propertyId,
    propertyAddress,
    propertyPrice,
    candidates,
    builtAt: new Date().toISOString(),
  }
}

// ─── Status mutations ─────────────────────────────────────────────────────────

export async function approveCandidate(
  candidateId: string,
  actorUserId: string,
  agencyId: string
): Promise<void> {
  if (candidateId.startsWith('demo-')) return // demo — no-op

  const admin = getAdminClient()

  const { error } = await admin
    .from('outreach_candidates')
    .update({
      status: 'approved',
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', candidateId)
    .eq('agency_id', agencyId)

  if (error) throw new Error(`Failed to approve candidate: ${error.message}`)
}

export async function dismissCandidate(
  candidateId: string,
  agencyId: string
): Promise<void> {
  if (candidateId.startsWith('demo-')) return // demo — no-op

  const admin = getAdminClient()

  const { error } = await admin
    .from('outreach_candidates')
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', candidateId)
    .eq('agency_id', agencyId)

  if (error) throw new Error(`Failed to dismiss candidate: ${error.message}`)
}
