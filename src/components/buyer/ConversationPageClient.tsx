'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ConversationThread } from '@/components/buyer/ConversationThread'
import { HomeBriefSummary } from '@/components/buyer/HomeBriefSummary'
import { VoiceDock } from '@/components/buyer/VoiceDock'
import { ConversationPageLayout } from '@/components/buyer/ConversationPageLayout'
import { messagesToTurns } from '@/features/conversation/index'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import type { HomeBriefData } from '@/lib/demo-data'
import type { ConversationTurn } from '@/lib/demo-data'
import type { UIMessage } from 'ai'

interface ConversationPageClientProps {
  opaqueId: string
  isDemo: boolean
  initialMessages: UIMessage[]
  initialBrief: HomeBriefData
  initialTopicsDone: number
}

// A voice turn pair with the text-message count at the time it was received,
// so it can be interleaved correctly with text turns.
interface VoiceTurnEntry {
  userTurn: ConversationTurn
  assistantTurn: ConversationTurn
  afterTextIndex: number // insert after this many text turns
}

export function ConversationPageClient({
  opaqueId,
  isDemo,
  initialMessages,
  initialBrief,
  initialTopicsDone,
}: ConversationPageClientProps) {
  const [briefData, setBriefData] = useState<HomeBriefData>(initialBrief)
  const [topicsDone, setTopicsDone] = useState(initialTopicsDone)
  const [voiceEntries, setVoiceEntries] = useState<VoiceTurnEntry[]>([])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/conversation',
      body: { opaqueId },
    }),
    messages: initialMessages,
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  // Keep a ref to current message count so the voice callback captures the live value
  const messageCountRef = useRef(messages.length)
  useEffect(() => {
    messageCountRef.current = messages.length
  }, [messages.length])

  const refreshBrief = useCallback(() => {
    fetch(`/api/conversation/brief?opaqueId=${encodeURIComponent(opaqueId)}`)
      .then(r => r.json())
      .then(({ brief, topicsDone: td }: { brief: HomeBriefData; topicsDone: number }) => {
        setBriefData(brief)
        setTopicsDone(td)
      })
      .catch(() => {})
  }, [opaqueId])

  // After each assistant text turn completes, refresh brief sidebar
  const prevStatus = useRef(status)
  useEffect(() => {
    const wasLoading =
      prevStatus.current === 'submitted' || prevStatus.current === 'streaming'
    if (wasLoading && status === 'ready') {
      refreshBrief()
    }
    prevStatus.current = status
  }, [status, refreshBrief])

  const { voiceState, levels, startVoice, stopVoice, interrupt } = useVoiceSession({
    opaqueId,
    onTurnComplete: async (userText, assistantText) => {
      await fetch('/api/conversation/realtime/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opaqueId, userText, assistantText }),
      })
      const afterTextIndex = messageCountRef.current
      setVoiceEntries(prev => [
        ...prev,
        {
          userTurn: { role: 'buyer' as const, text: userText, timestamp: '' },
          assistantTurn: { role: 'ai' as const, text: assistantText, timestamp: '' },
          afterTextIndex,
        },
      ])
      refreshBrief()
    },
  })

  // Interleave text and voice turns in chronological order
  const textTurns = messagesToTurns(messages)
  const allTurns: ConversationTurn[] = []
  let voiceIdx = 0
  for (let i = 0; i <= textTurns.length; i++) {
    // Insert any voice pairs that arrived after the i-th text turn
    while (
      voiceIdx < voiceEntries.length &&
      voiceEntries[voiceIdx].afterTextIndex <= i
    ) {
      allTurns.push(voiceEntries[voiceIdx].userTurn)
      allTurns.push(voiceEntries[voiceIdx].assistantTurn)
      voiceIdx++
    }
    if (i < textTurns.length) allTurns.push(textTurns[i])
  }

  return (
    <ConversationPageLayout
      thread={<ConversationThread turns={allTurns} isStreaming={isLoading} />}
      brief={
        <HomeBriefSummary data={briefData} topicsDone={topicsDone} topicsTotal={8} />
      }
      voiceDock={
        <VoiceDock
          onSubmit={text => sendMessage({ text })}
          isDisabled={isLoading}
          voiceState={voiceState}
          voiceLevels={levels}
          onVoiceStart={startVoice}
          onVoiceStop={stopVoice}
          onVoiceInterrupt={interrupt}
          isDemo={isDemo}
        />
      }
    />
  )
}
