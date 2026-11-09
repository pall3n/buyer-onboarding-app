export default function FeedbackDonePage() {
  return (
    <div className="min-h-screen bg-[var(--bi-background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Thank you</h1>
        <p className="text-sm text-[var(--bi-muted)]">
          Your agent will review your feedback shortly.
        </p>
        <p className="text-xs text-[var(--bi-muted)]">You can close this page.</p>
      </div>
    </div>
  )
}
