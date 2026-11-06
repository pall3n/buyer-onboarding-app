import { DemoBanner } from '@/components/shared/DemoBanner'
import { ConversationPageClient } from '@/components/buyer/ConversationPageClient'
import { DEMO_CONVERSATION, DEMO_MAYA_BRIEF } from '@/lib/demo-data'
import { requireBuyerSession } from '@/lib/auth/buyer-session'
import { loadConversationTurns, turnsToMessages } from '@/features/conversation/index'
import { getOrCreateDraftProfile, loadBriefSummary } from '@/features/preferences/index'

export const dynamic = 'force-dynamic'

export default async function ConversationPage(
  props: { params: Promise<{ opaqueId: string }> }
) {
  const { opaqueId } = await props.params
  const session = await requireBuyerSession(opaqueId)
  const isDemo = session === null

  const { initialMessages, initialBrief, initialTopicsDone } = isDemo
    ? {
        initialMessages: turnsToMessages(DEMO_CONVERSATION.turns),
        initialBrief: DEMO_MAYA_BRIEF,
        initialTopicsDone: DEMO_CONVERSATION.topicsDone,
      }
    : await (async () => {
        const turns = await loadConversationTurns(session.sessionId)
        const { versionId } = await getOrCreateDraftProfile(session.subjectId)
        const { brief, topicsDone } = await loadBriefSummary(versionId)
        return {
          initialMessages: turnsToMessages(turns),
          initialBrief: brief,
          initialTopicsDone: topicsDone,
        }
      })()

  return (
    <>
      {isDemo && <DemoBanner />}
      <ConversationPageClient
        opaqueId={opaqueId}
        isDemo={isDemo}
        initialMessages={initialMessages}
        initialBrief={initialBrief}
        initialTopicsDone={initialTopicsDone}
      />
    </>
  )
}
