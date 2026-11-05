'use client'

import { useState, useEffect } from 'react'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { cn } from '@/lib/utils'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

interface VoiceDockProps {
  className?: string
}

export function VoiceDock({ className }: VoiceDockProps) {
  const [state, setState] = useState<VoiceState>('idle')
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <div
        data-voice-state={state}
        className={cn(
          'fixed bottom-0 left-0 right-0 flex justify-center p-4 md:pl-[216px]',
          className
        )}
      >
        <m.div
          layout={!reducedMotion}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className={cn(
            'overflow-hidden',
            state === 'idle'
              ? 'w-full max-w-lg rounded-2xl border border-[var(--bi-line)] bg-[var(--bi-surface)] shadow-sm'
              : 'rounded-full shadow-lg',
            (state === 'listening' || state === 'thinking' || state === 'speaking') &&
              'bg-[#202923]',
            state === 'error' &&
              'w-full max-w-lg rounded-2xl border border-[var(--bi-line)] bg-[var(--bi-surface)] shadow-sm'
          )}
        >
          {state === 'idle' && <IdleContent onMicClick={() => setState('listening')} />}
          {state === 'listening' && (
            <ListeningContent
              onCancel={() => setState('idle')}
              reducedMotion={reducedMotion}
            />
          )}
          {state === 'thinking' && <ThinkingContent />}
          {state === 'speaking' && (
            <SpeakingContent
              onInterrupt={() => setState('idle')}
              reducedMotion={reducedMotion}
            />
          )}
          {state === 'error' && <ErrorContent onRetry={() => setState('idle')} />}
        </m.div>
      </div>
    </LazyMotion>
  )
}

// ─── Idle ──────────────────────────────────────────────────────────────────

function IdleContent({ onMicClick }: { onMicClick: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <input
        type="text"
        placeholder="Type a message…"
        className="flex-1 bg-transparent text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none"
      />
      <button
        onClick={onMicClick}
        aria-label="Start voice input"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bi-sage)] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        <MicIcon />
      </button>
    </div>
  )
}

// ─── Listening ────────────────────────────────────────────────────────────

function ListeningContent({
  onCancel,
  reducedMotion,
}: {
  onCancel: () => void
  reducedMotion: boolean
}) {
  return (
    <button
      onClick={onCancel}
      aria-label="Cancel voice input"
      className="flex items-center gap-4 px-6 py-3 text-white focus-visible:outline-none"
    >
      <Waveform active reducedMotion={reducedMotion} />
      <span className="text-sm font-medium">Tap to pause</span>
    </button>
  )
}

// ─── Thinking ─────────────────────────────────────────────────────────────

function ThinkingContent() {
  return (
    <div className="flex items-center gap-4 px-6 py-3 text-white">
      <ThinkingDots />
      <span className="text-sm font-medium">Taking that in…</span>
    </div>
  )
}

// ─── Speaking ─────────────────────────────────────────────────────────────

function SpeakingContent({
  onInterrupt,
  reducedMotion,
}: {
  onInterrupt: () => void
  reducedMotion: boolean
}) {
  return (
    <button
      onClick={onInterrupt}
      aria-label="Interrupt response"
      className="flex items-center gap-4 px-6 py-3 text-white focus-visible:outline-none"
    >
      <Waveform active={false} reducedMotion={reducedMotion} />
      <span className="text-sm font-medium">Tap to interrupt</span>
    </button>
  )
}

// ─── Error ────────────────────────────────────────────────────────────────

function ErrorContent({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-[var(--bi-ink)]">Couldn&apos;t connect</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-[var(--bi-ink)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        Retry
      </button>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Waveform({
  active,
  reducedMotion,
}: {
  active: boolean
  reducedMotion: boolean
}) {
  const bars = [1, 2, 3, 4, 5]
  const heights = active ? ['h-2', 'h-4', 'h-5', 'h-3', 'h-2'] : ['h-2', 'h-2', 'h-2', 'h-2', 'h-2']
  const delays = ['0ms', '80ms', '160ms', '80ms', '0ms']

  return (
    <div aria-hidden="true" className="flex items-center gap-[3px]">
      {bars.map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-full bg-white transition-all',
            heights[i],
            active && !reducedMotion && 'animate-voice-bar'
          )}
          style={
            active && !reducedMotion
              ? { animationDelay: delays[i] }
              : undefined
          }
        />
      ))}
    </div>
  )
}

function ThinkingDots() {
  return (
    <div aria-hidden="true" className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-white animate-thinking-dot"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z" />
    </svg>
  )
}
