import { cn } from '@/lib/utils'
import type { ConversationTurn } from '@/lib/demo-data'

interface ConversationThreadProps {
  turns: ConversationTurn[]
}

export function ConversationThread({ turns }: ConversationThreadProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {turns.map((turn, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-3',
            turn.role === 'buyer' ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
              turn.role === 'ai'
                ? 'bg-[var(--bi-sage)] text-white'
                : 'bg-[var(--bi-apricot)] text-[var(--bi-ink)]'
            )}
            aria-hidden="true"
          >
            {turn.role === 'ai' ? 'H' : 'M'}
          </div>

          {/* Bubble */}
          <div
            className={cn(
              'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              turn.role === 'ai'
                ? 'bg-[var(--bi-surface)] text-[var(--bi-ink)]'
                : 'bg-[var(--bi-sage-pale)] text-[var(--bi-ink)]'
            )}
          >
            {turn.text}
            <span className="ml-2 text-[10px] text-[var(--bi-muted)]">{turn.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
