'use client'

interface PrintActionsProps {
  copyText: string
}

export function PrintActions({ copyText }: PrintActionsProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="rounded-md border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-1.5 text-sm text-[var(--bi-ink)] transition-colors hover:bg-[var(--bi-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        Copy
      </button>
      <button
        onClick={handlePrint}
        className="rounded-md border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-1.5 text-sm text-[var(--bi-ink)] transition-colors hover:bg-[var(--bi-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
      >
        Print
      </button>
      <button
        disabled
        title="PDF export not available in demo"
        aria-disabled="true"
        className="rounded-md border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-1.5 text-sm text-[var(--bi-muted)] cursor-not-allowed opacity-50"
      >
        PDF
      </button>
      <button
        disabled
        title="Share not available in demo"
        aria-disabled="true"
        className="rounded-md border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-1.5 text-sm text-[var(--bi-muted)] cursor-not-allowed opacity-50"
      >
        Share
      </button>
    </div>
  )
}
