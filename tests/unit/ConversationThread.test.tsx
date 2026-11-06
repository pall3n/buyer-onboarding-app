import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversationThread } from '@/components/buyer/ConversationThread'
import type { ConversationTurn } from '@/lib/demo-data'

const sampleTurns: ConversationTurn[] = [
  { role: 'ai', text: 'Hello! What area are you looking in?', timestamp: '10:00' },
  { role: 'buyer', text: 'Sevenoaks please.', timestamp: '10:01' },
]

describe('ConversationThread', () => {
  it('renders conversation turns', () => {
    render(<ConversationThread turns={sampleTurns} />)
    expect(screen.getByText('Hello! What area are you looking in?')).toBeInTheDocument()
    expect(screen.getByText('Sevenoaks please.')).toBeInTheDocument()
  })

  it('renders thinking bubble when isStreaming is true', () => {
    render(<ConversationThread turns={sampleTurns} isStreaming />)
    const container = document.querySelector('[aria-label="Assistant is thinking"]')
    expect(container).not.toBeNull()
  })

  it('does not render thinking bubble when isStreaming is false', () => {
    render(<ConversationThread turns={sampleTurns} isStreaming={false} />)
    const container = document.querySelector('[aria-label="Assistant is thinking"]')
    expect(container).toBeNull()
  })

  it('does not render thinking bubble when isStreaming is absent', () => {
    render(<ConversationThread turns={sampleTurns} />)
    const container = document.querySelector('[aria-label="Assistant is thinking"]')
    expect(container).toBeNull()
  })

  it('renders empty state without error', () => {
    render(<ConversationThread turns={[]} />)
    // No error thrown, component renders without turns
    expect(document.querySelector('[aria-label="Assistant is thinking"]')).toBeNull()
  })

  it('renders thinking bubble without turns', () => {
    render(<ConversationThread turns={[]} isStreaming />)
    const container = document.querySelector('[aria-label="Assistant is thinking"]')
    expect(container).not.toBeNull()
  })
})
