import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAgentAuth } from '@/lib/auth'
import {
  buildAndPersistShortlist,
  loadShortlistForProperty,
  approveCandidate,
  dismissCandidate,
  type OutreachCandidate,
} from '@/features/outreach/index'
import { DEMO_SHORTLIST, DEMO_NAV_IDS } from '@/lib/demo-data'

// ─── Server actions ────────────────────────────────────────────────────────────

async function buildShortlistAction(propertyId: string, agencyId: string) {
  'use server'
  const agent = await requireAgentAuth()
  if (agent.agencyId !== agencyId) return
  await buildAndPersistShortlist(propertyId, agencyId)
  revalidatePath(`/properties/${propertyId}/shortlist`)
}

async function approveAction(propertyId: string, candidateId: string, agencyId: string) {
  'use server'
  const agent = await requireAgentAuth()
  if (agent.agencyId !== agencyId) return
  await approveCandidate(candidateId, agent.userId, agencyId)
  revalidatePath(`/properties/${propertyId}/shortlist`)
}

async function dismissAction(propertyId: string, candidateId: string, agencyId: string) {
  'use server'
  const agent = await requireAgentAuth()
  if (agent.agencyId !== agencyId) return
  await dismissCandidate(candidateId, agencyId)
  revalidatePath(`/properties/${propertyId}/shortlist`)
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OutreachCandidate['status'] }) {
  if (status === 'approved') {
    return (
      <span className="rounded-full bg-[var(--bi-sage-light)] px-2 py-0.5 text-xs font-medium text-[var(--bi-sage)]">
        Approved for outreach
      </span>
    )
  }
  if (status === 'dismissed') {
    return (
      <span className="rounded-full bg-[var(--bi-line)] px-2 py-0.5 text-xs font-medium text-[var(--bi-muted)]">
        Dismissed
      </span>
    )
  }
  return null
}

// ─── Eligibility note ─────────────────────────────────────────────────────────

