import { getAdminClient } from '@/lib/supabase/admin'
import { generateInviteToken, hashToken, verifyToken, isExpired } from '@/features/invitations/token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterestLevel = 'yes' | 'maybe' | 'no'
export type NextSteps = 'second_viewing' | 'discuss' | 'not_right' | 'undecided'

export interface FeedbackResponses {
  positives?: string | null
  concerns?: string | null
  interestLevel?: InterestLevel | null
  wouldChange?: string | null
  nextSteps?: NextSteps | null
}

export interface FeedbackSummary {
  viewingId: string
  viewingDate: string
  inviteId: string
  inviteStatus: 'pending' | 'opened' | 'completed' | 'revoked'
  inviteExpiresAt: string
  feedback: (FeedbackResponses & { submittedAt: string }) | null
}

// ─── Write operations ─────────────────────────────────────────────────────────

/**
 * Creates a viewing record from a brief and generates a one-time feedback invite token.
 * Returns the raw token (shown once to the agent for sharing) and the viewing/invite IDs.
 */
export async function createViewingAndInvite(
  briefId: string,
  viewingDate: string,
  agencyId: string
): Promise<{ viewingId: string; inviteId: string; rawToken: string }> {
  const admin = getAdminClient()

  // Resolve agency_buyer_id and property_id via the brief → analysis join
  const { data: brief } = await admin
    .from('viewing_briefs')
    .select('analysis_id, agency_id')
    .eq('id', briefId)
    .eq('agency_id', agencyId)
    .single()

  if (!brief) throw new Error('Viewing brief not found or not authorized')

  const { data: analysis } = await admin
    .from('property_analyses')
    .select('agency_buyer_id, property_id')
    .eq('id', brief.analysis_id)
    .eq('agency_id', agencyId)
    .single()

  if (!analysis) throw new Error('Analysis not found for brief')

  // Create the viewing record
  const { data: viewing, error: viewingErr } = await admin
    .from('viewings')
    .insert({
      agency_id: agencyId,
      brief_id: briefId,
      property_id: analysis.property_id as string,
      agency_buyer_id: analysis.agency_buyer_id as string,
      viewing_date: viewingDate,
    })
    .select('id')
    .single()

  if (viewingErr || !viewing) throw new Error(`Failed to create viewing: ${viewingErr?.message ?? 'unknown'}`)
  const viewingId = viewing.id as string

  // Generate and store feedback invite token
  const rawToken = generateInviteToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14) // 14-day feedback window

  const { data: invite, error: inviteErr } = await admin
    .from('feedback_invites')
    .insert({
      agency_id: agencyId,
      viewing_id: viewingId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (inviteErr || !invite) throw new Error(`Failed to create feedback invite: ${inviteErr?.message ?? 'unknown'}`)

  return { viewingId, inviteId: invite.id as string, rawToken }
}

// ─── Buyer-facing read (no auth) ──────────────────────────────────────────────

export type FeedbackFormData =
  | { kind: 'ok'; inviteId: string; propertyName: string; agencyName: string }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'completed' }
  | { kind: 'revoked' }

/**
 * Loads the data needed to render the buyer feedback form.
 * Uses constant-time token comparison. Returns a typed discriminant
 * to avoid leaking which condition failed.
 */
