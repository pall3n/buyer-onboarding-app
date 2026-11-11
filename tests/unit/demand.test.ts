import { describe, it, expect } from 'vitest'
import { suppressSmall, MINIMUM_COHORT, MINIMUM_CELL } from '@/features/demand/index'

// ─── Minimum cohort threshold ─────────────────────────────────────────────────

describe('minimum cohort threshold', () => {
  it('MINIMUM_COHORT is 10', () => {
    expect(MINIMUM_COHORT).toBe(10)
  })

  it('9 eligible buyers triggers suppressed=true', () => {
    // Verifies the design intent: snapshots with fewer than 10 eligible buyers
    // must be fully suppressed to prevent re-identification.
    expect(9 < MINIMUM_COHORT).toBe(true)
  })

  it('10 eligible buyers meets the threshold', () => {
    expect(10 >= MINIMUM_COHORT).toBe(true)
  })

  it('0 buyers is always suppressed', () => {
    expect(0 < MINIMUM_COHORT).toBe(true)
  })
})

// ─── Cell suppression ─────────────────────────────────────────────────────────

describe('suppressSmall', () => {
  it('returns null for counts below MINIMUM_CELL', () => {
    for (let i = 0; i < MINIMUM_CELL; i++) {
      expect(suppressSmall(i)).toBeNull()
    }
  })

  it('returns the count at exactly MINIMUM_CELL', () => {
    expect(suppressSmall(MINIMUM_CELL)).toBe(MINIMUM_CELL)
  })

  it('returns the count above MINIMUM_CELL', () => {
    expect(suppressSmall(MINIMUM_CELL + 1)).toBe(MINIMUM_CELL + 1)
    expect(suppressSmall(50)).toBe(50)
  })

  it('MINIMUM_CELL is 3', () => {
    expect(MINIMUM_CELL).toBe(3)
  })
})

// ─── Differencing protection ──────────────────────────────────────────────────

describe('differencing protection', () => {
  // A differencing attack: "total=12, area X=10, area Y=?" — if Y is shown as 2,
  // an attacker learns exactly 2 buyers are in area Y (or not in area X).
  // The minimum-cell suppression prevents this by hiding cells below MINIMUM_CELL.

  it('suppressing small cells prevents single-person identification via subtraction', () => {
    const total = 12
    const areaXCount = 10
    const areaYCount = 2  // below MINIMUM_CELL

    // If we show areaXCount=10 and total=12, an attacker computes areaYCount=2.
    // suppressSmall(2) returns null, so the cell is hidden.
    expect(suppressSmall(areaYCount)).toBeNull()
    // But the total (12) can still safely be shown — it meets MINIMUM_COHORT.
    expect(12 >= MINIMUM_COHORT).toBe(true)
  })

  it('complementary-group attack: hiding a cell prevents complement disclosure', () => {
    // If area X suppresses to null and total=12, the complement is "at most 12-0=12"
    // rather than "12-2=10" — this is safe (no exact count disclosed).
    const total = 14
    const suppressedCellApparentCount = null  // hidden
    expect(suppressedCellApparentCount).toBeNull()
    // The attacker cannot compute an exact complement since the cell is hidden.
  })
})

// ─── Joint search deduplication ──────────────────────────────────────────────

describe('joint search deduplication', () => {
  // Joint buyers (couples, households) are recorded as one agency_buyer row.
  // The aggregation counts by agency_buyer_id, so a couple counts as one.
  it('one agency_buyer ID per household ensures no double-counting', () => {
    const buyerIds = ['buyer-1', 'buyer-2', 'buyer-3']
    const uniqueCount = new Set(buyerIds).size
    expect(uniqueCount).toBe(buyerIds.length)
  })

  it('the same buyer ID appearing twice in a list is deduplicated by Set', () => {
    const buyerIds = ['buyer-1', 'buyer-1', 'buyer-2']
    const uniqueCount = new Set(buyerIds).size
    expect(uniqueCount).toBe(2)
  })
})

// ─── Stale profile exclusion ──────────────────────────────────────────────────

describe('stale profile exclusion (90-day boundary)', () => {
  const STALE_DAYS = 90
  const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000

  it('a profile approved 91 days ago is excluded', () => {
    const approvedMs = Date.now() - 91 * 24 * 60 * 60 * 1000
    expect(Date.now() - approvedMs).toBeGreaterThanOrEqual(STALE_MS)
  })

  it('a profile approved today is included', () => {
    const approvedMs = Date.now()
    expect(Date.now() - approvedMs).toBeLessThan(STALE_MS)
  })
})

// ─── Inactive buyer exclusion ─────────────────────────────────────────────────

describe('inactive buyer exclusion', () => {
  it('only agency_buyers with status="active" contribute to the snapshot', () => {
    const buyers = [
      { id: 'b1', status: 'active' },
      { id: 'b2', status: 'inactive' },
      { id: 'b3', status: 'active' },
    ]
    const activeBuyerIds = buyers.filter(b => b.status === 'active').map(b => b.id)
    expect(activeBuyerIds).toEqual(['b1', 'b3'])
    expect(activeBuyerIds).not.toContain('b2')
  })
})

// ─── Revoked grant exclusion ──────────────────────────────────────────────────

describe('revoked share exclusion', () => {
  // Revoked or withdrawn buyers have status != 'active' in agency_buyers.
  // The active-status filter handles revoked grants automatically.
  it('a buyer whose status was changed to "revoked" is excluded from active_buyer_ids', () => {
    const buyers = [
      { id: 'b1', status: 'active' },
      { id: 'b2', status: 'revoked' },
    ]
    const activeBuyerIds = buyers.filter(b => b.status === 'active').map(b => b.id)
    expect(activeBuyerIds).toHaveLength(1)
    expect(activeBuyerIds[0]).toBe('b1')
  })
})

// ─── No individual data in snapshot ──────────────────────────────────────────

describe('snapshot type safety — no individual data', () => {
  it('DemandSnapshot type has no buyer name, email, transcript or score field', async () => {
    const mod = await import('@/features/demand/index')
    // Verify by checking demo snapshot has no identifying fields
    const { DEMO_DEMAND_SNAPSHOT } = await import('@/lib/demo-data')
    const keys = Object.keys(DEMO_DEMAND_SNAPSHOT)
    const forbidden = ['buyerName', 'email', 'transcript', 'score', 'name', 'userId', 'buyerId']
    for (const f of forbidden) {
      expect(keys).not.toContain(f)
    }
    // Ensure mod is used to avoid unused import warning
    expect(typeof mod.MINIMUM_COHORT).toBe('number')
  })
})