function EligibilityNote({ candidate }: { candidate: OutreachCandidate }) {
  if (candidate.eligibility === 'eligible' && !candidate.hasHardConflicts) return null

  if (candidate.eligibility === 'ineligible_opted_out') {
    return (
      <p className="mt-1 text-xs text-red-600">
        Opted out of outreach — do not contact about new listings
      </p>
    )
  }
  if (candidate.eligibility === 'ineligible_no_profile') {
    return (
      <p className="mt-1 text-xs text-[var(--bi-muted)]">
        No approved profile — buyer must complete the conversation first
      </p>
    )
  }
  if (candidate.eligibility === 'ineligible_stale') {
    return (
      <p className="mt-1 text-xs text-[var(--bi-muted)]">
        Profile is more than 90 days old — ask buyer to refresh before outreach
      </p>
    )
  }
  if (candidate.hasHardConflicts) {
    return (
      <p className="mt-1 text-xs text-amber-700">
        Hard conflicts: {candidate.conflictLabels.join(', ')}
      </p>
    )
  }
  return null
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  propertyId,
  agencyId,
  isDemo,
}: {
  candidate: OutreachCandidate
  propertyId: string
  agencyId: string
  isDemo: boolean
}) {
  const isIneligible = candidate.eligibility !== 'eligible'
  const boundApprove = approveAction.bind(null, propertyId, candidate.id, agencyId)
  const boundDismiss = dismissAction.bind(null, propertyId, candidate.id, agencyId)

  return (
    <div
      className={[
        'rounded-xl border p-5',
        isIneligible
          ? 'border-[var(--bi-line)] bg-[var(--bi-background)] opacity-70'
          : 'border-[var(--bi-line)] bg-[var(--bi-surface)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[var(--bi-ink)]">{candidate.buyerName}</p>
            <StatusBadge status={candidate.status} />
          </div>
          <EligibilityNote candidate={candidate} />
          {candidate.approvedAt && candidate.approvedBy && (
            <p className="mt-0.5 text-xs text-[var(--bi-muted)]">
              Approved by {candidate.approvedBy} on{' '}
              {new Date(candidate.approvedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>

        {/* Action buttons — only for eligible, non-approved, non-demo */}
        {candidate.status === 'pending' && !isIneligible && !isDemo && (
          <div className="flex items-center gap-2 shrink-0">
            <form action={boundDismiss}>
              <button
                type="submit"
                className="rounded-lg border border-[var(--bi-line)] px-3 py-1.5 text-sm text-[var(--bi-muted)] transition-colors hover:border-[var(--bi-ink)] hover:text-[var(--bi-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
              >
                Dismiss
              </button>
            </form>
            <form action={boundApprove}>
              <button
                type="submit"
                className="rounded-lg bg-[var(--bi-sage)] px-3 py-1.5 text-sm text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
              >
                Approve for outreach
              </button>
            </form>
          </div>
        )}

        {/* Demo — read-only action hint */}
        {candidate.status === 'pending' && !isIneligible && isDemo && (
          <div className="shrink-0">
            <span className="rounded-lg border border-dashed border-[var(--bi-line)] px-3 py-1.5 text-xs text-[var(--bi-muted)]">
              Demo — approve / dismiss disabled
            </span>
          </div>
        )}
      </div>

      {/* Match reasons */}
      {candidate.matchReasons.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Why matched
          </p>
          <ul className="mt-1 space-y-0.5">
            {candidate.matchReasons.map((reason) => (
              <li key={reason} className="text-sm text-[var(--bi-ink)]">
                · {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Communication preferences */}
      <div className="mt-3 flex items-center gap-3">
        <p className="text-xs text-[var(--bi-muted)]">Contact preferences recorded:</p>
        <span
          className={[
            'rounded px-1.5 py-0.5 text-xs',
            candidate.communicationPrefs.emailOk
              ? 'bg-[var(--bi-sage-light)] text-[var(--bi-sage)]'
              : 'bg-[var(--bi-line)] text-[var(--bi-muted)] line-through',
          ].join(' ')}
        >
          Email
        </span>
        <span
          className={[
            'rounded px-1.5 py-0.5 text-xs',
            candidate.communicationPrefs.smsOk
              ? 'bg-[var(--bi-sage-light)] text-[var(--bi-sage)]'
              : 'bg-[var(--bi-line)] text-[var(--bi-muted)] line-through',
          ].join(' ')}
        >
          SMS
        </span>
      </div>

      {/* Draft message */}
      {candidate.draftMessage && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)] hover:text-[var(--bi-ink)]">
            Draft message ▾
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--bi-line)] bg-[var(--bi-background)] p-3 font-sans text-sm text-[var(--bi-ink)]">
            {candidate.draftMessage}
          </pre>
        </details>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ShortlistPage(props: {
  params: Promise<{ propertyId: string }>
}) {
  const { propertyId } = await props.params
  const isDemo = propertyId.startsWith('demo-')

  let shortlist: typeof DEMO_SHORTLIST | null = null
  let agencyId = ''

  if (isDemo) {
    // Always show the Larkfield demo shortlist regardless of which demo property
    shortlist = DEMO_SHORTLIST
    agencyId = 'demo-agency'
  } else {
    const agent = await requireAgentAuth()
    agencyId = agent.agencyId
    shortlist = await loadShortlistForProperty(propertyId, agencyId)
  }

  const eligibleCount = shortlist?.candidates.filter(c => c.eligibility === 'eligible').length ?? 0
  const ineligibleCount = shortlist?.candidates.filter(c => c.eligibility !== 'eligible').length ?? 0
  const approvedCount = shortlist?.candidates.filter(c => c.status === 'approved').length ?? 0

  const boundBuild = buildShortlistAction.bind(null, propertyId, agencyId)

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
              Buyer shortlist
            </p>
            <h1 className="mt-0.5 font-serif text-2xl text-[var(--bi-ink)]">
              {shortlist?.propertyAddress ?? 'Property'}
            </h1>
            {shortlist?.propertyPrice && (
              <p className="mt-0.5 text-sm text-[var(--bi-muted)]">{shortlist.propertyPrice}</p>
            )}
          </div>
        </div>

        {/* Important notice */}
        <div className="mt-6 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-apricot)] p-4">
          <p className="text-sm text-[var(--bi-ink)]">
            <strong>Approval records your review only.</strong> No messages are sent automatically.
            Before any outreach, verify that each buyer has given explicit consent for the channel
            you intend to use, and that it complies with your PECR/GDPR obligations.
          </p>
        </div>

        {/* Summary + build action */}
        {shortlist ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--bi-muted)]">
              {eligibleCount} eligible · {ineligibleCount} ineligible ·{' '}
              {approvedCount} approved for outreach
            </p>
            {!isDemo && (
              <form action={boundBuild}>
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--bi-line)] bg-white px-3 py-1.5 text-sm text-[var(--bi-ink)] transition-colors hover:border-[var(--bi-sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                >
                  Rebuild shortlist
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--bi-muted)]">
              No shortlist built yet.
            </p>
            {!isDemo && (
              <form action={boundBuild}>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--bi-sage)] px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                >
                  Build shortlist
                </button>
              </form>
            )}
          </div>
        )}

        {/* Candidate list */}
        {shortlist && shortlist.candidates.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Eligible first, then ineligible */}
            {[
              ...shortlist.candidates.filter(c => c.eligibility === 'eligible'),
              ...shortlist.candidates.filter(c => c.eligibility !== 'eligible'),
            ].map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                propertyId={propertyId}
                agencyId={agencyId}
                isDemo={isDemo}
              />
            ))}
          </div>
        )}

        {/* Eligibility criteria footnote */}
        <div className="mt-8 rounded-xl border border-[var(--bi-line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Eligibility criteria
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--bi-muted)]">
            <li>· Buyer has an approved home brief with this agency</li>
            <li>· Profile was updated within the last 90 days</li>
            <li>· No hard conflicts identified between buyer preferences and this property</li>
          </ul>
          <p className="mt-2 text-xs text-[var(--bi-muted)]">
            Buyers without a recorded analysis for this property are included as potentially eligible
            but should be evaluated before any outreach.
          </p>
        </div>
      </div>
    </div>
  )
}
