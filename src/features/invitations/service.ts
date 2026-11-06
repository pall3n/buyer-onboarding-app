import { logAuditEvent } from '@/lib/db'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  generateInviteToken,
  hashToken,
  verifyToken,
  defaultExpiresAt,
  isExpired,
} from './token'
import {
  createInvitationRow,
  findInvitationByTokenHash,
  acceptInvitation,
} from './repository'
import type { InvitationRow } from './schema'

interface CreateInvitationParams {
  agencyId: string
  inviterId: string
  displayName: string
  note?: string
  prefill?: Record<string, unknown>
}

interface CreateInvitationResult {
  invitationId: string
  rawToken: string
  inviteUrl: string
}

/** Creates an invitation, hashes the token, and returns the raw token + URL. */
export async function createInvitation(
  params: CreateInvitationParams
): Promise<CreateInvitationResult> {
  const rawToken = generateInviteToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = defaultExpiresAt()

  const invitationId = await createInvitationRow({
    agencyId: params.agencyId,
    inviterId: params.inviterId,
    tokenHash,
    expiresAt,
    displayName: params.displayName,
    note: params.note,
    prefill: params.prefill,
  })

  void logAuditEvent({
    actorType: 'agent',
    actorId: params.inviterId,
    agencyId: params.agencyId,
    action: 'invitation.created',
    targetType: 'buyer_invitation',
    targetId: invitationId,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${rawToken}`

  return { invitationId, rawToken, inviteUrl }
}

type ValidateResult =
  | { valid: true; invitation: InvitationRow }
  | { valid: false; reason: string }

/**
 * Validates a raw invite token.
 * Returns a generic 'not_found' reason to avoid oracle attacks.
 * Real failure reasons are logged server-side.
 */
export async function validateInviteToken(
  rawToken: string
): Promise<ValidateResult> {
  const hash = hashToken(rawToken)
  const row = await findInvitationByTokenHash(hash)

  if (!row) {
    console.info('[invitation] Validation failed: row not found for hash')
    return { valid: false, reason: 'not_found' }
  }

  // Double-check with constant-time compare
  if (!verifyToken(rawToken, row.token_hash)) {
    console.info('[invitation] Validation failed: token mismatch')
    return { valid: false, reason: 'not_found' }
  }

  if (row.status !== 'pending') {
    console.info(`[invitation] Validation failed: status=${row.status}`)
    return { valid: false, reason: 'not_found' }
  }

  if (isExpired(new Date(row.expires_at))) {
    console.info('[invitation] Validation failed: expired')
    return { valid: false, reason: 'not_found' }
  }

  return { valid: true, invitation: row }
}

/**
 * Creates a buyer subject + session from a valid invitation.
 * Accepts the invitation and links the buyer to the agency.
 * Returns the new session ID.
 */
export async function startSessionFromInvitation(
  invitationId: string,
  agencyId: string
): Promise<string> {
  const admin = getAdminClient()

  // Fetch invitation to get display_name
  const { data: invitation, error: invErr } = await admin
    .from('buyer_invitations')
    .select('display_name')
    .eq('id', invitationId)
    .single()

  if (invErr || !invitation) throw new Error('Invitation not found')

  // Create buyer subject
  const { data: subject, error: subjectErr } = await admin
    .from('buyer_subjects')
    .insert({ display_name: invitation.display_name })
    .select('id')
    .single()

  if (subjectErr || !subject) throw new Error('Failed to create buyer subject')
  const subjectId = subject.id as string

  // Create buyer session (expires 30 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: session, error: sessionErr } = await admin
    .from('buyer_sessions')
    .insert({
      subject_id: subjectId,
      invitation_id: invitationId,
      state: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (sessionErr || !session) throw new Error('Failed to create buyer session')
  const sessionId = session.id as string

  // Accept invitation and link to subject
  await acceptInvitation(invitationId, subjectId)

  // Link buyer to agency
  const { error: agencyBuyerErr } = await admin.from('agency_buyers').insert({
    agency_id: agencyId,
    subject_id: subjectId,
    invitation_id: invitationId,
  })

  if (agencyBuyerErr) throw new Error('Failed to create agency_buyer link')

  void logAuditEvent({
    actorType: 'buyer',
    actorId: subjectId,
    agencyId,
    action: 'session.started',
    targetType: 'buyer_session',
    targetId: sessionId,
  })

  return sessionId
}
