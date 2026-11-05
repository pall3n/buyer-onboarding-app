import Link from 'next/link'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { ImportanceToggle } from '@/components/buyer/ImportanceToggle'
import { DEMO_MAYA_BRIEF, DEMO_NAV_IDS } from '@/lib/demo-data'

export const instant = false

export default async function ReviewPage(
  props: { params: Promise<{ opaqueId: string }> }
) {
  const { opaqueId } = await props.params
  void opaqueId

  const brief = DEMO_MAYA_BRIEF

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <DemoBanner />

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Back */}
        <Link
          href={`/brief/${DEMO_NAV_IDS.convMaya}/conversation`}
          className="text-sm text-[var(--bi-muted)] underline-offset-2 hover:underline"
        >
          ← Back to conversation
        </Link>

        {/* Hero */}
        <div className="mt-6">
          <h1 className="font-serif text-3xl leading-tight text-[var(--bi-ink)]">
            {brief.buyerName}&apos;s next home
          </h1>
          <p className="mt-2 text-sm text-[var(--bi-muted)]">
            From a {brief.conversationDuration}-minute conversation · {brief.subtitleDate}
          </p>
        </div>

        {/* IN A NUTSHELL */}
        <section className="mt-8">
          <SectionHeading>In a nutshell</SectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--bi-ink)]">{brief.nutshell}</p>
        </section>

        {/* MY NON-NEGOTIABLES */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <SectionHeading>My non-negotiables</SectionHeading>
            <EditIcon />
          </div>
          <div className="mt-3 divide-y divide-[var(--bi-line)] rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4">
            {brief.nonNegotiables.map((item) => (
              <ImportanceToggle
                key={item.text}
                text={item.text}
                initialImportance={item.importance}
              />
            ))}
          </div>
        </section>

        {/* THINGS I'D LOVE */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <SectionHeading>Things I&apos;d love</SectionHeading>
            <EditIcon />
          </div>
          <div className="mt-3 divide-y divide-[var(--bi-line)] rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4">
            {brief.thingsIdLove.map((item) => (
              <ImportanceToggle
                key={item.text}
                text={item.text}
                initialImportance={item.importance}
              />
            ))}
          </div>
        </section>

        {/* MY IDEAL LIFESTYLE */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <SectionHeading>My ideal lifestyle</SectionHeading>
            <EditIcon />
          </div>
          <ul className="mt-3 space-y-2">
            {brief.idealLifestyle.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--bi-ink)]">
                <span className="mt-0.5 text-[var(--bi-sage)]" aria-hidden="true">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* STYLES I'M DRAWN TO */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <SectionHeading>Styles I&apos;m drawn to</SectionHeading>
            <EditIcon />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {brief.styleSwatches.map((swatch) => (
              <div key={swatch.name} className="flex items-center gap-2 rounded-full border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-1.5">
                <span
                  className="h-4 w-4 rounded-full border border-[var(--bi-line)]"
                  style={{ backgroundColor: swatch.hex }}
                  aria-hidden="true"
                />
                <span className="text-xs text-[var(--bi-ink)]">{swatch.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RENOVATIONS I'D CONSIDER */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <SectionHeading>Renovations I&apos;d consider</SectionHeading>
            <EditIcon />
          </div>
          <div className="mt-3 space-y-2">
            {brief.renovationsToConsider.map((item) => (
              <label
                key={item}
                className="flex cursor-default items-center gap-3 rounded-lg border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  readOnly
                  className="h-4 w-4 rounded accent-[var(--bi-sage)] cursor-default"
                  aria-label={item}
                />
                <span className="text-sm text-[var(--bi-ink)]">{item}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Share CTA */}
        <div className="mt-10 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-apricot)] p-5 text-center">
          <Link
            href={`/brief/${DEMO_NAV_IDS.convMaya}/shared`}
            className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
          >
            Share with Hartfield &amp; Rowe
          </Link>
          <p className="mt-2 text-xs text-[var(--bi-muted)]">
            Sharing controls available after you&apos;ve reviewed your full brief
          </p>
        </div>
      </main>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
      {children}
    </h2>
  )
}

function EditIcon() {
  return (
    <span
      aria-label="Editing not yet available"
      title="Editing not yet available"
      className="text-xs text-[var(--bi-muted)] cursor-default select-none"
    >
      ✎
    </span>
  )
}
