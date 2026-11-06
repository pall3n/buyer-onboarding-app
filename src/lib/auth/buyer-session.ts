import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase/admin'

export const BUYER_SESSION_COOKIE = 'bi_buyer_session'

/**
 * Returns true for demo IDs — these bypass session checks so M1 navigation
 * remains explorable without credentials.
 */
export function isDemoId(opaqueId: string): boolean {
  return opaqueId.startsWith('demo-')
}

/**
 * Sets the buyer session cookie.
 * HttpOnly, Secure in production, SameSite=lax, 30-day maxAge.
 */
export async function setBuyerSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(BUYER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export interface BuyerSessionData {
  sessionId: string
  subjectId: string
  invitationId: string
  agencyId: string
}

/**
 * Route-handler variant of requireBuyerSession.
 *
 * Returns null instead of calling redirect() — route handlers cannot use
 * Next.js redirect(). Callers must decide what 4xx to return.
 *
 * Returns null for demo IDs (caller should check isDemoId separately).
 */
export async function requireBuyerSessionForRoute(
  opaqueId: string
): Promise<BuyerSessionData | null> {
  if (isDemoId(opaqueId)) {
    return null
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(BUYER_SESSION_COOKIE)
  if (!sessionCookie?.value) return null

  const sessionId = sessionCookie.value
  const admin = getAdminClient()

  const { data: session } = await admin
    .from('buyer_sessions')
    .select('id, subject_id, invitation_id, state, expires_at')
    .eq('id', sessionId)
    .single()

  if (
    !session ||
    session.state !== 'active' ||
    new Date(session.expires_at as string) < new Date()
  ) {
    return null
  }

  const { data: invitation } = await admin
    .from('buyer_invitations')
    .select('agency_id')
    .eq('id', session.invitation_id)
    .single()

  if (!invitation) return null

  return {
    sessionId,
    subjectId: session.subject_id as string,
    invitationId: session.invitation_id as string,
    agencyId: invitation.agency_id as string,
  }
}

/**
 * Verifies the buyer session for a given opaque ID.
 *
 * - Returns null for demo IDs (no DB call needed)
 * - Reads the bi_buyer_session cookie; redirects to / if absent
 * - Validates the session via admin client: must be active and not expired
 * - Returns BuyerSessionData on success; redirects to / on any failure
 */
export async function requireBuyerSession(
  opaqueId: string
): Promise<BuyerSessionData | null> {
  if (isDemoId(opaqueId)) {
    return null
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(BUYER_SESSION_COOKIE)

  if (!sessionCookie?.value) {
    redirect('/')
  }

  const sessionId = sessionCookie.value
  const admin = getAdminClient()

  const { data: session } = await admin
    .from('buyer_sessions')
    .select('id, subject_id, invitation_id, state, expires_at')
    .eq('id', sessionId)
    .single()

  if (
    !session ||
    session.state !== 'active' ||
    new Date(session.expires_at as string) < new Date()
  ) {
    redirect('/')
  }

  // Fetch agency_id via invitation
  const { data: invitation } = await admin
    .from('buyer_invitations')
    .select('agency_id')
    .eq('id', session.invitation_id)
    .single()

  if (!invitation) {
    redirect('/')
  }

  return {
    sessionId,
    subjectId: session.subject_id as string,
    invitationId: session.invitation_id as string,
    agencyId: invitation.agency_id as string,
  }
}
