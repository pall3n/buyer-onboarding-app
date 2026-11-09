import { z } from 'zod'
import { requireBuyerSessionForRoute } from '@/lib/auth/buyer-session'
import { appendTurnPair, loadConversationHistory } from '@/features/conversation/index'
import { getOrCreateDraftProfile } from '@/features/preferences/index'
import { extractAndPersist } from '@/lib/ai/extraction'
import { logAuditEvent } from '@/lib/observability/index'

const PersistRequestSchema = z.object({
  opaqueId: z.string().min(1).max(200),
  userText: z.string().max(10_000),
  assistantText: z.string().max(10_000),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = PersistRequestSchema.safeParse(body)
  if (!parsed.success) return new Response('Bad Request', { status: 400 })

  const { opaqueId, userText, assistantText } = parsed.data

  const session = await requireBuyerSessionForRoute(opaqueId)
  if (!session) return new Response('Unauthorized', { status: 401 })

  await appendTurnPair(session.sessionId, userText, assistantText)

  const [{ versionId }, fullHistory] = await Promise.all([
    getOrCreateDraftProfile(session.subjectId),
    loadConversationHistory(session.sessionId),
  ])

  extractAndPersist(fullHistory, assistantText, versionId).catch(err =>
    console.error('[voice extraction] failed:', err)
  )

  void logAuditEvent({
    actorType: 'buyer',
    actorId: session.subjectId,
    agencyId: session.agencyId,
    action: 'conversation.voice_turn_completed',
  })

  return Response.json({ ok: true })
}
