import { DemoBanner } from '@/components/shared/DemoBanner'
import { ConversationThread } from '@/components/buyer/ConversationThread'
import { HomeBriefSummary } from '@/components/buyer/HomeBriefSummary'
import { VoiceDock } from '@/components/buyer/VoiceDock'
import { ConversationPageLayout } from '@/components/buyer/ConversationPageLayout'
import { DEMO_CONVERSATION, DEMO_MAYA_BRIEF } from '@/lib/demo-data'

export const instant = false

export default async function ConversationPage(
  props: { params: Promise<{ opaqueId: string }> }
) {
  const { opaqueId } = await props.params
  void opaqueId // all demo conversations use the same fixture

  return (
    <>
      <DemoBanner />
      <ConversationPageLayout
        thread={<ConversationThread turns={DEMO_CONVERSATION.turns} />}
        brief={
          <HomeBriefSummary
            data={DEMO_MAYA_BRIEF}
            topicsDone={DEMO_CONVERSATION.topicsDone}
            topicsTotal={DEMO_CONVERSATION.topicsTotal}
          />
        }
        voiceDock={<VoiceDock />}
      />
    </>
  )
}
