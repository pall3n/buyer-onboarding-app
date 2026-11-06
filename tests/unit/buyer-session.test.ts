import { describe, it, expect } from 'vitest'
import { isDemoId, BUYER_SESSION_COOKIE } from '@/lib/auth/buyer-session'

describe('isDemoId', () => {
  it('returns true for demo-conv-maya', () => {
    expect(isDemoId('demo-conv-maya')).toBe(true)
  })

  it('returns true for demo-invite-maya', () => {
    expect(isDemoId('demo-invite-maya')).toBe(true)
  })

  it('returns false for a real UUID', () => {
    expect(isDemoId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
  })

  it('is case-sensitive: DEMO- prefix does not match', () => {
    expect(isDemoId('DEMO-conv-maya')).toBe(false)
  })
})

describe('BUYER_SESSION_COOKIE', () => {
  it('has the correct value', () => {
    expect(BUYER_SESSION_COOKIE).toBe('bi_buyer_session')
  })
})
