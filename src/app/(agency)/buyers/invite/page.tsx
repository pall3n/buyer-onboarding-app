import { createInvitationAction } from './actions'

export default function InviteBuyerPage() {
  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Invite a buyer</h1>
        <p className="mt-1 text-sm text-[var(--bi-muted)]">
          We&apos;ll generate a unique link to send to your buyer.
        </p>

        <form action={createInvitationAction} className="mt-8 space-y-6">
          {/* Display name */}
          <div className="space-y-1">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-[var(--bi-ink)]"
            >
              Buyer name <span aria-hidden="true">*</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={120}
              className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
              placeholder="e.g. Maya Reid"
            />
          </div>

          {/* Personal note */}
          <div className="space-y-1">
            <label
              htmlFor="note"
              className="block text-sm font-medium text-[var(--bi-ink)]"
            >
              Personal note <span className="text-[var(--bi-muted)]">(optional)</span>
            </label>
            <textarea
              id="note"
              name="note"
              maxLength={500}
              rows={4}
              className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)] resize-none"
              placeholder="A personal message shown to the buyer on the invitation screen…"
            />
          </div>

          {/* Prefill section */}
          <details className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface-soft)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--bi-ink)] select-none">
              Prefill hints (optional)
            </summary>
            <div className="space-y-4 px-4 pb-4">
              <p className="text-xs text-[var(--bi-muted)]">
                These values pre-populate the buyer&apos;s profile to save time.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="prefillBudgetMin"
                    className="block text-xs font-medium text-[var(--bi-ink)]"
                  >
                    Budget min (£)
                  </label>
                  <input
                    id="prefillBudgetMin"
                    name="prefillBudgetMin"
                    type="number"
                    min={0}
                    step={1000}
                    className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2 text-sm text-[var(--bi-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
                    placeholder="300000"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="prefillBudgetMax"
                    className="block text-xs font-medium text-[var(--bi-ink)]"
                  >
                    Budget max (£)
                  </label>
                  <input
                    id="prefillBudgetMax"
                    name="prefillBudgetMax"
                    type="number"
                    min={0}
                    step={1000}
                    className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2 text-sm text-[var(--bi-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="prefillLocation"
                  className="block text-xs font-medium text-[var(--bi-ink)]"
                >
                  Preferred location
                </label>
                <input
                  id="prefillLocation"
                  name="prefillLocation"
                  type="text"
                  maxLength={200}
                  className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
                  placeholder="e.g. Sevenoaks, TN13"
                />
              </div>
            </div>
          </details>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
          >
            Generate invite link
          </button>
        </form>
      </div>
    </div>
  )
}
