import { requireAgentAuth } from '@/lib/auth'
import { computeDemandSnapshot, MINIMUM_COHORT, MINIMUM_CELL, type DemandSnapshot, type CohortRow } from '@/features/demand/index'
import { DEMO_DEMAND_SNAPSHOT } from '@/lib/demo-data'

// ─── Feature flag ─────────────────────────────────────────────────────────────

const LIVE_DEMAND_ENABLED = process.env.ENABLE_LIVE_DEMAND === 'true'

// ─── Seller pitch generator ───────────────────────────────────────────────────

function generatePitch(snapshot: DemandSnapshot): string {
  const date = new Date(snapshot.asOf).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const topArea = snapshot.byArea.find(r => r.count !== null)
  const topBedrooms = snapshot.byBedrooms.find(r => r.count !== null)
  const topBudget = snapshot.byBudget.find(r => r.count !== null)

  const areaPhrase = topArea ? ` in the ${topArea.label} area` : ''
  const bedroomsPhrase = topBedrooms ? `, many seeking ${topBedrooms.label.toLowerCase()} or more` : ''
  const budgetPhrase = topBudget ? ` with budgets predominantly in the ${topBudget.label.toLowerCase()} range` : ''
  const gardenPhrase =
    snapshot.gardenDemand?.count
      ? ` ${snapshot.gardenDemand.count} of these buyers have indicated a garden as a priority.`
      : ''

  return (
    `As of ${date}, ${snapshot.agencyName} has ${snapshot.totalActiveBuyers} active, recently verified ` +
    `buyers on its database${areaPhrase}${bedroomsPhrase}${budgetPhrase}.${gardenPhrase} ` +
    `These are indications of buyer preferences — not confirmed purchasers, offers, or valuations.`
  )
}

// ─── Cohort bar component ─────────────────────────────────────────────────────

