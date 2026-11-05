'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Importance = 'essential' | 'preferred' | 'flexible'

const OPTIONS: Importance[] = ['essential', 'preferred', 'flexible']

const LABELS: Record<Importance, string> = {
  essential: 'Essential',
  preferred: 'Preferred',
  flexible: 'Flexible',
}

interface ImportanceToggleProps {
  text: string
  initialImportance: Importance
}

export function ImportanceToggle({ text, initialImportance }: ImportanceToggleProps) {
  const [importance, setImportance] = useState<Importance>(initialImportance)

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--bi-line)] last:border-0">
      <span className="text-sm text-[var(--bi-ink)]">{text}</span>
      <div className="flex shrink-0 gap-1" role="group" aria-label={`Importance for: ${text}`}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setImportance(option)}
            aria-pressed={importance === option}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
              importance === option
                ? 'bg-[var(--bi-ink)] text-white'
                : 'text-[var(--bi-muted)] hover:text-[var(--bi-ink)] hover:bg-[var(--bi-surface-soft)]'
            )}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
