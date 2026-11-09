import { redirect, notFound } from 'next/navigation'
import { loadFeedbackFormData, submitFeedback } from '@/features/feedback/index'
import type { InterestLevel, NextSteps } from '@/features/feedback/index'

export default async function FeedbackPage(
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params
  const formData = await loadFeedbackFormData(token)

  if (formData.kind === 'invalid') notFound()
  if (formData.kind === 'expired') {
    return <ClosedPage message="This feedback link has expired." />
  }
  if (formData.kind === 'revoked') {
    return <ClosedPage message="This feedback link is no longer active." />
  }
  if (formData.kind === 'completed') {
    return <ClosedPage message="Your feedback has already been submitted. Thank you." />
  }

  const { inviteId, propertyName, agencyName } = formData
  const isDemo = token.startsWith('demo-')

  async function submitAction(formData: FormData) {
    'use server'
    const positives = formData.get('positives')?.toString().trim() || null
    const concerns = formData.get('concerns')?.toString().trim() || null
    const interestLevel = (formData.get('interest_level')?.toString() || null) as InterestLevel | null
    const wouldChange = formData.get('would_change')?.toString().trim() || null
    const nextSteps = (formData.get('next_steps')?.toString() || null) as NextSteps | null

    if (!isDemo) {
      await submitFeedback(inviteId, { positives, concerns, interestLevel, wouldChange, nextSteps })
    }
    redirect(`/feedback/${token}/done`)
  }

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
              {agencyName}
            </p>
            <h1 className="font-serif text-2xl text-[var(--bi-ink)]">{propertyName}</h1>
            <p className="text-sm text-[var(--bi-muted)]">Post-viewing feedback</p>
          </div>

          {isDemo && (
            <div className="rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface-soft)] px-4 py-3 text-xs text-[var(--bi-muted)]">
              Demo — this is a sample feedback form. Your response won&apos;t be saved.
            </div>
          )}

          <form action={submitAction} className="space-y-6">

            {/* Q1: Positives */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--bi-ink)]">
                What stood out positively?
                <span className="ml-1 text-[var(--bi-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                name="positives"
                rows={3}
                placeholder="Anything that worked well…"
                className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)] resize-none"
              />
            </div>

            {/* Q2: Concerns */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--bi-ink)]">
                What didn&apos;t work, or what concerns you?
                <span className="ml-1 text-[var(--bi-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                name="concerns"
                rows={3}
                placeholder="Anything that felt off or needs more thought…"
                className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)] resize-none"
              />
            </div>

            {/* Q3: Interest level */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[var(--bi-ink)]">
                Could you see yourselves living here?
                <span className="ml-1 text-[var(--bi-muted)] font-normal">(optional)</span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(['yes', 'maybe', 'no'] as const).map(val => (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center justify-center rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] py-3 text-sm font-medium text-[var(--bi-ink)] transition-colors has-[:checked]:border-[var(--bi-sage)] has-[:checked]:bg-[var(--bi-surface-soft)]"
                  >
                    <input type="radio" name="interest_level" value={val} className="sr-only" />
                    {val === 'yes' ? 'Yes' : val === 'maybe' ? 'Maybe' : 'No'}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Q4: Would change */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--bi-ink)]">
                What would you change or compromise on?
                <span className="ml-1 text-[var(--bi-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                name="would_change"
                rows={3}
                placeholder="Things you could live with, or would want to change over time…"
                className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)] resize-none"
              />
            </div>

            {/* Q5: Next steps */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[var(--bi-ink)]">
                What would you like to do next?
                <span className="ml-1 text-[var(--bi-muted)] font-normal">(optional)</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['second_viewing', 'Second viewing'],
                  ['discuss', 'Discuss options'],
                  ['not_right', 'Not right for us'],
                  ['undecided', 'Not sure yet'],
                ] as const).map(([val, label]) => (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center justify-center rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-3 py-3 text-center text-sm font-medium text-[var(--bi-ink)] leading-tight transition-colors has-[:checked]:border-[var(--bi-sage)] has-[:checked]:bg-[var(--bi-surface-soft)]"
                  >
                    <input type="radio" name="next_steps" value={val} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-[var(--bi-ink)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
            >
              {isDemo ? 'Submit (demo)' : 'Send feedback'}
            </button>

          </form>

          <p className="text-center text-[11px] leading-relaxed text-[var(--bi-muted)]">
            Your feedback is shared only with {agencyName}. Skipped questions are not recorded.
            Your responses are not part of your personal home brief and won&apos;t change it automatically.
          </p>

        </div>
      </main>
    </div>
  )
}

function ClosedPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--bi-background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-3">
        <h1 className="font-serif text-xl text-[var(--bi-ink)]">Feedback</h1>
        <p className="text-sm text-[var(--bi-muted)]">{message}</p>
      </div>
    </div>
  )
}
