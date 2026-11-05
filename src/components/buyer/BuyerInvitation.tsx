import Link from 'next/link'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { DEMO_NAV_IDS } from '@/lib/demo-data'

export function BuyerInvitation() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bi-background)]">
      <DemoBanner />

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
          <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4">
            <p className="text-sm leading-relaxed text-[var(--bi-ink)]">
              &ldquo;Hi Maya — I&rsquo;d love to understand exactly what you and James are looking
              for before we start viewing. This usually takes about 6 minutes and it really helps me
              find the right properties for you.&rdquo;
            </p>
            <p className="mt-2 text-xs text-[var(--bi-muted)]">— Sophie Lane</p>
          </div>

          {/* Choice buttons */}
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
