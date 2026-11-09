import { describe, it, expect } from 'vitest'
import { generateBrief } from '@/features/viewing-briefs/index'
import type { PropertyFitData } from '@/lib/demo-data'

const baseProperty = {
  id: 'prop-1',
  addressLine1: 'Larkfield House',
  postcode: 'TN15 7PQ',
  askingPrice: 72500000,
  revision: 1,
}

const baseMeta = {
  profileVersionId: 'v1',
  profileVersionDate: '29 Oct',
  propertyRevision: 1,
  propertyRevisionDate: '30 Oct',
}

const baseBuyer = { name: 'Maya and James Reid' }
const baseAgent = { name: 'Sophie Lane', agencyName: 'Hartfield & Rowe' }

function emptyFit(): PropertyFitData {
  return {
    propertyName: 'Larkfield House',
    propertyAddress: 'Larkfield House, TN15 7PQ',
    propertyPrice: '£725,000',
    propertyVerdict: 'confirmed',
    strongMatches: [],
    compromises: [],
    conflicts: [],
    unknowns: [],
    worthAsking: [],
  }
}

describe('generateBrief — conflicts', () => {
  it('sets hasConflicts, conflictLabels and beUpfrontAbout when conflicts exist', () => {
    const fit: PropertyFitData = {
      ...emptyFit(),
      conflicts: [
        { label: 'Garden privacy', detail: 'Overlooked by neighbours', source: 'Listing', status: 'conflict' },
        { label: 'Busy road', detail: 'Main road frontage', source: 'Agent notes', status: 'conflict' },
      ],
    }

    const brief = generateBrief(fit, [], baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.hasConflicts).toBe(true)
    expect(brief.conflictLabels).toEqual(['Garden privacy', 'Busy road'])
    expect(brief.beUpfrontAbout).toHaveLength(2)
    expect(brief.beUpfrontAbout[0].title).toBe('Garden privacy')
    expect(brief.beUpfrontAbout[0].description).toBe('Overlooked by neighbours')
  })
})

describe('generateBrief — strong matches', () => {
  it('populates threeThingsToShow from top 3 strongMatches', () => {
    const fit: PropertyFitData = {
      ...emptyFit(),
      strongMatches: [
        { label: 'Garden', detail: 'Private rear garden', source: 'Listing', status: 'confirmed' },
        { label: 'Walkability', detail: '5-min to town', source: 'Walk score', status: 'confirmed' },
        { label: 'Period character', detail: 'Victorian semi', source: 'Listing', status: 'confirmed' },
        { label: 'Bedrooms', detail: '4 bedrooms', source: 'Listing', status: 'confirmed' },
      ],
    }

    const brief = generateBrief(fit, [], baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.threeThingsToShow).toHaveLength(3)
    expect(brief.threeThingsToShow[0].title).toBe('Garden')
    expect(brief.threeThingsToShow[2].title).toBe('Period character')
    expect(brief.whatTheyCareAbout).toHaveLength(4) // all 4 fit in 5-cap
  })
})

describe('generateBrief — worthAsking', () => {
  it('maps worthAsking to questionsToAsk', () => {
    const fit: PropertyFitData = {
      ...emptyFit(),
      worthAsking: ['Is the rear garden secure?', 'What is the shared passage arrangement?'],
    }

    const brief = generateBrief(fit, [], baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.questionsToAsk).toEqual(['Is the rear garden secure?', 'What is the shared passage arrangement?'])
  })
})

describe('generateBrief — unknowns', () => {
  it('maps unknowns to localEvidence with status unknown and checkBeforeViewing with "Confirm:" prefix', () => {
    const fit: PropertyFitData = {
      ...emptyFit(),
      unknowns: [
        { label: 'Side passage', detail: 'Title register note', source: 'Title register', status: 'unknown' },
        { label: 'Rear fence', detail: 'Listing photos only', source: 'Photos', status: 'unknown' },
      ],
    }

    const brief = generateBrief(fit, [], baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.localEvidence).toHaveLength(2)
    expect(brief.localEvidence[0].status).toBe('unknown')
    expect(brief.localEvidence[0].label).toBe('Side passage')
    expect(brief.localEvidence[1].source).toBe('Photos')

    expect(brief.checkBeforeViewing).toHaveLength(2)
    expect(brief.checkBeforeViewing[0].item).toBe('Confirm: Side passage')
    expect(brief.checkBeforeViewing[0].done).toBe(false)
    expect(brief.checkBeforeViewing[1].item).toBe('Confirm: Rear fence')
  })
})

describe('generateBrief — empty fitData', () => {
  it('returns valid brief with no crash when all arrays are empty', () => {
    const fit = emptyFit()
    const brief = generateBrief(fit, [], baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.hasConflicts).toBe(false)
    expect(brief.conflictLabels).toEqual([])
    expect(brief.beUpfrontAbout).toEqual([])
    expect(brief.threeThingsToShow).toEqual([])
    expect(brief.localEvidence).toEqual([])
    expect(brief.checkBeforeViewing).toEqual([])
    expect(brief.questionsToAsk).toEqual([])
    expect(brief.version).toBe(1)
  })
})

describe('generateBrief — buyerSnapshot', () => {
  it('includes buyer name and location preference when present', () => {
    const prefs = [
      { category: 'bedrooms', key: 'minimum', typedValue: 3 },
      { category: 'budget', key: 'max_gbp', typedValue: 800000 },
      { category: 'location', key: 'area', typedValue: 'Sevenoaks' },
    ]

    const brief = generateBrief(emptyFit(), prefs, baseProperty, baseBuyer, baseAgent, baseMeta)

    expect(brief.buyerSnapshot).toContain('Maya and James Reid')
    expect(brief.buyerSnapshot).toContain('Sevenoaks')
    expect(brief.buyerSnapshot).toContain('£800,000')
  })
})
