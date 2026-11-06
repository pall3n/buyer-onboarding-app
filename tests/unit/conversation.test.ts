import { describe, it, expect } from 'vitest'
import { turnsToMessages, messagesToTurns } from '@/features/conversation/index'
import type { ConversationTurn } from '@/lib/demo-data'
import type { UIMessage } from 'ai'

describe('turnsToMessages', () => {
  it('maps role ai to assistant', () => {
    const turns: ConversationTurn[] = [
      { role: 'ai', text: 'Hello there!', timestamp: '10:00' },
    ]
    const messages = turnsToMessages(turns)
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
  })

  it('maps role buyer to user', () => {
    const turns: ConversationTurn[] = [
      { role: 'buyer', text: 'I want 3 bedrooms', timestamp: '10:01' },
    ]
    const messages = turnsToMessages(turns)
    expect(messages[0].role).toBe('user')
  })

  it('preserves text in parts', () => {
    const turns: ConversationTurn[] = [
      { role: 'ai', text: 'What area are you looking in?', timestamp: '10:00' },
    ]
    const messages = turnsToMessages(turns)
    const textPart = messages[0].parts.find(p => p.type === 'text')
    expect(textPart).toBeDefined()
    expect((textPart as { type: 'text'; text: string }).text).toBe(
      'What area are you looking in?'
    )
  })

  it('assigns unique ids to each message', () => {
    const turns: ConversationTurn[] = [
      { role: 'ai', text: 'Hello', timestamp: '10:00' },
      { role: 'buyer', text: 'Hi', timestamp: '10:01' },
    ]
    const messages = turnsToMessages(turns)
    expect(messages[0].id).toBe('turn-0')
    expect(messages[1].id).toBe('turn-1')
  })

  it('returns empty array for empty input', () => {
    expect(turnsToMessages([])).toHaveLength(0)
  })
})

describe('messagesToTurns', () => {
  it('maps role assistant to ai', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'What location?' }],
      },
    ]
    const turns = messagesToTurns(messages)
    expect(turns[0].role).toBe('ai')
  })

  it('maps role user to buyer', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Sevenoaks please' }],
      },
    ]
    const turns = messagesToTurns(messages)
    expect(turns[0].role).toBe('buyer')
  })

  it('extracts text from text parts', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Three bedrooms minimum' }],
      },
    ]
    const turns = messagesToTurns(messages)
    expect(turns[0].text).toBe('Three bedrooms minimum')
  })

  it('filters out system messages', () => {
    const messages: UIMessage[] = [
      {
        id: '0',
        role: 'system' as 'user',
        parts: [{ type: 'text', text: 'System prompt' }],
      },
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
    ]
    const turns = messagesToTurns(messages)
    expect(turns).toHaveLength(1)
    expect(turns[0].role).toBe('buyer')
  })

  it('is inverse of turnsToMessages for user and ai roles', () => {
    const original: ConversationTurn[] = [
      { role: 'ai', text: 'Hello buyer!', timestamp: '' },
      { role: 'buyer', text: 'Hello assistant!', timestamp: '' },
    ]
    const messages = turnsToMessages(original)
    const roundTripped = messagesToTurns(messages)
    expect(roundTripped).toHaveLength(2)
    expect(roundTripped[0].role).toBe('ai')
    expect(roundTripped[0].text).toBe('Hello buyer!')
    expect(roundTripped[1].role).toBe('buyer')
    expect(roundTripped[1].text).toBe('Hello assistant!')
  })
})
