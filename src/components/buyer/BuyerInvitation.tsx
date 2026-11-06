import Link from 'next/link'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { DEMO_NAV_IDS } from '@/lib/demo-data'

type DemoProps = {
  mode: 'demo'
}

type RealProps = {
  mode: 'real'
  invitationId: string
  rawToken: string
  displayName: string
  note?: string | null
  // Server action passed from the route — avoids importing from a specific route file
  startAction: (formData: FormData) => Promise<never>
}

type BuyerInvitationProps = DemoProps | RealProps

export function BuyerInvitation(props: BuyerInvitationProps) {
  const isDemo = props.mode === 'demo'

  const noteContent = isDemo
    ? 'Hi Maya — I\u2019d love to understand exactly what you and James are looking for before we start viewing. This usually takes about 6 minutes and it really helps me find the right properties for you.'
    : (props as RealProps).note ?? null

  const ctaButtons = isDemo ? (
    <div className="space-y-3">
      <Link
        href={`/brief/${DEMO_NAV_IDS.convMaya}/conversation`}
        className="flex w-full items-center justify-center rounded-xl bg-[var(--bi-ink)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        Start by talking
      </Link>
      <Link
        href={`/brief/${DEMO_NAV_IDS.convMaya}/conversation`}
        className="flex w-full items-center justify-center rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-3 text-sm font-medium text-[var(--bi-ink)] transition-colors hover:bg-[var(--bi-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        I&apos;d rather type
      </Link>
    </div>
  ) : (
    <div className="space-y-3">
      <form action={(props as RealProps).startAction}>
        <input type="hidden" name="rawToken" value={(props as RealProps).rawToken} />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-[var(--bi-ink)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
        >
          Start by talking
        </button>
      </form>
      <form action={(props as RealProps).startAction}>
        <input type="hidden" name="rawToken" value={(props as RealProps).rawToken} />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-3 text-sm font-medium text-[var(--bi-ink)] transition-colors hover:bg-[var(--bi-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
        >
          I&apos;d rather type
        </button>
      </form>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bi-background)]">
      {isDemo && <DemoBanner />}

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Agency / inviter */}
          <div className="text-center">
            <p className="font-serif text-xl text-[var(--bi-ink)]">Hartfield &amp; Rowe</p>
            <p className="mt-1 text-sm text-[var(--bi-muted)]">
              You&apos;ve been invited by Sophie Lane
            </p>
          </div>

          {/* Personal note */}
          {noteContent && (
            <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4">
              <p className="text-sm leading-relaxed text-[var(--bi-ink)]">
                &ldquo;{noteContent}&rdquo;
              </p>
              <p className="mt-2 text-xs text-[var(--bi-muted)]">— Sophie Lane</p>
            </div>
          )}

          {/* Choice buttons */}
          {ctaButtons}

          {/* Privacy note */}
          <p className="text-center text-[11px] leading-relaxed text-[var(--bi-muted)]">
            Your answers help Hartfield &amp; Rowe understand what you&apos;re looking for.
            We don&apos;t store recordings.
          </p>
        </div>
      </main>
    </div>
  )
}
