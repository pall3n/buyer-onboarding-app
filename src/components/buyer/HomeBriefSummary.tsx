import type { HomeBriefData } from '@/lib/demo-data'

interface HomeBriefSummaryProps {
  data: HomeBriefData
  topicsDone: number
  topicsTotal: number
}

export function HomeBriefSummary({ data, topicsDone, topicsTotal }: HomeBriefSummaryProps) {
  const pct = Math.round((topicsDone / topicsTotal) * 100)

  return (
    <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] p-4">
      <h2 className="text-sm font-semibold text-[var(--bi-ink)]">Your brief is taking shape</h2>
      <p className="mt-0.5 text-xs text-[var(--bi-muted)]">
        {topicsDone} of {topicsTotal} topics noted
      </p>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${topicsDone} of ${topicsTotal} topics covered`}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bi-surface-soft)]"
      >
        <div
          className="h-full rounded-full bg-[var(--bi-sage)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 space-y-3 text-xs text-[var(--bi-ink)]">
        <Section label="Location">Sevenoaks area, walkable to town</Section>
        <Section label="Must-haves">Secure garden · 3+ beds · Character property</Section>
        <Section label="Budget">£650k–£800k</Section>
        <Section label="Timing">Flexible, month-to-month rental</Section>
        <Section label="Dealbreakers">No enclosed garden · Busy road · New-build</Section>
      </div>

      <p className="mt-4 text-[10px] text-[var(--bi-muted)]">
        Pre-filled from your conversation · {data.conversationDuration} min
      </p>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-medium text-[var(--bi-muted)] uppercase tracking-wide text-[9px]">
        {label}
      </span>
      <p className="mt-0.5 leading-snug">{children}</p>
    </div>
  )
}
