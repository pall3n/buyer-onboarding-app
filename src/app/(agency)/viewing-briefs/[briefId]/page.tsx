import Link from 'next/link'
import { PrintActions } from '@/components/agency/PrintActions'
import { DEMO_VIEWING_BRIEF, DEMO_NAV_IDS } from '@/lib/demo-data'

export const instant = false

export default async function ViewingBriefPage(
  props: { params: Promise<{ briefId: string }> }
) {
  const { briefId } = await props.params
  void briefId // all demo briefs resolve to the same fixture

  const brief = DEMO_VIEWING_BRIEF

  // Build plain-text copy version
  const copyText = [
    `VIEWING BRIEF`,
    `${brief.buyerName} — ${brief.propertyName}`,
    `${brief.propertyAddress}`,
    `Prepared by ${brief.agentName}, ${brief.agencyName}`,
    `${brief.preparedDate}`,
    '',
    ...brief.sections.flatMap((s) => [
      s.heading.toUpperCase(),
      Array.isArray(s.body) ? s.body.map((b, i) => `${i + 1}. ${b}`).join('\n') : s.body,
      '',
    ]),
  ].join('\n')

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Breadcrumb + actions */}
        <div className="no-print flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-1 text-xs text-[var(--bi-muted)]" aria-label="Breadcrumb">
            <Link
              href={`/buyers/${DEMO_NAV_IDS.buyerMaya}/matches/${DEMO_NAV_IDS.propLarkfield}`}
              className="hover:text-[var(--bi-ink)] underline-offset-2 hover:underline"
            >
              Property fit
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--bi-ink)]">Viewing brief</span>
          </nav>
          <PrintActions copyText={copyText} />
        </div>

        {/* Document */}
        <article className="rounded-2xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-8 shadow-sm print:rounded-none print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <header className="border-b border-[var(--bi-line)] pb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
              Viewing brief
            </p>
            <h1 className="mt-2 font-serif text-2xl text-[var(--bi-ink)]">
              {brief.propertyName}
            </h1>
            <p className="mt-1 text-sm text-[var(--bi-muted)]">{brief.propertyAddress}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Buyer</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{brief.buyerName}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Prepared by</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{brief.agentName}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Date</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{brief.preparedDate}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Agency</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{brief.agencyName}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Brief source</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{brief.conversationDuration}-min conversation</p>
              </div>
            </div>
          </header>

          {/* Sections */}
          <div className="mt-6 space-y-8">
            {brief.sections.map((section, i) => (
              <section key={i} className="break-inside-avoid">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                  {section.heading}
                </h2>
                <div className="mt-2">
                  {Array.isArray(section.body) ? (
                    <ol className="space-y-2">
                      {section.body.map((item, j) => (
                        <li key={j} className="flex gap-3 text-sm text-[var(--bi-ink)]">
                          <span className="mt-0.5 shrink-0 text-[var(--bi-muted)]">{j + 1}.</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm leading-relaxed text-[var(--bi-ink)]">{section.body}</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
