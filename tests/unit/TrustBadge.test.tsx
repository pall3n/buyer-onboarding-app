import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustBadge, type TrustStatus } from '@/components/shared/TrustBadge'

const VARIANTS: { status: TrustStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'suggested', label: 'Suggested' },
  { status: 'unknown', label: 'Unknown' },
  { status: 'conflict', label: 'Conflict' },
]

describe('TrustBadge', () => {
  it.each(VARIANTS)('renders $status variant with label "$label"', ({ status, label }) => {
    render(<TrustBadge status={status} />)
    const badge = screen.getByRole('generic', { name: label })
    expect(badge).toBeInTheDocument()
  })

  it.each(VARIANTS)('$status variant has correct data-status attribute', ({ status }) => {
    const { container } = render(<TrustBadge status={status} />)
    const badge = container.querySelector(`[data-status="${status}"]`)
    expect(badge).not.toBeNull()
  })

  it('confirmed variant has accessible label "Confirmed"', () => {
    render(<TrustBadge status="confirmed" />)
    expect(screen.getByLabelText('Confirmed')).toBeInTheDocument()
  })

  it('conflict variant has accessible label "Conflict"', () => {
    render(<TrustBadge status="conflict" />)
    expect(screen.getByLabelText('Conflict')).toBeInTheDocument()
  })

  it('unknown variant has accessible label "Unknown"', () => {
    render(<TrustBadge status="unknown" />)
    expect(screen.getByLabelText('Unknown')).toBeInTheDocument()
  })

  it('suggested variant has accessible label "Suggested"', () => {
    render(<TrustBadge status="suggested" />)
    expect(screen.getByLabelText('Suggested')).toBeInTheDocument()
  })

  it('accepts an additional className', () => {
    const { container } = render(<TrustBadge status="confirmed" className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
