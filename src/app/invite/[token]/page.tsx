import { isDemoId } from '@/lib/auth/buyer-session'
import { validateInviteToken } from '@/features/invitations/service'
import { BuyerInvitation } from '@/components/buyer/BuyerInvitation'
import { startSession } from './actions'

export const dynamic = 'force-dynamic'

function InviteErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bi-background)] px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="font-serif text-xl text-[var(--bi-ink)]">Invitation not found</p>
        <p className="text-sm text-[var(--bi-muted)]">
          This invitation link has expired or is no longer valid. Please ask your agent
          to send a new one.
        </p>
      </div>
    </div>
  )
}

export default async function InvitePage(
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params

  if (isDemoId(token)) {
    return <BuyerInvitation mode="demo" />
  }

  const result = await validateInviteToken(token)

  if (!result.valid) {
    return <InviteErrorPage />
  }

  const { invitation } = result

  return (
    <BuyerInvitation
      mode="real"
      invitationId={invitation.id}
      rawToken={token}
      displayName={invitation.display_name}
      note={invitation.note}
      startAction={startSession}
    />
  )
}
