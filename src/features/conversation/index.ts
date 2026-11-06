import { getAdminClient } from '@/lib/supabase/admin'
import type { ConversationTurn } from '@/lib/demo-data'
import type { UIMessage, TextUIPart } from 'ai'

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getNextTurnIndex(sessionId: string): Promise<number> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('conversation_turns')
    .select('turn_index')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: false })
    .limit(1)
    .single()
  return data ? (data.turn_index as number) + 1 : 0
}

export async function appendTurn(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const admin = getAdminClient()
  const turnIndex = await getNextTurnIndex(sessionId)
  await admin.from('conversation_turns').insert({
    session_id: sessionId,
    role,
    content,
    turn_index: turnIndex,
  })
}

export async function loadConversationTurns(
  sessionId: string
): Promise<ConversationTurn[]> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('conversation_turns')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })

  if (!data) return []

  return data.map(row => ({
    role: row.role === 'assistant' ? ('ai' as const) : ('buyer' as const),
    text: row.content as string,
    timestamp: new Date(row.created_at as string).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))
}

// ─── Message format converters ────────────────────────────────────────────────

/**
 * Converts DB conversation turns to UIMessage[] for seeding useChat.
 */
export function turnsToMessages(turns: ConversationTurn[]): UIMessage[] {
  return turns.map((turn, i) => ({
    id: `turn-${i}`,
    role: (turn.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
    parts: [{ type: 'text' as const, text: turn.text }],
  }))
}

/**
 * Converts useChat UIMessage[] back to ConversationTurn[] for rendering.
 */
export function messagesToTurns(messages: UIMessage[]): ConversationTurn[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? ('ai' as const) : ('buyer' as const),
      text: m.parts
        .filter(p => p.type === 'text')
        .map(p => (p as TextUIPart).text)
        .join(''),
      timestamp: '',
    }))
}
