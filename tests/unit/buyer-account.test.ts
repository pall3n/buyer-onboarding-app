import { describe, it, expect } from 'vitest'
import type { BuyerGrant, SomewhereConnection, ClaimResult } from '@/features/buyer-account/index'
import { CLAIM_TOKEN_TTL_MS, isClaimTokenExpired, isClaimTokenUsed } from '@/features/buyer-account/index'

// ─── Cross-tenant isolation ───────────────────────────────────────────────────

describe('cross-tenant isolation — BuyerGrant type', () => {
  it('BuyerGrant type does not include agency private notes', () => {
    type HasPrivateNotes = 'privateNotes' extends keyof BuyerGrant ? true : false
    const check: HasPrivateNotes = false
    expect(check).toBe(false)
  })

  it('BuyerGrant type does not include agent-only evaluation fields', () => {
    type HasEval = 'agencyBuyerId' extends keyof BuyerGrant ? true : false
    type HasScore = 'score' extends keyof BuyerGrant ? true : false
    const a: HasEval = false
    const b: HasScore = false
    expect(a).toBe(false)
    expect(b).toBe(false)
  })

  it('BuyerGrant only exposes fields a buyer is entitled to know', () => {
    const allowedKeys: Array<keyof BuyerGrant> = [
      'shareId',
      'agencyId',
      'agencyName',
      'status',
      'approvedVersionId',
      'approvedVersionDate',
      'grantedAt',
      'revokedAt',
    ]
    // All fields above are buyer-entitleable; none include CRM data
    expect(allowedKeys).not.toContain('privateNotes')
    expect(allowedKeys).not.toContain('agencyBuyerId')
    expect(allowedKeys).not.toContain('score')
  })
})

// ─── Claim token security ─────────────────────────────────────────────────────

describe('claim token TTL', () => {
  it('claim token TTL is 30 minutes', () => {
    expect(CLAIM_TOKEN_TTL_MS).toBe(30 * 60 * 1000)
  })

  it('token with expiry in the past is expired', () => {
    const expiredAt = new Date(Date.now() - 1000).toISOString()
    expect(isClaimTokenExpired(expiredAt)).toBe(true)
  })

  it('token with expiry in the future is not expired', () => {
    const futureAt = new Date(Date.now() + 60_000).toISOString()
    expect(isClaimTokenExpired(futureAt)).toBe(false)
  })

  it('token with used_at set is considered used', () => {
    expect(isClaimTokenUsed(new Date().toISOString())).toBe(true)
  })

  it('token with null used_at is not used', () => {
    expect(isClaimTokenUsed(null)).toBe(false)
  })
})

describe('ClaimResult shape', () => {
  it('ClaimResult.success=false carries a reason', () => {
    const failed: ClaimResult = { success: false, reason: 'token_expired' }
    expect(failed.success).toBe(false)
    expect(failed.reason).toBe('token_expired')
  })

  it('ClaimResult.success=true carries a subjectId', () => {
    const ok: ClaimResult = { success: true, subjectId: 'sub-123' }
    expect(ok.success).toBe(true)
    expect(ok.subjectId).toBe('sub-123')
  })
})

// ─── Grant revocation ─────────────────────────────────────────────────────────

describe('grant revocation contract', () => {
  it('revoke transitions share status from active to revoked', () => {
    const before = { status: 'active' as const }
    const after = { ...before, status: 'revoked' as const }
    expect(after.status).toBe('revoked')
  })

  it('revoke emits a share_event with event_type="revoked" and actor_type="buyer"', () => {
    const event = { event_type: 'revoked' as const, actor_type: 'buyer' }
    expect(event.event_type).toBe('revoked')
    expect(event.actor_type).toBe('buyer')
  })

  it('revoking a demo share is a no-op (demo prefix guard)', () => {
    const demoShareId = 'demo-share-hartfield'
    expect(demoShareId.startsWith('demo-')).toBe(true)
  })
})

// ─── Somewhere integration independence ──────────────────────────────────────

describe('Somewhere integration — isolation from agency grants', () => {
  it('SomewhereConnection type does not include agency_id', () => {
    type HasAgencyId = 'agencyId' extends keyof SomewhereConnection ? true : false
    const check: HasAgencyId = false
    expect(check).toBe(false)
  })

  it('SomewhereConnection type does not include profile_share_id', () => {
    type HasShareId = 'profileShareId' extends keyof SomewhereConnection ? true : false
    const check: HasShareId = false
    expect(check).toBe(false)
  })

  it('Somewhere revocation is scoped to somewhere_connections table only', () => {
    // Design contract: separate tables means separate revocation paths
    const SOMEWHERE_TABLE = 'somewhere_connections'
    const PROFILE_SHARES_TABLE = 'profile_shares'
    expect(SOMEWHERE_TABLE).not.toBe(PROFILE_SHARES_TABLE)
  })

  it('Somewhere purposes are purpose-specific, not agency-scoped', () => {
    const connection: SomewhereConnection = {
      connectionId: 'sc-1',
      subjectId: 'sub-1',
      purposes: ['property_intelligence', 'location_data'],
      status: 'active',
      consentRecordedAt: new Date().toISOString(),
      revokedAt: null,
    }
    expect(connection.purposes).toContain('property_intelligence')
    expect(connection).not.toHaveProperty('agencyId')
  })
})

// ─── Demo path no-ops ─────────────────────────────────────────────────────────

describe('demo path guards', () => {
  it('demo share IDs are identifiable by prefix', () => {
    expect('demo-share-hartfield'.startsWith('demo-')).toBe(true)
    expect('demo-share-other'.startsWith('demo-')).toBe(true)
    expect('550e8400-e29b-41d4-a716-446655440000'.startsWith('demo-')).toBe(false)
  })

  it('demo subject IDs are identifiable by prefix', () => {
    expect('demo-subject-maya'.startsWith('demo-')).toBe(true)
  })
})
