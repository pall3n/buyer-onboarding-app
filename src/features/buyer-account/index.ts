import { getAdminClient } from '@/lib/supabase/admin'
import { createHash, randomBytes } from 'crypto'

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLAIM_TOKEN_TTL_MS = 30 * 60 * 1000

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * What a buyer sees about one of their agency sharing grants.
 * Deliberately excludes all agent-side CRM fields (private_notes, scores, etc.).
 */
export interface BuyerGrant {
  shareId: string
  agencyId: string
  agencyName: string
  status: 'active' | 'revoked' | 'pending'
  approvedVersionId: string | null
  approvedVersionDate: string | null
  grantedAt: string
  revokedAt: string | null
}

export interface BuyerAuditEntry {
  id: string
  shareId: string
  agencyName: string
  eventType: 'granted' | 'revoked' | 'updated' | 'viewed'
  actorType: string
  occurredAt: string
}

export type ClaimResult =
  | { success: true; subjectId: string }
  | { success: false; reason: 'token_not_found' | 'token_expired' | 'token_used' | 'already_claimed' }

export interface SomewhereConnection {
  connectionId: string
  subjectId: string
  purposes: string[]
  status: 'active' | 'revoked'
  consentRecordedAt: string
  revokedAt: string | null
}

// ─── Token helpers (pure — exported for testing) ──────────────────────────────

export function isClaimTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

export function isClaimTokenUsed(usedAt: string | null): boolean {
  return usedAt !== null
}

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

// ─── Claim token management ───────────────────────────────────────────────────

/**
 * Creates a short-lived 6-digit claim token for a buyer subject.
 * Returns the plaintext token (delivery to the buyer is out of scope here).
 * The token hash is stored; the plaintext is never persisted.
 */
