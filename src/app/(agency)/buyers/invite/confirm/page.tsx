import { CopyButton } from './CopyButton'

interface ConfirmPageProps {
  searchParams: Promise<{ url?: string }>
}

export default async function InviteConfirmPage({ searchParams }: ConfirmPageProps) {
  const { url } = await searchParams

  if (!url) {
    return (
      <div className="min-h-screen bg-[var(--bi-background)] flex items-center justify-center px-4">
        <p className="text-sm text-[var(--bi-muted)]">No invite URL provided.</p>
      </div>
    )
  }

  const inviteUrl = decodeURIComponent(url)

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Invitation created</h1>
        <p className="mt-1 text-sm text-[var(--bi-muted)]">
          Send this link to your buyer. It expires in 7 days.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--bi-muted)]">
            Invite link
          </p>
          <p className="mt-2 break-all font-mono text-sm text-[var(--bi-ink)]">
            {inviteUrl}
          </p>
          <div className="mt-4">
            <CopyButton url={inviteUrl} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface-soft)] p-4">
          <p className="text-sm text-[var(--bi-ink)]">
            <strong>Next steps:</strong> Copy the link above and send it to your buyer
            via email, WhatsApp, or SMS. When they click it, they&apos;ll be guided
            through a short conversation to capture what they&apos;re looking for.
          </p>
        </div>
      </div>
    </div>
  )
}
