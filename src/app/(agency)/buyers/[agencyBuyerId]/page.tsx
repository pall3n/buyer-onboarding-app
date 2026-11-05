import Link from 'next/link'
import { TrustBadge } from '@/components/shared/TrustBadge'
import {
  DEMO_BUYERS,
  DEMO_PROPERTIES,
  DEMO_NAV_IDS,
  type BuyerProfile,
} from '@/lib/demo-data'

export const instant = false

function getBuyer(agencyBuyerId: string): BuyerProfile {
  if (agencyBuyerId === DEMO_NAV_IDS.buyerAmara) return DEMO_BUYERS.amara
  return DEMO_BUYERS.maya
}

export default async function AgencyBuyerProfilePage(
  props: { params: Promise<{ agencyBuyerId: string }> }
) {
  const { agencyBuyerId } = await props.params
  const buyer = getBuyer(agencyBuyerId)

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-[var(--bi-muted)]" aria-label="Breadcrumb">
          <Link href="/buyers" className="hover:text-[var(--bi-ink)] underline-offset-2 hover:underline">
            Buyers
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--bi-ink)]">{buyer.displayName}</span>
        </nav>

        {/* Status line */}
        <div className="mt-4">
          <h1 className="text-xl font-semibold text-[var(--bi-ink)]">{buyer.displayName}</h1>
          <p className="mt-1 text-sm text-[var(--bi-muted)]">
            {buyer.status} · Brief approved {buyer.briefDate} · {buyer.conversationDuration} · {buyer.buyingPosition}
          </p>
        </div>

        {/* Quick facts */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {buyer.quickFacts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                {fact.label}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--bi-ink)]">{fact.value}</p>
              <div className="mt-1">
                <TrustBadge status={fact.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Evaluate a property */}
        <div className="mt-6">
          <Link
            href={`/buyers/${agencyBuyerId}/matches/${DEMO_PROPERTIES.larkfield.id}`}
            className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
          >
            Evaluate a property →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Left: expandable sections */}
          <div className="space-y-3">
            {/* Top three priorities */}
            <details className="group rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]" open>
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                Top priorities
                <span className="text-[var(--bi-muted)] group-open:rotate-180 transition-transform text-xs">▾</span>
              </summary>
              <div className="border-t border-[var(--bi-line)] px-4 py-3 space-y-4">
                {buyer.topPriorities.map((p) => (
                  <div key={p.label}>
                    <div className="flex items-center gap-2">
                      <TrustBadge status={p.status} />
                      <span className="text-sm font-medium text-[var(--bi-ink)]">{p.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--bi-muted)]">{p.detail}</p>
                    <blockquote className="mt-1 border-l-2 border-[var(--bi-sage-pale)] pl-2 text-xs italic text-[var(--bi-muted)]">
                      {p.evidence}
                    </blockquote>
                  </div>
                ))}
              </div>
            </details>

            {/* Dealbreakers */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                Dealbreakers
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <ul className="border-t border-[var(--bi-line)] px-4 py-3 space-y-1.5">
                {buyer.dealbreakers.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-[var(--bi-ink)]">
                    <span className="mt-0.5 text-[var(--bi-danger)] text-xs" aria-hidden="true">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </details>

            {/* Lifestyle signals */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                Lifestyle signals
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <ul className="border-t border-[var(--bi-line)] px-4 py-3 space-y-1.5">
                {buyer.lifestyleSignals.map((s) => (
                  <li key={s} className="text-sm text-[var(--bi-ink)]">· {s}</li>
                ))}
              </ul>
            </details>

            {/* Taste */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                Taste
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <div className="border-t border-[var(--bi-line)] px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {buyer.colourTaste.map((swatch) => (
                    <div key={swatch.name} className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 rounded-full border border-[var(--bi-line)]"
                        style={{ backgroundColor: swatch.hex }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-[var(--bi-muted)]">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Renovation flexibility */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                Renovation flexibility
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <div className="border-t border-[var(--bi-line)] px-4 py-3">
                <div className="flex items-center justify-between text-xs text-[var(--bi-muted)] mb-1">
                  <span>Move-in ready</span>
                  <span>Full project</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bi-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--bi-sage)]"
                    style={{ width: `${buyer.renovationFlexibilityPct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-[var(--bi-muted)]">
                  {buyer.renovationFlexibilityPct}% flexibility
                </p>
              </div>
            </details>

            {/* How they trade off */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                How they trade off
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <div className="border-t border-[var(--bi-line)] px-4 py-3 space-y-4">
                {buyer.tradeOffs.map((t) => (
                  <div key={t.leftLabel}>
                    <div className="flex items-center justify-between text-xs text-[var(--bi-muted)] mb-1">
                      <span>{t.leftLabel}</span>
                      <span>{t.rightLabel}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bi-surface-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--bi-sage)]"
                        style={{ width: `${t.position}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--bi-muted)]">{t.note}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* In their words */}
            <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--bi-ink)] marker:content-none">
                In their words
                <span className="text-[var(--bi-muted)] text-xs">▾</span>
              </summary>
              <div className="border-t border-[var(--bi-line)] px-4 py-3">
                <blockquote className="border-l-2 border-[var(--bi-sage)] pl-3 text-sm italic leading-relaxed text-[var(--bi-ink)]">
                  {buyer.inTheirWords}
                </blockquote>
                <p className="mt-2 text-xs text-[var(--bi-muted)]">— {buyer.inTheirWordsAttribution}</p>
              </div>
            </details>
          </div>

          {/* Right: agency notes */}
          <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4 h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
              Agency notes
            </h2>
            <textarea
              readOnly
              placeholder="Agency notes available after M2"
              className="mt-2 w-full resize-none rounded-lg border border-[var(--bi-line)] bg-[var(--bi-surface-soft)] px-3 py-2 text-xs text-[var(--bi-muted)] focus:outline-none"
              rows={6}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
