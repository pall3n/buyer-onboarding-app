import Link from 'next/link'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { DEMO_NAV_IDS } from '@/lib/demo-data'

export default async function SharedPage(
  props: { params: Promise<{ opaqueId: string }> }
) {
  const { opaqueId } = await props.params
  void opaqueId

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bi-background)]">
      <DemoBanner />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bi-sage-pale)]">
            <span className="text-2xl" aria-hidden="true">✓</span>
          </div>

          <div>
            <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Brief shared</h1>
            <p className="mt-2 text-sm text-[var(--bi-muted)]">
              Hartfield &amp; Rowe can now see your home brief. Sophie will be in touch to discuss
              next steps.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
              What you shared
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--bi-ink)]">
              <li>· Your non-negotiables</li>
              <li>· Things you&apos;d love</li>
              <li>· Lifestyle notes</li>
              <li>· Style preferences</li>
            </ul>
          </div>

          <p className="text-xs text-[var(--bi-muted)]">
            You can update your brief at any time. Changes will be shared automatically.
          </p>

          <Link
            href={`/brief/${DEMO_NAV_IDS.convMaya}/review`}
            className="inline-flex items-center text-sm text-[var(--bi-muted)] underline-offset-2 hover:underline"
          >
            ← Back to your brief
          </Link>
        </div>
      </main>
    </div>
  )
}