export async function createClaimToken(subjectId: string): Promise<string> {
  const admin = getAdminClient()
  const plain = String(parseInt(randomBytes(3).toString('hex'), 16) % 1_000_000).padStart(6, '0')
  const tokenHash = hashToken(plain)
  const expiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString()

  await admin.from('buyer_claim_tokens').insert({
    subject_id: subjectId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  return plain
}

/**
 * Verifies the claim token and links the auth user to the buyer subject.
 * Rejects if: not found, expired, already used, or subject already claimed.
 * Does NOT merge based on email — requires the token the buyer physically received.
 */
export async function verifyAndClaim(plainToken: string, authUserId: string): Promise<ClaimResult> {
  if (plainToken.startsWith('demo-')) return { success: false, reason: 'token_not_found' }

  const admin = getAdminClient()
  const tokenHash = hashToken(plainToken)

  const { data: row } = await admin
    .from('buyer_claim_tokens')
    .select('id, subject_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!row) return { success: false, reason: 'token_not_found' }
  if (isClaimTokenExpired(row.expires_at as string)) return { success: false, reason: 'token_expired' }
  if (isClaimTokenUsed(row.used_at as string | null)) return { success: false, reason: 'token_used' }

  const subjectId = row.subject_id as string

  // Reject if the subject is already claimed by a different auth user
  const { data: subject } = await admin
    .from('buyer_subjects')
    .select('id, claimed_auth_user_id')
    .eq('id', subjectId)
    .single()

  if (!subject) return { success: false, reason: 'token_not_found' }
  if (subject.claimed_auth_user_id !== null) return { success: false, reason: 'already_claimed' }

  // Link the auth user and mark the token as used in a single transaction
  await admin
    .from('buyer_claim_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)

  await admin
    .from('buyer_subjects')
    .update({ claimed_auth_user_id: authUserId })
    .eq('id', subjectId)

  return { success: true, subjectId }
}

// ─── Grants dashboard ─────────────────────────────────────────────────────────

/**
 * Loads all profile_shares for the buyer identified by their auth user ID.
 * Never returns agency_buyers.private_notes or any agent-side CRM data.
 */
export async function loadGrantsForBuyer(authUserId: string): Promise<BuyerGrant[]> {
  const admin = getAdminClient()

  // Resolve buyer_subject from claimed_auth_user_id
  const { data: subject } = await admin
    .from('buyer_subjects')
    .select('id')
    .eq('claimed_auth_user_id', authUserId)
    .single()

  if (!subject) return []

  // All home_profiles owned by this subject (via agency_buyers)
  const { data: agencyBuyers } = await admin
    .from('agency_buyers')
    .select('id, subject_id')
    .eq('subject_id', subject.id as string)

  if (!agencyBuyers || agencyBuyers.length === 0) return []

  const agencyBuyerIds = agencyBuyers.map(ab => ab.id as string)

  const { data: profiles } = await admin
    .from('home_profiles')
    .select('id')
    .in('agency_buyer_id', agencyBuyerIds)

  if (!profiles || profiles.length === 0) return []

  const profileIds = profiles.map(p => p.id as string)

  // Shares for those profiles, with agency name and approved version date
  const { data: shares } = await admin
    .from('profile_shares')
    .select(`
      id,
      agency_id,
      approved_version_id,
      status,
      created_at,
      updated_at,
      agencies ( name ),
      home_profile_versions ( created_at )
    `)
    .in('profile_id', profileIds)
    .order('created_at', { ascending: false })

  if (!shares) return []

  return shares.map(s => {
    type AgencyRow = { name: string } | null
    type VersionRow = { created_at: string } | null
    const agency = (s.agencies as unknown as AgencyRow)
    const version = (s.home_profile_versions as unknown as VersionRow)

    return {
      shareId: s.id as string,
      agencyId: s.agency_id as string,
      agencyName: agency?.name ?? 'Unknown agency',
      status: s.status as BuyerGrant['status'],
      approvedVersionId: (s.approved_version_id as string | null) ?? null,
      approvedVersionDate: version ? (version.created_at as string) : null,
      grantedAt: s.created_at as string,
      revokedAt: s.status === 'revoked' ? (s.updated_at as string) : null,
    }
  })
}

/**
 * Revokes a profile_share grant.
 * Creates a profile_share_events record for audit.
 * No-op for demo share IDs.
 */
export async function revokeGrant(shareId: string, authUserId: string): Promise<void> {
  if (shareId.startsWith('demo-')) return

  const admin = getAdminClient()

  // Verify the buyer owns this share (via claimed_auth_user_id chain)
  const { data: subject } = await admin
    .from('buyer_subjects')
    .select('id')
    .eq('claimed_auth_user_id', authUserId)
    .single()

  if (!subject) return

  const { data: share } = await admin
    .from('profile_shares')
    .select('id, profile_id')
    .eq('id', shareId)
    .single()

  if (!share) return

  // Confirm the profile belongs to this buyer's subject
  const { data: profile } = await admin
    .from('home_profiles')
    .select('agency_buyer_id')
    .eq('id', share.profile_id as string)
    .single()

  if (!profile) return

  const { data: agencyBuyer } = await admin
    .from('agency_buyers')
    .select('subject_id')
    .eq('id', profile.agency_buyer_id as string)
    .single()

  if (!agencyBuyer || agencyBuyer.subject_id !== subject.id) return

  await admin
    .from('profile_shares')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', shareId)

  await admin
    .from('profile_share_events')
    .insert({
      share_id: shareId,
      event_type: 'revoked',
      actor_type: 'buyer',
      actor_id: authUserId,
      metadata: {},
    })
}

/**
 * Loads recent audit events for a buyer's shares.
 */
export async function loadAuditForBuyer(authUserId: string): Promise<BuyerAuditEntry[]> {
  const admin = getAdminClient()

  const { data: subject } = await admin
    .from('buyer_subjects')
    .select('id')
    .eq('claimed_auth_user_id', authUserId)
    .single()

  if (!subject) return []

  const { data: agencyBuyers } = await admin
    .from('agency_buyers')
    .select('id')
    .eq('subject_id', subject.id as string)

  if (!agencyBuyers || agencyBuyers.length === 0) return []

  const agencyBuyerIds = agencyBuyers.map(ab => ab.id as string)

  const { data: profiles } = await admin
    .from('home_profiles')
    .select('id')
    .in('agency_buyer_id', agencyBuyerIds)

  if (!profiles || profiles.length === 0) return []

  const profileIds = profiles.map(p => p.id as string)

  const { data: shares } = await admin
    .from('profile_shares')
    .select('id, agency_id, agencies ( name )')
    .in('profile_id', profileIds)

  if (!shares) return []

  const shareIds = shares.map(s => s.id as string)
  const agencyNameByShare = new Map<string, string>(
    shares.map(s => {
      type AgencyRow = { name: string } | null
      return [s.id as string, ((s.agencies as unknown as AgencyRow)?.name ?? 'Unknown')]
    })
  )

  const { data: events } = await admin
    .from('profile_share_events')
    .select('id, share_id, event_type, actor_type, occurred_at')
    .in('share_id', shareIds)
    .order('occurred_at', { ascending: false })
    .limit(20)

  if (!events) return []

  return events.map(e => ({
    id: e.id as string,
    shareId: e.share_id as string,
    agencyName: agencyNameByShare.get(e.share_id as string) ?? 'Unknown',
    eventType: e.event_type as BuyerAuditEntry['eventType'],
    actorType: e.actor_type as string,
    occurredAt: e.occurred_at as string,
  }))
}
