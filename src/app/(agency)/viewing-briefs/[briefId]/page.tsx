import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PrintActions } from '@/components/agency/PrintActions'
import { TrustBadge } from '@/components/shared/TrustBadge'
import { requireAgentAuth } from '@/lib/auth/index'
import { revalidatePath } from 'next/cache'
import { loadViewingBrief, saveViewingBriefNotes } from '@/features/viewing-briefs/index'
import {
  DEMO_VIEWING_BRIEF_DRAFT,
  DEMO_NAV_IDS,
  type ViewingBriefDraftJson,
} from '@/lib/demo-data'

function buildCopyText(draft: ViewingBriefDraftJson): string {
  const lines: string[] = [
    'VIEWING BRIEF',
    `${draft.buyerName} — ${draft.propertyName}`,
    draft.propertyAddress,
    `Prepared by ${draft.agentName}, ${draft.agencyName}`,
    draft.profileVersionDate,
    '',
    'BUYER SNAPSHOT',
    draft.buyerSnapshot,
    '',
    'WHAT THEY CARE ABOUT',
    ...draft.whatTheyCareAbout.map((s, i) => `${i + 1}. ${s}`),
    '',
    "WON'T CONSIDER",
    ...draft.wontConsider.map((s, i) => `${i + 1}. ${s}`),
    '',
    'WHY IT MAY SUIT THEM',
    draft.whyItMaySuit,
  ]

  if (draft.threeThingsToShow.length > 0) {
    lines.push('', 'THREE THINGS TO SHOW')
    draft.threeThingsToShow.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.title}: ${t.description}`)
    })
  }

  if (draft.localEvidence.length > 0) {
    lines.push('', 'LOCAL EVIDENCE')
    draft.localEvidence.forEach(e => {
      lines.push(`${e.label} [${e.status.toUpperCase()}] — ${e.source}`)
    })
    lines.push('Unchecked items stay out of anything shared with the buyer.')
  }

  if (draft.beUpfrontAbout.length > 0) {
    lines.push('', 'BE UPFRONT ABOUT')
    draft.beUpfrontAbout.forEach(b => lines.push(`${b.title}: ${b.description}`))
  }

  if (draft.checkBeforeViewing.length > 0) {
    lines.push('', 'CHECK BEFORE VIEWING')
    draft.checkBeforeViewing.forEach(c => lines.push(`[ ] ${c.item}`))
  }

  if (draft.questionsToAsk.length > 0) {
    lines.push('', 'QUESTIONS TO ASK')
    draft.questionsToAsk.forEach(q => lines.push(`"${q}"`))
  }

  lines.push(
    '',
    `Prepared from ${draft.buyerName}'s approved brief (${draft.profileVersionDate}) and the property evaluation (${draft.propertyRevisionDate}).`
  )

  return lines.join('\n')
}

async function saveNotesAction(briefId: string, agencyId: string, formData: FormData) {
  'use server'
  const notes = formData.get('notes')?.toString() ?? ''
  await saveViewingBriefNotes(briefId, notes, agencyId)
  revalidatePath(`/viewing-briefs/${briefId}`)
}

