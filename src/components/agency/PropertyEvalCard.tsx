import Link from 'next/link'
import { TrustBadge, type TrustStatus } from '@/components/shared/TrustBadge'

interface PropertyEvalCardProps {
  buyerId: string
  propertyId: string
  address: string
  price: string
  verdict: TrustStatus
}

export function PropertyEvalCard({
  buyerId,
  propertyId,
  address,
  price,
  verdict,
}: PropertyEvalCardProps) {
  return (
    <Link
      href={`/buyers/${buyerId}/matches/${propertyId}`}
      className="block rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4 transition-colors hover:border-[var(--bi-sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--bi-ink)]">{address}</p>
          <p className="mt-0.5 text-sm text-[var(--bi-muted)]">{price}</p>
        </div>
        <TrustBadge status={verdict} className="shrink-0" />
      </div>
    </Link>
  )
}
