import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export interface AgentIdentity {
  userId: string
  agencyId: string
  role: string
}

/**
 * Verifies the current request has an authenticated Supabase Auth session
 * and an active agency membership. Redirects to /auth/sign-in if not.
 *
 * Safe to call from Server Components and Server Actions.
 */
export async function requireAgentAuth(): Promise<AgentIdentity> {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  const admin = getAdminClient()
  const { data: membership } = await admin
    .from('agency_memberships')
    .select('agency_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    console.error(`[auth] No active agency membership for user ${user.id}`)
    redirect('/auth/sign-in')
  }

  return {
    userId: user.id,
    agencyId: membership.agency_id as string,
    role: membership.role as string,
  }
}

/**
 * Same as requireAgentAuth but returns null instead of redirecting.
 * Use in route handlers (which cannot call redirect()).
 */
export async function requireAgentAuthForRoute(): Promise<AgentIdentity | null> {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const admin = getAdminClient()
  const { data: membership } = await admin
    .from('agency_memberships')
    .select('agency_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) return null

  return {
    userId: user.id,
    agencyId: membership.agency_id as string,
    role: membership.role as string,
  }
}
