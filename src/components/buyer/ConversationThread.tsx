'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ConversationTurn } from '@/lib/demo-data'

interface ConversationThreadProps {
  turns: ConversationTurn[]
  isStreaming?: boolean
}

export function ConversationThread({ turns, isStreaming }: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isStreaming])

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
            {turn.timestamp && (
              <span className="ml-2 text-[10px] text-[var(--bi-muted)]">{turn.timestamp}</span>
            )}
          </div>
        </div>
      ))}

      {/* Thinking bubble while streaming */}
      {isStreaming && (
        <div className="flex gap-3 flex-row" aria-label="Assistant is thinking">
          <div
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bi-sage)] text-xs font-medium text-white"
            aria-hidden="true"
          >
            H
          </div>
          <div className="max-w-[78%] rounded-2xl bg-[var(--bi-surface)] px-4 py-3">
            <div aria-hidden="true" className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-[var(--bi-muted)] animate-thinking-dot"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
