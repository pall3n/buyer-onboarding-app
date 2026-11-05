import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const trustBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        confirmed: 'bg-[#e7eee8] text-[#2d5a3d]',
        suggested: 'bg-[#f2e6d8] text-[#7a4a1e]',
        unknown: 'bg-[#f0f1eb] text-[#69736b]',
        conflict: 'bg-[#fde8e6] text-[#a44c3b]',
      },
    },
    defaultVariants: {
      status: 'unknown',
    },
  }
)

const LABEL: Record<TrustStatus, string> = {
  confirmed: 'Confirmed',
  suggested: 'Suggested',
  unknown: 'Unknown',
  conflict: 'Conflict',
}

const ICON: Record<TrustStatus, string> = {
  confirmed: '●',
  suggested: '★',
  unknown: '?',
  conflict: '✕',
}

export type TrustStatus = 'confirmed' | 'suggested' | 'unknown' | 'conflict'

interface TrustBadgeProps extends VariantProps<typeof trustBadgeVariants> {
  status: TrustStatus
  className?: string
}

export function TrustBadge({ status, className }: TrustBadgeProps) {
  return (
    <span
      className={cn(trustBadgeVariants({ status }), className)}
      data-status={status}
      aria-label={LABEL[status]}
    >
      <span aria-hidden="true" className="text-[0.6rem] leading-none">
        {ICON[status]}
      </span>
      {LABEL[status]}
    </span>
  )
}
