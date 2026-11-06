import { getAdminClient } from '@/lib/supabase/admin'
import type { InvitationRow, SafeInvitation } from './schema'

interface CreateInvitationParams {
  agencyId: string
  inviterId: string
  tokenHash: string
  expiresAt: Date
  displayName: string
  note?: string
  prefill?: Record<string, unknown>
}

/** Creates a new buyer_invitations row and returns its UUID. */
export async function createInvitationRow(
  params: CreateInvitationParams
): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('buyer_invitations')
    .insert({
      agency_id: params.agencyId,
      inviter_id: params.inviterId,
      token_hash: params.tokenHash,
      expires_at: params.expiresAt.toISOString(),
      display_name: params.displayName,
      note: params.note ?? null,
      prefill: params.prefill ?? {},
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

/**
 * Looks up an invitation by token_hash.
 * Returns null if not found (PGRST116 = no rows, treated as not found).
 */
export async function findInvitationByTokenHash(
  hash: string
): Promise<InvitationRow | null> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('buyer_invitations')
    .select('*')
    .eq('token_hash', hash)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as InvitationRow
}

/** Marks an invitation as accepted and links it to a buyer subject. */
export async function acceptInvitation(
  id: string,
  subjectId: string
): Promise<void> {
  const admin = getAdminClient()
  const { error } = await admin
    .from('buyer_invitations')
    .update({ status: 'accepted', buyer_subject_id: subjectId })
    .eq('id', id)

  if (error) throw error
}

/** Marks an invitation as revoked. */
export async function revokeInvitation(id: string): Promise<void> {
  const admin = getAdminClient()
  const { error } = await admin
    .from('buyer_invitations')
    .update({ status: 'revoked' })
    .eq('id', id)

  if (error) throw error
}

/** Lists all invitations for an agency, without token_hash. */
export async function listAgencyInvitations(
  agencyId: string
): Promise<SafeInvitation[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('buyer_invitations')
    .select(
      'id, agency_id, inviter_id, buyer_subject_id, expires_at, status, display_name, note, prefill, created_at, updated_at'
    )
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SafeInvitation[]
}
