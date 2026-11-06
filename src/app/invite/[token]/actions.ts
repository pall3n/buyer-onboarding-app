'use server'

import { redirect } from 'next/navigation'
import { validateInviteToken, startSessionFromInvitation } from '@/features/invitations/service'
import { setBuyerSessionCookie } from '@/lib/auth/buyer-session'

export async function startSession(formData: FormData): Promise<never> {
  const rawToken = formData.get('rawToken') as string | null
  if (!rawToken) {
    redirect('/')
  }

  // Re-validate the token — never trust form data as authorization
  const result = await validateInviteToken(rawToken)
  if (!result.valid) {
    redirect('/')
  }

  const { invitation } = result
  const sessionId = await startSessionFromInvitation(invitation.id, invitation.agency_id)

  await setBuyerSessionCookie(sessionId)
  redirect(`/brief/${sessionId}/conversation`)
}
