import { describe, it, expect } from 'vitest'
import { runMatching, deriveVerdict } from '@/features/matching/index'
import type { PropertyFact } from '@/features/properties/index'

const baseProperty = {
  id: 'prop-1',
  addressLine1: '1 Test Street',
  postcode: 'TN13 1AB',
  askingPrice: 70000000,  // £700,000 in pence
  revision: 1,
}

function makePref(category: string, key: string, value: unknown, priority = 'preferred') {
  return { category, key, typedValue: value, priority }
}

function makeFact(category: string, key: string, value: unknown, vs: PropertyFact['verificationState'] = 'verified'): PropertyFact {
  return { category, key, typedValue: value, verificationState: vs, sourceNote: null }
}

describe('runMatching', () => {
  it('flags conflict when bedrooms below minimum', () => {
    const result = runMatching(
      [makePref('bedrooms', 'minimum', 4, 'essential')],
      [makeFact('bedrooms', 'count', 3)],
      baseProperty
    )
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].label).toBe('Bedrooms')
  })

  it('flags conflict when garden is required but absent', () => {
    const result = runMatching(
      [makePref('lifestyle', 'garden_required', true, 'essential')],
      [makeFact('lifestyle', 'has_garden', false)],
      baseProperty
    )
    expect(result.conflicts.some(c => c.label === 'Garden')).toBe(true)
  })

  it('flags conflict when garden is required but not private', () => {
    const result = runMatching(
      [makePref('lifestyle', 'garden_required', true, 'essential')],
      [
        makeFact('lifestyle', 'has_garden', true),
        makeFact('lifestyle', 'garden_private', false),
      ],
      baseProperty
    )
    expect(result.conflicts.some(c => c.label === 'Garden: south-facing')).toBe(true)
  })

  it('places price within budget in strongMatches', () => {
    const result = runMatching(
      [makePref('budget', 'max_gbp', 750000)],
      [],
      { ...baseProperty, askingPrice: 70000000 }  // £700k ≤ £750k
    )
    expect(result.strongMatches.some(m => m.label === 'Budget')).toBe(true)
  })

  it('places price within 10% over budget in compromises', () => {
    const result = runMatching(
      [makePref('budget', 'max_gbp', 650000)],
      [],
      { ...baseProperty, askingPrice: 70000000 }  // £700k ≤ £715k (10% over £650k)
    )
    expect(result.compromises.some(c => c.label === 'Budget')).toBe(true)
  })

  it('derives conflict verdict when any conflict present', () => {
    expect(deriveVerdict(1, 5, 0)).toBe('conflict')
  })

  it('derives strong_fit when 3+ confirmed and no conflicts', () => {
    expect(deriveVerdict(0, 3, 0)).toBe('strong_fit')
  })

  it('converts dealbreakers to worthAsking strings', () => {
    const result = runMatching(
      [makePref('dealbreakers', 'items', ['flood risk', 'subsidence'])],
      [],
      baseProperty
    )
    expect(result.worthAsking).toHaveLength(2)
    expect(result.worthAsking[0]).toContain('flood risk')
    expect(result.worthAsking[1]).toContain('subsidence')
    expect(result.conflicts).toHaveLength(0)
  })

  it('returns empty sections and potential verdict for no inputs', () => {
    const result = runMatching([], [], baseProperty)
    expect(result.strongMatches).toHaveLength(0)
    expect(result.compromises).toHaveLength(0)
    expect(result.conflicts).toHaveLength(0)
    expect(result.unknowns).toHaveLength(0)
    expect(result.propertyVerdict).toBe('suggested')  // potential → suggested via DB_VERDICT_TO_TRUST_STATUS
  })
})