function CohortBar({ rows, total }: { rows: CohortRow[]; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--bi-muted)]">No data recorded.</p>

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const pct = row.count !== null ? Math.round((row.count / total) * 100) : null
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--bi-ink)]">{row.label}</span>
              <span className="shrink-0 font-mono text-xs text-[var(--bi-muted)]">
                {row.count !== null ? row.count : `< ${MINIMUM_CELL}`}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--bi-line)]">
              <div
                className="h-1.5 rounded-full bg-[var(--bi-sage)]"
                style={{ width: pct !== null ? `${pct}%` : '0%', opacity: pct !== null ? 1 : 0.2 }}
              />
            </div>
          </div>
        )
      })}
      {rows.some(r => r.count === null) && (
        <p className="text-xs text-[var(--bi-muted)]">
          Bars marked «&thinsp;&lt;&nbsp;{MINIMUM_CELL}&thinsp;» are suppressed to protect buyer privacy.
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemandPage() {
  const agent = await requireAgentAuth()

  let snapshot: DemandSnapshot
  if (LIVE_DEMAND_ENABLED) {
    snapshot = await computeDemandSnapshot(agent.agencyId)
  } else {
    snapshot = DEMO_DEMAND_SNAPSHOT
  }

  const isDemo = snapshot.source === 'demo'
  const pitch = snapshot.suppressed ? null : generatePitch(snapshot)

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Buyer Demand Radar</h1>
          <p className="mt-1 text-sm text-[var(--bi-muted)]">
            Aggregate preferences from active, verified buyers — for seller appointments only.
          </p>
        </div>

        {/* Demo mode banner */}
        {isDemo && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              <strong>Example data only.</strong> This snapshot uses fictional buyers to demonstrate the feature.
              Live demand data requires enabling the feature flag and completing a privacy review.
            </p>
          </div>
        )}

        {/* Suppressed state */}
        {snapshot.suppressed ? (
          <div className="mt-8 rounded-xl border border-[var(--bi-line)] p-8 text-center">
            <p className="font-medium text-[var(--bi-ink)]">Not enough active buyers for a snapshot</p>
            <p className="mt-2 text-sm text-[var(--bi-muted)]">
              A minimum of {MINIMUM_COHORT} active buyers with verified profiles is required before any
              aggregate demand data can be shown. This protects buyer privacy.
            </p>
            <p className="mt-4 text-xs text-[var(--bi-muted)]">
              {snapshot.totalActiveBuyers} eligible buyer{snapshot.totalActiveBuyers !== 1 ? 's' : ''} at this time.
            </p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="mt-6 flex gap-4">
              <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                  Active buyers
                </p>
                <p className="mt-1 font-serif text-3xl text-[var(--bi-ink)]">
                  {snapshot.totalActiveBuyers}
                </p>
                <p className="mt-0.5 text-xs text-[var(--bi-muted)]">
                  Snapshot: {new Date(snapshot.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {snapshot.gardenDemand?.count != null && (
                <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                    Garden required
                  </p>
                  <p className="mt-1 font-serif text-3xl text-[var(--bi-ink)]">
                    {snapshot.gardenDemand.count}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--bi-muted)]">buyers recorded this</p>
                </div>
              )}
            </div>

            {/* Cohort groups */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {snapshot.byArea.length > 0 && (
                <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                    Search area
                  </h2>
                  <div className="mt-3">
                    <CohortBar rows={snapshot.byArea} total={snapshot.totalActiveBuyers} />
                  </div>
                </div>
              )}

              {snapshot.byBedrooms.length > 0 && (
                <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                    Minimum bedrooms
                  </h2>
                  <div className="mt-3">
                    <CohortBar rows={snapshot.byBedrooms} total={snapshot.totalActiveBuyers} />
                  </div>
                </div>
              )}

              {snapshot.byBudget.length > 0 && (
                <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-5 sm:col-span-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                    Budget range (maximum stated)
                  </h2>
                  <div className="mt-3">
                    <CohortBar rows={snapshot.byBudget} total={snapshot.totalActiveBuyers} />
                  </div>
                </div>
              )}
            </div>

            {/* Seller pitch */}
            {pitch && (
              <div className="mt-6 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                  Seller appointment snapshot
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--bi-ink)]">{pitch}</p>
                <p className="mt-3 text-xs text-[var(--bi-muted)]">
                  Copy this paragraph to use in a seller pitch. The disclaimer below must accompany any use.
                </p>
              </div>
            )}

            {/* Exclusions */}
            <div className="mt-4 rounded-xl border border-[var(--bi-line)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                What this snapshot excludes
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--bi-muted)]">
                <li>· {snapshot.exclusions.inactive} buyer{snapshot.exclusions.inactive !== 1 ? 's' : ''} with inactive status</li>
                <li>· {snapshot.exclusions.staleProfile} buyer{snapshot.exclusions.staleProfile !== 1 ? 's' : ''} whose profile is more than 90 days old</li>
                <li>· {snapshot.exclusions.noApprovedProfile} buyer{snapshot.exclusions.noApprovedProfile !== 1 ? 's' : ''} without an approved home brief</li>
                <li>· Individual preferences, names, contact details, transcript excerpts, or property-match scores</li>
                <li>· Any buyer cohort smaller than {MINIMUM_CELL} (shown as suppressed)</li>
              </ul>
            </div>
          </>
        )}

        {/* Disclaimer — always shown */}
        <div className="mt-6 rounded-xl border border-[var(--bi-line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Disclaimer</p>
          <p className="mt-2 text-xs text-[var(--bi-muted)] leading-relaxed">{snapshot.disclaimer}</p>
          <p className="mt-2 text-xs text-[var(--bi-muted)]">
            Before using this information in a seller-facing context, confirm that your agency's data processing
            agreements and buyer consent notices cover aggregate use for property marketing. Contact your data
            protection lead if unsure.
          </p>
        </div>
      </div>
    </div>
  )
}
