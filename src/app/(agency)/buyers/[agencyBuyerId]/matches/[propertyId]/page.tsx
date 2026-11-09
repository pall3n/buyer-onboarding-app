'use server'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { TrustBadge } from '@/components/shared/TrustBadge'
import { requireAgentAuth } from '@/lib/auth/index'
import { loadAnalysis } from '@/features/matching/index'
import { createBrief, loadBriefIdForBuyerAndProperty } from '@/features/viewing-briefs/index'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  DEMO_LARKFIELD_FIT,
  DEMO_ASHGROVE_FIT,
  DEMO_PROPERTIES,
  DEMO_NAV_IDS,
  type FitItem,
  type PropertyFitData,
} from '@/lib/demo-data'

function isDemoId(id: string): boolean {
  return id.startsWith('demo-')
}

function getDemoFit(propertyId: string): PropertyFitData {
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

async function runAnalysisAction(agencyBuyerId: string, propertyId: string) {
  'use server'
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agencyBuyerId, propertyId }),
  })
  revalidatePath(`/buyers/${agencyBuyerId}/matches/${propertyId}`)
}

async function createBriefAction(agencyBuyerId: string, propertyId: string) {
  'use server'
  const agent = await requireAgentAuth()
  const briefId = await createBrief(agencyBuyerId, propertyId, agent)
  redirect(`/viewing-briefs/${briefId}`)
}

async function getBuyerName(agencyBuyerId: string): Promise<string> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('agency_buyers')
    .select('buyer_subjects(name)')
    .eq('id', agencyBuyerId)
    .single()
  const subjects = data?.buyer_subjects as Array<{ name: string }> | { name: string } | null
  if (Array.isArray(subjects)) return subjects[0]?.name ?? 'Buyer'
  return (subjects as { name?: string } | null)?.name ?? 'Buyer'
}

export default async function PropertyFitPage(
  props: { params: Promise<{ agencyBuyerId: string; propertyId: string }> }
) {
  const { agencyBuyerId, propertyId } = await props.params

  const isDemo = isDemoId(agencyBuyerId) || isDemoId(propertyId)

  let fit: PropertyFitData | null = null
  let buyerName = 'Maya and James Reid'
  let existingBriefId: string | null = null

  if (isDemo) {
    fit = getDemoFit(propertyId)
  } else {
    await requireAgentAuth()
    fit = await loadAnalysis(agencyBuyerId, propertyId)
    buyerName = await getBuyerName(agencyBuyerId)
    if (fit !== null) {
      existingBriefId = await loadBriefIdForBuyerAndProperty(agencyBuyerId, propertyId)
    }
  }

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
            {buyerName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--bi-ink)]">Property fit</span>
        </nav>

        {/* Property selector tabs */}
        <div className="mt-4 flex items-center gap-2 border-b border-[var(--bi-line)] pb-0">
          {isDemo && (
            <>
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
            </>
          )}
          <button
            disabled
            title="Add property not available in demo"
            aria-disabled="true"
            className="border-b-2 border-transparent px-3 pb-2.5 text-sm text-[var(--bi-muted)] opacity-50 cursor-not-allowed"
          >
            + Add property
          </button>
        </div>

        {/* No analysis yet — show run button */}
        {!isDemo && fit === null && (
          <div className="mt-10 flex flex-col items-start gap-4">
            <p className="text-sm text-[var(--bi-muted)]">
              No analysis has been run for this buyer and property yet.
            </p>
            <form action={runAnalysisAction.bind(null, agencyBuyerId, propertyId)}>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-[var(--bi-sage)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
              >
                Run analysis
              </button>
            </form>
          </div>
        )}

        {/* Fit sections */}
        {fit !== null && (
          <>
            <p className="mt-3 text-xs text-[var(--bi-muted)]">
              {isDemo
                ? `Compared against ${buyerName}'s approved brief · 29 Oct · `
                : 'Compared against latest brief · '}
              <span className="font-medium">{fit.propertyPrice}</span>
            </p>

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

              {fit.worthAsking.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--bi-ink)]">Worth asking the {buyerName}</h3>
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
              {/* Demo: link to static brief */}
              {isDemo && isLarkfield && (
                <Link
                  href={`/viewing-briefs/${DEMO_NAV_IDS.briefLarkfield}`}
                  className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                >
                  Create viewing brief →
                </Link>
              )}
              {/* Real session: open existing brief or create new one */}
              {!isDemo && existingBriefId && (
                <Link
                  href={`/viewing-briefs/${existingBriefId}`}
                  className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                >
                  Open viewing brief →
                </Link>
              )}
              {!isDemo && !existingBriefId && (
                <form action={createBriefAction.bind(null, agencyBuyerId, propertyId)}>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                  >
                    Create viewing brief →
                  </button>
                </form>
              )}
              {!isDemo && (
                <form action={runAnalysisAction.bind(null, agencyBuyerId, propertyId)}>
                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--bi-line)] px-4 py-2.5 text-sm text-[var(--bi-muted)] hover:text-[var(--bi-ink)] hover:border-[var(--bi-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                  >
                    Re-run analysis
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
