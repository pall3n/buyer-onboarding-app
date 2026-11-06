'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ConversationThread } from '@/components/buyer/ConversationThread'
import { HomeBriefSummary } from '@/components/buyer/HomeBriefSummary'
import { VoiceDock } from '@/components/buyer/VoiceDock'
import { ConversationPageLayout } from '@/components/buyer/ConversationPageLayout'
import { messagesToTurns } from '@/features/conversation/index'
import type { HomeBriefData } from '@/lib/demo-data'
import type { UIMessage } from 'ai'

interface ConversationPageClientProps {
  opaqueId: string
  isDemo: boolean
  initialMessages: UIMessage[]
  initialBrief: HomeBriefData
  initialTopicsDone: number
}

export function ConversationPageClient({
  opaqueId,
  initialMessages,
  initialBrief,
  initialTopicsDone,
}: ConversationPageClientProps) {
  const [briefData, setBriefData] = useState<HomeBriefData>(initialBrief)
  const [topicsDone, setTopicsDone] = useState(initialTopicsDone)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/conversation',
      body: { opaqueId },
    }),
    messages: initialMessages,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // After each assistant turn completes, refresh brief sidebar
  const prevStatus = useRef(status)
  useEffect(() => {
    const wasLoading =
      prevStatus.current === 'submitted' || prevStatus.current === 'streaming'
    if (wasLoading && status === 'ready') {
      fetch(`/api/conversation/brief?opaqueId=${encodeURIComponent(opaqueId)}`)
        .then(r => r.json())
        .then(({ brief, topicsDone: td }: { brief: HomeBriefData; topicsDone: number }) => {
          setBriefData(brief)
          setTopicsDone(td)
        })
        .catch(() => {
          // Brief sidebar just doesn't update on network error
        })
    }
    prevStatus.current = status
  }, [status, opaqueId])

  const turns = messagesToTurns(messages)

  return (
    <ConversationPageLayout
      thread={<ConversationThread turns={turns} isStreaming={isLoading} />}
      brief={
        <HomeBriefSummary data={briefData} topicsDone={topicsDone} topicsTotal={8} />
      }
      voiceDock={
        <VoiceDock
          onSubmit={text => sendMessage({ text })}
          isDisabled={isLoading}
        />
      }
    />
  )
}
