'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DEMO_NAV_IDS } from '@/lib/demo-data'

interface ConversationPageLayoutProps {
  thread: React.ReactNode
  brief: React.ReactNode
  voiceDock: React.ReactNode
}

export function ConversationPageLayout({
  thread,
  brief,
  voiceDock,
}: ConversationPageLayoutProps) {
  const [briefVisible, setBriefVisible] = useState(true)

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bi-background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-3">
        <span className="text-sm font-medium text-[var(--bi-ink)]">
          Your home brief with Hartfield &amp; Rowe
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/invite/${DEMO_NAV_IDS.inviteMaya}`}
            className="text-xs text-[var(--bi-muted)] underline-offset-2 hover:underline"
          >
            Pause and save
          </Link>
          <button
            onClick={() => setBriefVisible((v) => !v)}
            className="text-xs text-[var(--bi-muted)] underline-offset-2 hover:underline focus-visible:outline-none"
          >
            {briefVisible ? 'Hide brief' : 'Show brief'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation thread */}
        <div className="flex-1 overflow-y-auto pb-28">{thread}</div>

        {/* Brief rail — desktop only */}
        {briefVisible && (
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-[var(--bi-line)] bg-[var(--bi-surface-soft)] p-4 md:block">
            {brief}
          </aside>
        )}
      </div>

      {/* Voice dock */}
      {voiceDock}
    </div>
  )
}