export default async function ViewingBriefPage(
  props: { params: Promise<{ briefId: string }> }
) {
  const { briefId } = await props.params
  const isDemo = briefId.startsWith('demo-')

  let draft: ViewingBriefDraftJson
  let notes: string | null = null
  let agencyId = ''

  if (isDemo) {
    draft = DEMO_VIEWING_BRIEF_DRAFT
  } else {
    const agent = await requireAgentAuth()
    agencyId = agent.agencyId
    const result = await loadViewingBrief(briefId)
    if (!result) notFound()
    draft = result.draft
    notes = result.notes
  }

  const copyText = buildCopyText(draft)
  const backHref = isDemo
    ? `/buyers/${DEMO_NAV_IDS.buyerMaya}/matches/${DEMO_NAV_IDS.propLarkfield}`
    : '/buyers'

  const saveNotes = isDemo ? null : saveNotesAction.bind(null, briefId, agencyId)

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-3xl mx-auto">

        {/* Actions bar */}
        <div className="no-print flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-1 text-xs text-[var(--bi-muted)]" aria-label="Breadcrumb">
            <Link href={backHref} className="hover:text-[var(--bi-ink)] underline-offset-2 hover:underline">
              Property fit
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--bi-ink)]">Viewing brief</span>
          </nav>
          <PrintActions copyText={copyText} />
        </div>

        {/* Conflict banner */}
        {draft.hasConflicts && (
          <div className="mb-4 rounded-xl border border-[var(--bi-apricot)] bg-[var(--bi-apricot)] px-4 py-3 text-sm text-[var(--bi-ink)]">
            <span className="font-semibold">Conflict notice:</span> This brief was prepared despite unresolved conflicts: {draft.conflictLabels.join(', ')}. Conflicts remain visible during the viewing.
          </div>
        )}

        {/* Document */}
        <article className="rounded-2xl border border-[var(--bi-line)] bg-[var(--bi-surface)] shadow-sm print:rounded-none print:border-none print:shadow-none">

          {/* Header */}
          <header className="border-b border-[var(--bi-line)] px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
                  Viewing brief
                </p>
                <h1 className="mt-1 font-serif text-2xl text-[var(--bi-ink)]">
                  {draft.propertyName}
                </h1>
                <p className="mt-0.5 text-sm text-[var(--bi-muted)]">{draft.propertyAddress}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-[var(--bi-muted)]">{draft.agencyName}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Buyer</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{draft.buyerName}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Price</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{draft.propertyPrice}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Prepared by</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{draft.agentName}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[var(--bi-muted)]">Date</p>
                <p className="mt-0.5 text-[var(--bi-ink)]">{draft.profileVersionDate}</p>
              </div>
            </div>
          </header>

          <div className="px-8 py-6 space-y-8">

            {/* 3-col snapshot */}
            <section className="break-inside-avoid grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Buyer snapshot</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--bi-ink)]">{draft.buyerSnapshot}</p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">What they care about most</h2>
                <ul className="mt-2 space-y-1.5">
                  {draft.whatTheyCareAbout.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-[var(--bi-ink)]">
                      <span className="mr-1.5 text-[var(--bi-muted)]">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Won&apos;t consider</h2>
                <ul className="mt-2 space-y-1.5">
                  {draft.wontConsider.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-[var(--bi-ink)]">
                      <span className="mr-1.5 text-[var(--bi-muted)]">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Why it may suit them */}
            <section className="break-inside-avoid rounded-xl bg-[var(--bi-apricot)] px-6 py-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Why it may suit them</h2>
              <p className="mt-2 font-serif text-base italic leading-relaxed text-[var(--bi-ink)]">
                {draft.whyItMaySuit}
              </p>
            </section>

            {/* Three things to show */}
            {draft.threeThingsToShow.length > 0 && (
              <section className="break-inside-avoid">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Three things to show them</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {draft.threeThingsToShow.map((item, i) => (
                    <div key={i} className="rounded-lg border border-[var(--bi-line)] p-4">
                      <p className="text-xs font-bold text-[var(--bi-muted)]">{i + 1}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--bi-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--bi-muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Local evidence */}
            {draft.localEvidence.length > 0 && (
              <section className="break-inside-avoid">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Local life, with evidence</h2>
                <div className="mt-3 overflow-hidden rounded-lg border border-[var(--bi-line)]">
                  <table className="w-full text-sm">
                    <tbody>
                      {draft.localEvidence.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--bi-line)] last:border-0">
                          <td className="px-4 py-3 text-[var(--bi-ink)]">{row.label}</td>
                          <td className="px-4 py-3">
                            <TrustBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--bi-muted)]">{row.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[10px] text-[var(--bi-muted)] italic">
                  Unchecked items stay out of anything shared with the buyer.
                </p>
              </section>
            )}

            {/* Two-column lower */}
            {(draft.beUpfrontAbout.length > 0 || draft.checkBeforeViewing.length > 0) && (
              <section className="break-inside-avoid grid grid-cols-1 gap-6 sm:grid-cols-2">
                {draft.beUpfrontAbout.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Be upfront about</h2>
                    <div className="mt-3 space-y-3">
                      {draft.beUpfrontAbout.map((item, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold text-[var(--bi-ink)]">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--bi-muted)]">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {draft.checkBeforeViewing.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Check before they arrive</h2>
                    <ul className="mt-3 space-y-2">
                      {draft.checkBeforeViewing.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--bi-ink)]">
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--bi-line)]">
                            {item.done && <span className="text-[9px] text-[var(--bi-sage)]">✓</span>}
                          </span>
                          <span className="leading-relaxed">{item.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Questions to ask */}
            {draft.questionsToAsk.length > 0 && (
              <section className="break-inside-avoid">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">Good questions to ask</h2>
                <ul className="mt-3 space-y-2">
                  {draft.questionsToAsk.map((q, i) => (
                    <li key={i} className="text-sm leading-relaxed text-[var(--bi-ink)] before:mr-1 before:text-[var(--bi-muted)] before:content-['“']">
                      {q}<span className="text-[var(--bi-muted)]">&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Footer provenance */}
            <footer className="border-t border-[var(--bi-line)] pt-4 text-[10px] leading-relaxed text-[var(--bi-muted)]">
              Prepared from {draft.buyerName}&apos;s approved brief ({draft.profileVersionDate}) and the property evaluation ({draft.propertyRevisionDate}). Property facts come only from the sources shown; anything unchecked is marked as such. All names, addresses and details in this prototype are fictional.
            </footer>

          </div>
        </article>

        {/* Private notes — excluded from print and copy */}
        <div className="mt-6 print:hidden">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--bi-muted)]">
            Notes — private to {draft.agencyName}
          </h2>
          {isDemo ? (
            <textarea
              disabled
              placeholder="Private agent notes (not available in demo)"
              className="mt-2 w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-3 text-sm text-[var(--bi-muted)] opacity-60 cursor-not-allowed resize-none"
              rows={4}
            />
          ) : (
            <form action={saveNotes!}>
              <textarea
                name="notes"
                defaultValue={notes ?? ''}
                placeholder="Add private preparation notes here — these will never appear in anything shared with the buyer."
                className="mt-2 w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-3 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)] resize-none"
                rows={4}
              />
              <button
                type="submit"
                className="mt-2 rounded-xl border border-[var(--bi-line)] px-4 py-2 text-sm text-[var(--bi-muted)] hover:text-[var(--bi-ink)] hover:border-[var(--bi-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
              >
                Save notes
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
