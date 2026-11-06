'use server'

import { redirect } from 'next/navigation'
import { requireAgentAuth } from '@/lib/auth'
import { createInvitation } from '@/features/invitations/service'
import { CreateInvitationFormSchema } from '@/features/invitations/schema'

export async function createInvitationAction(formData: FormData): Promise<never> {
  const { agencyId, userId } = await requireAgentAuth()

  const rawData = {
    displayName: formData.get('displayName'),
    note: formData.get('note') || undefined,
    prefillBudgetMin: formData.get('prefillBudgetMin')
      ? Number(formData.get('prefillBudgetMin'))
      : undefined,
    prefillBudgetMax: formData.get('prefillBudgetMax')
      ? Number(formData.get('prefillBudgetMax'))
      : undefined,
    prefillLocation: formData.get('prefillLocation') || undefined,
  }

  const parsed = CreateInvitationFormSchema.safeParse(rawData)
  if (!parsed.success) {
    redirect('/buyers/invite?error=validation')
  }

  const { displayName, note, prefillBudgetMin, prefillBudgetMax, prefillLocation } =
    parsed.data

  const prefill: Record<string, unknown> = {}
  if (prefillBudgetMin !== undefined) prefill.budgetMin = prefillBudgetMin
  if (prefillBudgetMax !== undefined) prefill.budgetMax = prefillBudgetMax
  if (prefillLocation) prefill.location = prefillLocation

  const { inviteUrl } = await createInvitation({
    agencyId,
    inviterId: userId,
    displayName,
    note,
    prefill,
  })

  redirect(`/buyers/invite/confirm?url=${encodeURIComponent(inviteUrl)}`)
}
