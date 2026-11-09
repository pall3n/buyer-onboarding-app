import { describe, it, expect, vi } from 'vitest'
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

  it('transitions to listening when mic button is clicked (internal state)', () => {
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

  // onSubmit + isDisabled tests
  it('calls onSubmit with input value on Enter key', () => {
    const onSubmit = vi.fn()
    render(<VoiceDock onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('Type a message…')
    fireEvent.change(input, { target: { value: 'Hello there' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('Hello there')
  })

  it('calls onSubmit on send button click', () => {
    const onSubmit = vi.fn()
    render(<VoiceDock onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('Type a message…')
    fireEvent.change(input, { target: { value: 'Send this' } })
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    fireEvent.click(sendButton)
    expect(onSubmit).toHaveBeenCalledWith('Send this')
  })

  it('clears input after submission', () => {
    const onSubmit = vi.fn()
    render(<VoiceDock onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Clear me' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input.value).toBe('')
  })

  it('send button is not rendered when input is empty', () => {
    render(<VoiceDock />)
    expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull()
  })

  it('shows mic button when input is empty', () => {
    render(<VoiceDock />)
    expect(screen.getByRole('button', { name: 'Start voice input' })).toBeInTheDocument()
  })

  it('disables input and buttons when isDisabled is true', () => {
    render(<VoiceDock isDisabled onSubmit={vi.fn()} />)
    const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement
    expect(input.disabled).toBe(true)
    // Mic button should be disabled
    const micButton = screen.getByRole('button', { name: 'Start voice input' })
    expect(micButton).toBeDisabled()
  })

  it('does not call onSubmit when isDisabled is true', () => {
    const onSubmit = vi.fn()
    render(<VoiceDock isDisabled onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('Type a message…')
    fireEvent.change(input, { target: { value: 'Try to send' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  // ─── M5 additions ──────────────────────────────────────────────────────

  it('isDemo prop disables mic button with appropriate aria-label', () => {
    render(<VoiceDock isDemo />)
    const micButton = screen.getByRole('button', { name: 'Voice unavailable in demo' })
    expect(micButton).toBeDisabled()
  })

  it('calls onVoiceStart when mic button is clicked', () => {
    const onVoiceStart = vi.fn()
    render(<VoiceDock onVoiceStart={onVoiceStart} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }))
    expect(onVoiceStart).toHaveBeenCalledOnce()
  })

  it('calls onVoiceInterrupt when interrupt button is clicked in speaking state', () => {
    const onVoiceInterrupt = vi.fn()
    render(<VoiceDock voiceState="speaking" onVoiceInterrupt={onVoiceInterrupt} />)
    const interruptButton = screen.getByRole('button', { name: 'Interrupt response' })
    fireEvent.click(interruptButton)
    expect(onVoiceInterrupt).toHaveBeenCalledOnce()
  })

  it('calls onVoiceStop when cancel is clicked in listening state', () => {
    const onVoiceStop = vi.fn()
    render(<VoiceDock voiceState="listening" onVoiceStop={onVoiceStop} />)
    const cancelButton = screen.getByRole('button', { name: 'Cancel voice input' })
    fireEvent.click(cancelButton)
    expect(onVoiceStop).toHaveBeenCalledOnce()
  })

  it('uses voiceState prop to override internal state', () => {
    const { container } = render(<VoiceDock voiceState="thinking" />)
    const dock = container.querySelector('[data-voice-state]')
    expect(dock?.getAttribute('data-voice-state')).toBe('thinking')
    expect(screen.getByText('Taking that in…')).toBeInTheDocument()
  })

  it('renders with voiceLevels prop without errors', () => {
    const levels = [0.1, 0.5, 0.8, 0.4, 0.2]
    render(<VoiceDock voiceState="listening" voiceLevels={levels} />)
    // Should render listening state without crashing
    expect(screen.getByText('Tap to pause')).toBeInTheDocument()
  })
})
