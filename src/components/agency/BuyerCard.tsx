import Link from 'next/link'

interface BuyerCardProps {
  id: string
  displayName: string
  status: string
  briefDate: string
  approvedTimeAgo: string
  conversationDuration: string
}

export function BuyerCard({
  id,
  displayName,
  status,
  briefDate,
  approvedTimeAgo,
  conversationDuration,
}: BuyerCardProps) {
  return (
    <Link
      href={`/buyers/${id}`}
      className="block rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4 transition-colors hover:border-[var(--bi-sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-[var(--bi-ink)]">{displayName}</h3>
        <span className="shrink-0 rounded-full bg-[var(--bi-sage-pale)] px-2.5 py-0.5 text-xs text-[var(--bi-sage)]">
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--bi-muted)]">
        Brief from {briefDate} · {conversationDuration}
      </p>
      <p className="text-xs text-[var(--bi-muted)]">Approved {approvedTimeAgo}</p>
    </Link>
  )
}
