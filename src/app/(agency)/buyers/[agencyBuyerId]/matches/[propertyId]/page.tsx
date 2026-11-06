import Link from 'next/link'
import { TrustBadge } from '@/components/shared/TrustBadge'
import {
  DEMO_LARKFIELD_FIT,
  DEMO_ASHGROVE_FIT,
  DEMO_PROPERTIES,
  DEMO_NAV_IDS,
  type FitItem,
  type PropertyFitData,
} from '@/lib/demo-data'

function getFitData(propertyId: string): PropertyFitData {
  if (propertyId === DEMO_NAV_IDS.propAshgrove) return DEMO_ASHGROVE_FIT
  return DEMO_LARKFIELD_FIT
}

interface FitSectionProps {
  icon: string
  heading: string
  items: FitItem[]
  emptyMessage?: string
}

function FitSection({ icon, heading, items, emptyMessage }: FitSectionProps) {
  if (items.length === 0 && emptyMessage) {
    return (
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--bi-ink)]">
          <span aria-hidden="true">{icon}</span> {heading}
        </h3>
        <p className="mt-2 text-sm text-[var(--bi-muted)] italic">{emptyMessage}</p>
      </div>
    )
  }
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--bi-ink)]">
        <span aria-hidden="true">{icon}</span> {heading}
      </h3>
      <div className="mt-2 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--bi-line)] bg-[var(--bi-surface)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-[var(--bi-ink)]">{item.label}</span>
              <TrustBadge status={item.status} className="shrink-0" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--bi-muted)]">{item.detail}</p>
            <p className="mt-1 text-[10px] text-[var(--bi-muted)] italic">Source: {item.source}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function PropertyFitPage(
  props: { params: Promise<{ agencyBuyerId: string; propertyId: string }> }
) {
  const { agencyBuyerId, propertyId } = await props.params
  const fit = getFitData(propertyId)

  const isLarkfield = propertyId === DEMO_PROPERTIES.larkfield.id
  const isAshgrove = propertyId === DEMO_PROPERTIES.ashgrove.id

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-[var(--bi-muted)]" aria-label="Breadcrumb">
          <Link href="/buyers" className="hover:text-[var(--bi-ink)] underline-offset-2 hover:underline">
            Buyers
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/buyers/${agencyBuyerId}`}
            className="hover:text-[var(--bi-ink)] underline-offset-2 hover:underline"
          >
            Maya and James Reid
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--bi-ink)]">Property fit</span>
        </nav>

        {/* Property selector tabs */}
        <div className="mt-4 flex items-center gap-2 border-b border-[var(--bi-line)] pb-0">
          <Link
            href={`/buyers/${agencyBuyerId}/matches/${DEMO_PROPERTIES.larkfield.id}`}
            className={`border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
              isLarkfield
                ? 'border-[var(--bi-ink)] text-[var(--bi-ink)]'
                : 'border-transparent text-[var(--bi-muted)] hover:text-[var(--bi-ink)]'
            }`}
          >
            Larkfield House
          </Link>
          <Link
            href={`/buyers/${agencyBuyerId}/matches/${DEMO_PROPERTIES.ashgrove.id}`}
            className={`border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
              isAshgrove
                ? 'border-[var(--bi-ink)] text-[var(--bi-ink)]'
                : 'border-transparent text-[var(--bi-muted)] hover:text-[var(--bi-ink)]'
            }`}
          >
            4 Ashgrove Place
          </Link>
          <button
            disabled
            title="Add property not available in demo"
            aria-disabled="true"
            className="border-b-2 border-transparent px-3 pb-2.5 text-sm text-[var(--bi-muted)] opacity-50 cursor-not-allowed"
          >
            + Add property
          </button>
        </div>

        {/* Caption */}
        <p className="mt-3 text-xs text-[var(--bi-muted)]">
          Compared against Maya and James&apos;s approved brief · 29 Oct ·{' '}
          <span className="font-medium">{fit.propertyPrice}</span>
        </p>

        {/* Fit sections */}
        <div className="mt-6 space-y-8">
          <FitSection
            icon="✓"
            heading="Strong matches"
            items={fit.strongMatches}
          />
          <FitSection
            icon="~"
            heading="Potential compromises"
            items={fit.compromises}
          />
          <FitSection
            icon="✕"
            heading="Conflicts with non-negotiables"
            items={fit.conflicts}
            emptyMessage="No conflicts with non-negotiables identified."
          />
          <FitSection
            icon="?"
            heading="Unknown — check before viewing"
            items={fit.unknowns}
          />

          {/* Worth asking */}
          {fit.worthAsking.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--bi-ink)]">Worth asking the Reids</h3>
              <ul className="mt-2 space-y-2">
                {fit.worthAsking.map((q) => (
                  <li
                    key={q}
                    className="rounded-lg border border-[var(--bi-line)] bg-[var(--bi-apricot)] px-3 py-2 text-sm text-[var(--bi-ink)]"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          {isLarkfield && (
            <Link
              href={`/viewing-briefs/${DEMO_NAV_IDS.briefLarkfield}`}
              className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
            >
              Create viewing brief →
            </Link>
          )}
          <button
            disabled
            title="Available after M2"
            aria-disabled="true"
            className="rounded-xl border border-[var(--bi-line)] px-4 py-2.5 text-sm text-[var(--bi-muted)] cursor-not-allowed opacity-50"
          >
            Send questions to Maya
          </button>
        </div>
      </div>
    </div>
  )
}