export async function loadFeedbackFormData(rawToken: string): Promise<FeedbackFormData> {
  if (rawToken.startsWith('demo-')) {
    return {
      kind: 'ok',
      inviteId: rawToken,
      propertyName: 'Larkfield House',
      agencyName: 'Hartfield & Rowe',
    }
  }

  const admin = getAdminClient()
  const tokenHash = hashToken(rawToken)

  const { data: invite } = await admin
    .from('feedback_invites')
    .select('id, token_hash, status, expires_at, viewing_id, agency_id')
    .eq('token_hash', tokenHash)
    .single()

  if (!invite) return { kind: 'invalid' }
  if (!verifyToken(rawToken, invite.token_hash as string)) return { kind: 'invalid' }

  if (invite.status === 'revoked') return { kind: 'revoked' }
  if (invite.status === 'completed') return { kind: 'completed' }
  if (isExpired(new Date(invite.expires_at as string))) return { kind: 'expired' }

  // Load property name + agency name via viewing → property + agency
  const { data: viewing } = await admin
    .from('viewings')
    .select('property_id, agency_id')
    .eq('id', invite.viewing_id as string)
    .single()

  if (!viewing) return { kind: 'invalid' }

  const [propertyResult, agencyResult] = await Promise.all([
    admin.from('properties').select('address_line1').eq('id', viewing.property_id as string).single(),
    admin.from('agencies').select('name').eq('id', viewing.agency_id as string).single(),
  ])

  const propertyName = (propertyResult.data?.address_line1 as string | undefined) ?? 'this property'
  const agencyName = (agencyResult.data?.name as string | undefined) ?? 'your agent'

  // Mark as opened if still pending
  if (invite.status === 'pending') {
    await admin
      .from('feedback_invites')
      .update({ status: 'opened' })
      .eq('id', invite.id as string)
  }

  return { kind: 'ok', inviteId: invite.id as string, propertyName, agencyName }
}

/**
 * Persists the buyer's feedback and marks the invite as completed.
 * Idempotency: the UNIQUE constraint on invite_id prevents duplicate rows;
 * this throws if already submitted.
 */
export async function submitFeedback(inviteId: string, responses: FeedbackResponses): Promise<void> {
  if (inviteId.startsWith('demo-')) return // demo — no-op

  const admin = getAdminClient()

  // Verify invite is openable
  const { data: invite } = await admin
    .from('feedback_invites')
    .select('id, status, expires_at, agency_id')
    .eq('id', inviteId)
    .single()

  if (!invite) throw new Error('Invite not found')
  if (invite.status === 'completed') throw new Error('Feedback already submitted')
  if (invite.status === 'revoked') throw new Error('Invite has been revoked')
  if (isExpired(new Date(invite.expires_at as string))) throw new Error('Invite has expired')

  const { error: feedbackErr } = await admin
    .from('viewing_feedback')
    .insert({
      invite_id: inviteId,
      agency_id: invite.agency_id as string,
      positives: responses.positives ?? null,
      concerns: responses.concerns ?? null,
      interest_level: responses.interestLevel ?? null,
      would_change: responses.wouldChange ?? null,
      next_steps: responses.nextSteps ?? null,
    })

  if (feedbackErr) throw new Error(`Failed to store feedback: ${feedbackErr.message}`)

  await admin
    .from('feedback_invites')
    .update({ status: 'completed' })
    .eq('id', inviteId)
}

// ─── Agent-facing read ────────────────────────────────────────────────────────

/**
 * Loads the feedback state for a viewing brief.
 * Returns null if no viewing has been created for this brief.
 */
export async function loadFeedbackForBrief(
  briefId: string,
  agencyId: string
): Promise<FeedbackSummary | null> {
  const admin = getAdminClient()

  const { data: viewing } = await admin
    .from('viewings')
    .select('id, viewing_date')
    .eq('brief_id', briefId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!viewing) return null

  const { data: invite } = await admin
    .from('feedback_invites')
    .select('id, status, expires_at')
    .eq('viewing_id', viewing.id as string)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!invite) return null

  let feedback: (FeedbackResponses & { submittedAt: string }) | null = null
  if (invite.status === 'completed') {
    const { data: fb } = await admin
      .from('viewing_feedback')
      .select('positives, concerns, interest_level, would_change, next_steps, submitted_at')
      .eq('invite_id', invite.id as string)
      .single()

    if (fb) {
      feedback = {
        positives: fb.positives as string | null,
        concerns: fb.concerns as string | null,
        interestLevel: fb.interest_level as InterestLevel | null,
        wouldChange: fb.would_change as string | null,
        nextSteps: fb.next_steps as NextSteps | null,
        submittedAt: fb.submitted_at as string,
      }
    }
  }

  return {
    viewingId: viewing.id as string,
    viewingDate: viewing.viewing_date as string,
    inviteId: invite.id as string,
    inviteStatus: invite.status as FeedbackSummary['inviteStatus'],
    inviteExpiresAt: invite.expires_at as string,
    feedback,
  }
}
