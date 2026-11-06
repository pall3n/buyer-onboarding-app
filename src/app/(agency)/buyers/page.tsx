import Link from 'next/link'
import { BuyerCard } from '@/components/agency/BuyerCard'
import { PropertyEvalCard } from '@/components/agency/PropertyEvalCard'
import { DEMO_BUYERS, DEMO_PROPERTIES, DEMO_NAV_IDS } from '@/lib/demo-data'

export default function BuyersPage() {
  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-4xl">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-[var(--bi-ink)]">
              Good morning, Sophie
            </h1>
            <p className="mt-1 text-sm text-[var(--bi-muted)]">
              Tuesday, 29 October 2024
            </p>
          </div>
          <Link
            href="/buyers/invite"
            className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-2 text-sm text-[var(--bi-ink)] transition-colors hover:border-[var(--bi-sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
          >
            Invite buyer
          </Link>
        </div>

        {/* Ready to read */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Ready to read
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <BuyerCard
              id={DEMO_NAV_IDS.buyerMaya}
              displayName={DEMO_BUYERS.maya.displayName}
              status={DEMO_BUYERS.maya.status}
              briefDate={DEMO_BUYERS.maya.briefDate}
              approvedTimeAgo={DEMO_BUYERS.maya.approvedTimeAgo}
              conversationDuration={DEMO_BUYERS.maya.conversationDuration}
            />
            <BuyerCard
              id={DEMO_NAV_IDS.buyerAmara}
              displayName={DEMO_BUYERS.amara.displayName}
              status={DEMO_BUYERS.amara.status}
              briefDate={DEMO_BUYERS.amara.briefDate}
              approvedTimeAgo={DEMO_BUYERS.amara.approvedTimeAgo}
              conversationDuration={DEMO_BUYERS.amara.conversationDuration}
            />
          </div>
        </section>

        {/* Recent property evaluations */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Recent property evaluations
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PropertyEvalCard
              buyerId={DEMO_NAV_IDS.buyerMaya}
              propertyId={DEMO_PROPERTIES.larkfield.id}
              address={DEMO_PROPERTIES.larkfield.address}
              price={DEMO_PROPERTIES.larkfield.price}
              verdict={DEMO_PROPERTIES.larkfield.verdict}
            />
            <PropertyEvalCard
              buyerId={DEMO_NAV_IDS.buyerMaya}
              propertyId={DEMO_PROPERTIES.ashgrove.id}
              address={DEMO_PROPERTIES.ashgrove.address}
              price={DEMO_PROPERTIES.ashgrove.price}
              verdict={DEMO_PROPERTIES.ashgrove.verdict}
            />
            <PropertyEvalCard
              buyerId={DEMO_NAV_IDS.buyerAmara}
              propertyId={DEMO_PROPERTIES.calverley.id}
              address={DEMO_PROPERTIES.calverley.address}
              price={DEMO_PROPERTIES.calverley.price}
              verdict={DEMO_PROPERTIES.calverley.verdict}
            />
          </div>
        </section>

        {/* Quick links for demo navigation */}
        <section className="mt-10 rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Demo navigation
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/invite/${DEMO_NAV_IDS.inviteMaya}`}
              className="rounded-md bg-[var(--bi-surface)] border border-[var(--bi-line)] px-3 py-1.5 text-xs text-[var(--bi-ink)] hover:border-[var(--bi-sage)] transition-colors"
            >
              Screen B — Buyer invitation
            </Link>
            <Link
              href={`/brief/${DEMO_NAV_IDS.convMaya}/conversation`}
              className="rounded-md bg-[var(--bi-surface)] border border-[var(--bi-line)] px-3 py-1.5 text-xs text-[var(--bi-ink)] hover:border-[var(--bi-sage)] transition-colors"
            >
              Screen C — Conversation
            </Link>
            <Link
              href={`/brief/${DEMO_NAV_IDS.convMaya}/review`}
              className="rounded-md bg-[var(--bi-surface)] border border-[var(--bi-line)] px-3 py-1.5 text-xs text-[var(--bi-ink)] hover:border-[var(--bi-sage)] transition-colors"
            >
              Screen D — Home brief
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
