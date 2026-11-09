import { getAdminClient } from '@/lib/supabase/admin'
import type { AgentIdentity } from '@/lib/auth/index'
import type { PropertyFitData, ViewingBriefDraftJson } from '@/lib/demo-data'
import type { PropertyRecord } from '@/features/properties/index'
import { loadPropertyWithFacts } from '@/features/properties/index'

export type { ViewingBriefDraftJson }

// ─── Pure generator ───────────────────────────────────────────────────────────

interface BriefMeta {
  profileVersionId: string
  profileVersionDate: string
  propertyRevision: number
  propertyRevisionDate: string
}

export function generateBrief(
  fitData: PropertyFitData,
  preferences: Array<{ category: string; key: string; typedValue: unknown }>,
  property: PropertyRecord,
  buyer: { name: string },
  agent: { name: string; agencyName: string },
  meta: BriefMeta
): ViewingBriefDraftJson {
  const prefMap = new Map<string, unknown>()
  for (const p of preferences) {
    prefMap.set(`${p.category}.${p.key}`, p.typedValue)
  }

  // Buyer snapshot
  const parts: string[] = []
  const minBeds = prefMap.get('bedrooms.minimum')
  const maxBudget = prefMap.get('budget.max_gbp')
  const area = prefMap.get('location.area')
  const propType = prefMap.get('property_type.type')
  const gardenRequired = prefMap.get('lifestyle.garden_required')

  const typeStr = propType && propType !== 'any' ? String(propType) : 'property'
  const areaStr = area ? ` in ${String(area)}` : ''
  const bedsStr = minBeds ? ` with ${Number(minBeds)}+ bedrooms` : ''
  const budgetStr = maxBudget ? ` and a budget of up to £${Number(maxBudget).toLocaleString('en-GB')}` : ''
  parts.push(`${buyer.name} ${isPlural(buyer.name) ? 'are' : 'is'} looking for a ${typeStr}${areaStr}${bedsStr}${budgetStr}.`)
  if (gardenRequired === true) {
    parts.push('A private garden is a non-negotiable requirement.')
  }
  const buyerSnapshot = parts.join(' ')

  // What they care about
  const whatTheyCareAbout = fitData.strongMatches.length > 0
    ? fitData.strongMatches.slice(0, 5).map(m => m.detail)
    : ['No strong matches identified for this property.']

  // Won't consider
  const wontConsider = fitData.conflicts.length > 0
    ? fitData.conflicts.map(c => c.detail)
    : fitData.worthAsking.length > 0
      ? fitData.worthAsking.slice(0, 2)
      : ['No hard non-negotiables violated for this property.']

  // Why it may suit them
  const topMatches = fitData.strongMatches.slice(0, 2)
  const whyItMaySuit = topMatches.length >= 2
    ? `The property's ${topMatches[0].label.toLowerCase()} and ${topMatches[1].label.toLowerCase()} align directly with ${buyer.name}'s priorities.`
    : topMatches.length === 1
      ? `The property's ${topMatches[0].label.toLowerCase()} aligns with ${buyer.name}'s priorities.`
      : `No strong matches identified for ${buyer.name}'s stated preferences.`

  // Three things to show
  const threeThingsToShow = fitData.strongMatches.slice(0, 3).map(m => ({
    title: m.label,
    description: `${m.detail} — ${m.source}`,
  }))

  // Local evidence (from unknowns)
  const localEvidence = fitData.unknowns.map(u => ({
    label: u.label,
    status: u.status,
    source: u.source,
  }))

  // Be upfront about (conflicts)
  const beUpfrontAbout = fitData.conflicts.map(c => ({
    title: c.label,
    description: c.detail,
  }))

  // Check before viewing (from unknowns)
  const checkBeforeViewing = fitData.unknowns.map(u => ({
    item: `Confirm: ${u.label}`,
    done: false,
  }))

  // Questions
  const questionsToAsk = fitData.worthAsking

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return {
    version: 1,
    profileVersionId: meta.profileVersionId,
    propertyRevision: meta.propertyRevision,
    generatedAt: new Date().toISOString(),
    buyerName: buyer.name,
    propertyName: property.addressLine1,
    propertyAddress: `${property.addressLine1}, ${property.postcode}`,
    propertyPrice: fitData.propertyPrice,
    agentName: agent.name,
    agencyName: agent.agencyName,
    buyerSnapshot,
    whatTheyCareAbout,
    wontConsider,
    whyItMaySuit,
    threeThingsToShow,
    localEvidence,
    beUpfrontAbout,
    checkBeforeViewing,
    questionsToAsk,
    hasConflicts: fitData.conflicts.length > 0,
    conflictLabels: fitData.conflicts.map(c => c.label),
    profileVersionDate: meta.profileVersionDate || dateStr,
    propertyRevisionDate: meta.propertyRevisionDate || dateStr,
  }
}

