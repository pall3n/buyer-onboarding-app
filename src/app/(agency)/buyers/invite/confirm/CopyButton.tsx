'use client'

import { useState } from 'react'

interface CopyButtonProps {
  url: string
}

export function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface-soft)] px-4 py-2 text-sm font-medium text-[var(--bi-ink)] transition-colors hover:bg-[var(--bi-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
