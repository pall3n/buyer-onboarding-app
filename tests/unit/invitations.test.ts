import { describe, it, expect } from 'vitest'
import {
  generateInviteToken,
  hashToken,
  verifyToken,
  isExpired,
  defaultExpiresAt,
} from '@/features/invitations/token'
import { CreateInvitationFormSchema } from '@/features/invitations/schema'

describe('generateInviteToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateInviteToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens on successive calls', () => {
    const a = generateInviteToken()
    const b = generateInviteToken()
    expect(a).not.toBe(b)
  })
})

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    const raw = generateInviteToken()
    expect(hashToken(raw)).toBe(hashToken(raw))
  })

  it('produces different hashes for different inputs', () => {
    const a = generateInviteToken()
    const b = generateInviteToken()
    expect(hashToken(a)).not.toBe(hashToken(b))
  })
})

describe('verifyToken', () => {
  it('returns true for a matching raw token and stored hash', () => {
    const raw = generateInviteToken()
    const hash = hashToken(raw)
    expect(verifyToken(raw, hash)).toBe(true)
  })

  it('returns false for a wrong raw token against a valid hash', () => {
    const raw = generateInviteToken()
    const hash = hashToken(raw)
    const wrongRaw = generateInviteToken()
    expect(verifyToken(wrongRaw, hash)).toBe(false)
  })

  it('returns false for a tampered hash', () => {
    const raw = generateInviteToken()
    const hash = hashToken(raw)
    const tampered = hash.slice(0, -1) + (hash.endsWith('a') ? 'b' : 'a')
    expect(verifyToken(raw, tampered)).toBe(false)
  })
})

describe('isExpired', () => {
  it('returns true for a past date', () => {
    const past = new Date(Date.now() - 1000)
    expect(isExpired(past)).toBe(true)
  })

  it('returns false for a future date', () => {
    const future = new Date(Date.now() + 60_000)
    expect(isExpired(future)).toBe(false)
  })
})

describe('defaultExpiresAt', () => {
  it('returns a date approximately 7 days from now', () => {
    const before = Date.now()
    const result = defaultExpiresAt()
    const after = Date.now()

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const resultMs = result.getTime()

    expect(resultMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000)
    expect(resultMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000)
  })
})

describe('CreateInvitationFormSchema', () => {
  it('passes for a valid input', () => {
    const result = CreateInvitationFormSchema.safeParse({
      displayName: 'Maya Reid',
      note: 'Looking forward to working with you.',
    })
    expect(result.success).toBe(true)
  })

  it('fails when displayName is empty', () => {
    const result = CreateInvitationFormSchema.safeParse({
      displayName: '',
    })
    expect(result.success).toBe(false)
  })

  it('fails when displayName exceeds 120 characters', () => {
    const result = CreateInvitationFormSchema.safeParse({
      displayName: 'A'.repeat(121),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from displayName', () => {
    const result = CreateInvitationFormSchema.safeParse({
      displayName: '  Maya Reid  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayName).toBe('Maya Reid')
    }
  })
})
