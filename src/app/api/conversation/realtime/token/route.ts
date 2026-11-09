import { z } from 'zod'
import OpenAI from 'openai'
import { requireBuyerSessionForRoute } from '@/lib/auth/buyer-session'
import { HARTFIELD_SYSTEM_PROMPT } from '@/lib/ai/index'
import { getAdminClient } from '@/lib/supabase/admin'

const TOKEN_COOLDOWN_MS = 10_000

const TokenRequestSchema = z.object({
  opaqueId: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = TokenRequestSchema.safeParse(body)
  if (!parsed.success) return new Response('Bad Request', { status: 400 })

  const { opaqueId } = parsed.data
  const session = await requireBuyerSessionForRoute(opaqueId)
  if (!session) return new Response('Unauthorized', { status: 401 })

  // Rate-limit: one token per session per 10 seconds
  const admin = getAdminClient()
  const { data: sessionRow } = await admin
    .from('buyer_sessions')
    .select('last_token_issued_at')
    .eq('id', session.sessionId)
    .single()

  if (sessionRow?.last_token_issued_at) {
    const elapsed = Date.now() - new Date(sessionRow.last_token_issued_at as string).getTime()
    if (elapsed < TOKEN_COOLDOWN_MS) {
      return new Response('Too Many Requests', { status: 429 })
    }
  }

  const openai = new OpenAI()
  const rtSession = await openai.beta.realtime.sessions.create({
    model: 'gpt-4o-realtime-preview',
    instructions: HARTFIELD_SYSTEM_PROMPT,
    voice: 'alloy',
    turn_detection: { type: 'server_vad' },
    input_audio_transcription: { model: 'whisper-1' },
  })

  // Update rate-limit timestamp (fire-and-forget)
  void admin
    .from('buyer_sessions')
    .update({ last_token_issued_at: new Date().toISOString() })
    .eq('id', session.sessionId)

  return Response.json({ ephemeralToken: rtSession.client_secret.value })
}
