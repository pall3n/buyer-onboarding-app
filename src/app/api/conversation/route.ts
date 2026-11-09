import {
  streamText,
  toUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
} from 'ai'
import type { UIMessage, TextUIPart } from 'ai'
import { HARTFIELD_SYSTEM_PROMPT, getConversationModel } from '@/lib/ai/index'
import { requireBuyerSessionForRoute, isDemoId } from '@/lib/auth/buyer-session'
import { appendTurn } from '@/features/conversation/index'
import { getAdminClient } from '@/lib/supabase/admin'
import { getOrCreateDraftProfile, loadBriefSummary } from '@/features/preferences/index'
import { extractAndPersist } from '@/lib/ai/extraction'
import { logAuditEvent } from '@/lib/db'
import { DEMO_MAYA_BRIEF, DEMO_CONVERSATION } from '@/lib/demo-data'

export const maxDuration = 60

// ─── POST — stream a conversation turn ───────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json() as {
    messages: UIMessage[]
    opaqueId: string
  }
  const { messages, opaqueId } = body

  const session = await requireBuyerSessionForRoute(opaqueId)
  const isDemo = session === null && isDemoId(opaqueId)
  if (!isDemo && !session) return new Response('Unauthorized', { status: 401 })

  // Rate limit: max 20 turns per session per minute
  if (session) {
    const admin = getAdminClient()
    const { count } = await admin
      .from('conversation_turns')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.sessionId)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    if ((count ?? 0) >= 20) {
      return new Response('Rate limit exceeded — please wait a moment before continuing.', { status: 429 })
    }
  }

  // Extract user message text from last UIMessage
  const lastMsg = messages[messages.length - 1]
  const userText = lastMsg
    ? lastMsg.parts
        .filter(p => p.type === 'text')
        .map(p => (p as TextUIPart).text)
        .join('')
    : ''

  // Persist user turn (real sessions only)
  if (session) {
    await appendTurn(session.sessionId, 'user', userText)
  }

  // Ensure profile + draft version exist (real only)
  let versionId: string | null = null
  if (session) {
    const { versionId: vid } = await getOrCreateDraftProfile(session.subjectId)
    versionId = vid
  }

  // Convert UIMessage[] to ModelMessage[] for Claude
  const modelMessages = await convertToModelMessages(messages)

  // Stream Claude response
  const result = streamText({
    model: getConversationModel(),
    system: HARTFIELD_SYSTEM_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 400,
  })

  // Convert to UIMessageStream with persistence hook
  const stream = toUIMessageStream({
    stream: result.fullStream,
    onEnd: async ({ messages: finalMessages }) => {
      if (!session || !versionId) return
      const assistantMsg = finalMessages[finalMessages.length - 1]
      if (!assistantMsg || assistantMsg.role !== 'assistant') return

      const assistantText = assistantMsg.parts
        .filter(p => p.type === 'text')
        .map(p => (p as TextUIPart).text)
        .join('')

      await appendTurn(session.sessionId, 'assistant', assistantText)

      extractAndPersist(modelMessages, assistantText, versionId).catch(err =>
        console.error('[extraction] failed:', err)
      )

      void logAuditEvent({
        actorType: 'buyer',
        actorId: session.subjectId,
        agencyId: session.agencyId,
        action: 'conversation.turn_completed',
      })
    },
  })

  return createUIMessageStreamResponse({ stream })
}

// ─── GET — brief summary for sidebar refresh ──────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const opaqueId = searchParams.get('opaqueId') ?? ''

  if (isDemoId(opaqueId)) {
    return Response.json({
      brief: DEMO_MAYA_BRIEF,
      topicsDone: DEMO_CONVERSATION.topicsDone,
    })
  }

  const session = await requireBuyerSessionForRoute(opaqueId)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { versionId } = await getOrCreateDraftProfile(session.subjectId)
  const { brief, topicsDone } = await loadBriefSummary(versionId)

  return Response.json({ brief, topicsDone })
}