// ─── DB functions ─────────────────────────────────────────────────────────────

export async function createBrief(
  agencyBuyerId: string,
  propertyId: string,
  agent: AgentIdentity
): Promise<string> {
  const admin = getAdminClient()

  // 1. Load latest analysis
  const { data: analysis } = await admin
    .from('property_analyses')
    .select('id, result_json, profile_version_id, property_revision, created_at')
    .eq('agency_buyer_id', agencyBuyerId)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!analysis) throw new Error('No analysis found — run analysis before creating a brief')

  // 2. Load preferences for the profile version
  const { data: prefRows } = await admin
    .from('profile_preferences')
    .select('category, key, typed_value')
    .eq('version_id', analysis.profile_version_id)
    .neq('category', 'meta')

  const preferences = (prefRows ?? []).map(row => ({
    category: row.category as string,
    key: row.key as string,
    typedValue: (row.typed_value as { value?: unknown })?.value ?? null,
  }))

  // 3. Load property
  const propertyData = await loadPropertyWithFacts(propertyId)
  if (!propertyData) throw new Error('Property not found')

  // 4. Load buyer name
  const { data: agencyBuyer } = await admin
    .from('agency_buyers')
    .select('buyer_subjects(name)')
    .eq('id', agencyBuyerId)
    .single()

  const subjects = agencyBuyer?.buyer_subjects as Array<{ name: string }> | { name: string } | null
  const buyerName = Array.isArray(subjects)
    ? (subjects[0]?.name ?? 'Buyer')
    : ((subjects as { name?: string } | null)?.name ?? 'Buyer')

  // 5. Load agency name
  const { data: agencyRow } = await admin
    .from('agencies')
    .select('name')
    .eq('id', agent.agencyId)
    .single()

  const agencyName = (agencyRow?.name as string | null) ?? 'Agency'

  // 6. Agent name from auth
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(agent.userId)
  const agentName = authUser?.email ?? 'Agent'

  // 7. Date formatting
  const analysisDate = new Date(analysis.created_at as string)
  const dateStr = analysisDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  // 8. Generate brief content
  const draft = generateBrief(
    analysis.result_json as PropertyFitData,
    preferences,
    propertyData.property,
    { name: buyerName },
    { name: agentName, agencyName },
    {
      profileVersionId: analysis.profile_version_id as string,
      profileVersionDate: dateStr,
      propertyRevision: analysis.property_revision as number,
      propertyRevisionDate: dateStr,
    }
  )

  // 9. Insert
  const { data: brief, error } = await admin
    .from('viewing_briefs')
    .insert({
      analysis_id: analysis.id,
      agency_id: agent.agencyId,
      draft_json: draft,
    })
    .select('id')
    .single()

  if (error || !brief) throw new Error(`Failed to insert viewing brief: ${error?.message}`)
  return brief.id as string
}

export async function loadViewingBrief(
  briefId: string,
  agencyId: string
): Promise<{ draft: ViewingBriefDraftJson; notes: string | null } | null> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('viewing_briefs')
    .select('draft_json, notes_private')
    .eq('id', briefId)
    .eq('agency_id', agencyId)
    .single()

  if (!data) return null
  return {
    draft: data.draft_json as ViewingBriefDraftJson,
    notes: (data.notes_private as string | null) ?? null,
  }
}

export async function loadBriefIdForBuyerAndProperty(
  agencyBuyerId: string,
  propertyId: string,
  agencyId: string
): Promise<string | null> {
  const admin = getAdminClient()

  // Find the most recent analysis for this buyer+property (scoped to agency)
  const { data: analysis } = await admin
    .from('property_analyses')
    .select('id')
    .eq('agency_buyer_id', agencyBuyerId)
    .eq('property_id', propertyId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!analysis) return null

  // Find the most recent brief linked to that analysis
  const { data: brief } = await admin
    .from('viewing_briefs')
    .select('id')
    .eq('analysis_id', analysis.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (brief?.id as string | null) ?? null
}

export async function saveViewingBriefNotes(
  briefId: string,
  notes: string,
  agencyId: string
): Promise<void> {
  const admin = getAdminClient()
  await admin
    .from('viewing_briefs')
    .update({ notes_private: notes })
    .eq('id', briefId)
    .eq('agency_id', agencyId)
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function isPlural(name: string): boolean {
  // Heuristic: "and" in name → plural
  return name.toLowerCase().includes(' and ')
}
