import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VoiceDock } from '@/components/buyer/VoiceDock'

describe('VoiceDock', () => {
  it('renders in idle state initially', () => {
    const { container } = render(<VoiceDock />)
    const dock = container.querySelector('[data-voice-state]')
    expect(dock).not.toBeNull()
    expect(dock?.getAttribute('data-voice-state')).toBe('idle')
  })

  it('shows text input and microphone button in idle state', () => {
    render(<VoiceDock />)
    expect(screen.getByPlaceholderText('Type a message…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start voice input' })).toBeInTheDocument()
  })

  it('transitions to listening when mic button is clicked', () => {
    const { container } = render(<VoiceDock />)
    const micButton = screen.getByRole('button', { name: 'Start voice input' })
    fireEvent.click(micButton)
    const dock = container.querySelector('[data-voice-state]')
    expect(dock?.getAttribute('data-voice-state')).toBe('listening')
  })

  it('shows "Tap to pause" label in listening state', () => {
    render(<VoiceDock />)
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }))
    expect(screen.getByRole('button', { name: 'Cancel voice input' })).toBeInTheDocument()
    expect(screen.getByText('Tap to pause')).toBeInTheDocument()
  })

  it('returns to idle when cancel button is clicked in listening state', () => {
    const { container } = render(<VoiceDock />)
    // Enter listening
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }))
    expect(container.querySelector('[data-voice-state]')?.getAttribute('data-voice-state')).toBe('listening')
    // Cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel voice input' }))
    expect(container.querySelector('[data-voice-state]')?.getAttribute('data-voice-state')).toBe('idle')
  })
})
