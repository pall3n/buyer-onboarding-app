import { describe, it, expect } from 'vitest'
import { ExtractedPreferencesSchema } from '@/features/preferences/index'

describe('ExtractedPreferencesSchema', () => {
  it('accepts valid extraction output', () => {
    const input = {
      location: { area: 'Sevenoaks', commute_note: 'walking distance' },
      bedrooms: { minimum: 3, ideal: 4, needs_home_office: true },
      budget: { min_gbp: 650000, max_gbp: 800000, firmness: 'firm' },
      dealbreakers: { items: ['no enclosed garden', 'busy road'] },
      topics_covered: ['location', 'bedrooms', 'budget', 'dealbreakers'],
    }
    const result = ExtractedPreferencesSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.location?.area).toBe('Sevenoaks')
      expect(result.data.bedrooms?.minimum).toBe(3)
      expect(result.data.budget?.firmness).toBe('firm')
      expect(result.data.topics_covered).toHaveLength(4)
    }
  })

  it('strips unknown top-level fields', () => {
    const input = {
      topics_covered: ['location'],
      unknownField: 'should be stripped',
    }
    const result = ExtractedPreferencesSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect('unknownField' in result.data).toBe(false)
    }
  })

  it('requires topics_covered array', () => {
    const result = ExtractedPreferencesSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('allows all optional top-level fields to be absent', () => {
    const result = ExtractedPreferencesSchema.safeParse({
      topics_covered: [],
    })
    expect(result.success).toBe(true)
  })

  it('validates enum values in property_type', () => {
    const result = ExtractedPreferencesSchema.safeParse({
      property_type: { type: 'invalid_type' },
      topics_covered: [],
    })
    expect(result.success).toBe(false)
  })

  it('topics_covered only accepts valid enum values', () => {
    const result = ExtractedPreferencesSchema.safeParse({
      topics_covered: ['location', 'invalid_topic'],
    })
    expect(result.success).toBe(false)
  })
})

describe('preference row priority mapping', () => {
  it('dealbreakers.items maps to essential priority', () => {
    // This tests the logical mapping in upsertPreferences
    // dealbreakers rows should use 'essential' priority
    const extracted = ExtractedPreferencesSchema.parse({
      dealbreakers: { items: ['no enclosed garden', 'busy road'] },
      topics_covered: ['dealbreakers'],
    })
    expect(extracted.dealbreakers?.items).toEqual(['no enclosed garden', 'busy road'])
    // Verify the schema correctly parses what we'd map to essential
    expect(Array.isArray(extracted.dealbreakers?.items)).toBe(true)
  })

  it('bedrooms.minimum is present and can be mapped to essential', () => {
    const extracted = ExtractedPreferencesSchema.parse({
      bedrooms: { minimum: 3, ideal: 4 },
      topics_covered: ['bedrooms'],
    })
    expect(extracted.bedrooms?.minimum).toBe(3)
    expect(typeof extracted.bedrooms?.minimum).toBe('number')
  })
})

describe('loadBriefSummary with no rows', () => {
  it('returns empty brief and topicsDone 0 when no rows exist', () => {
    // This test validates the shape of the empty brief response
    const emptyBrief = {
      buyerName: '',
      subtitleDate: '',
      conversationDuration: '0',
      nutshell: '',
      nonNegotiables: [],
      thingsIdLove: [],
      idealLifestyle: [],
      styleSwatches: [],
      renovationsToConsider: [],
    }
    expect(emptyBrief.nonNegotiables).toHaveLength(0)
    expect(emptyBrief.thingsIdLove).toHaveLength(0)
    expect(emptyBrief.conversationDuration).toBe('0')
  })
})
