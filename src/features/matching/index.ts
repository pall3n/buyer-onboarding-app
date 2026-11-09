import { getAdminClient } from '@/lib/supabase/admin'
import type { FitItem, PropertyFitData, TrustStatus } from '@/lib/demo-data'
import type { PropertyFact, PropertyRecord } from '@/features/properties/index'
import { loadPropertyWithFacts } from '@/features/properties/index'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreferenceInput {
  category: string
  key: string
  typedValue: unknown
  priority: string
}

type MatchResult = {
  status: TrustStatus
  label: string
  detail: string
  source: string
} | null

interface MatchRule {
  prefCategory: string
  prefKey: string
  factCategory: string
  factKey: string
  apply: (
    prefValue: unknown,
    factValue: unknown | null,
    vs: string | null,
    sourceNote: string | null,
    priority: string,
    property: PropertyRecord
  ) => MatchResult
}

// ─── Verdict mapping ─────────────────────────────────────────────────────────

export const DB_VERDICT_TO_TRUST_STATUS: Record<string, TrustStatus> = {
  strong_fit: 'confirmed',
  potential: 'suggested',
  conflict: 'conflict',
  check_before_viewing: 'unknown',
}

// ─── Rules ───────────────────────────────────────────────────────────────────

const RULES: MatchRule[] = [
  // --- Hard rule: bedrooms minimum ---
  {
    prefCategory: 'bedrooms',
    prefKey: 'minimum',
    factCategory: 'bedrooms',
    factKey: 'count',
    apply: (prefValue, factValue, vs, sourceNote) => {
      const min = Number(prefValue)
      const src = sourceNote ?? (vs === 'verified' ? 'Floor plan' : 'Property listing')
      if (factValue === null) {
        return { status: 'unknown', label: 'Bedrooms', detail: `Requires ${min}+ bedrooms — count unconfirmed.`, source: src }
      }
      const count = Number(factValue)
      if (count < min) {
        return { status: 'conflict', label: 'Bedrooms', detail: `${count} bedrooms listed; ${min} required as a minimum.`, source: src }
      }
      const extra = count > min ? ` (+${count - min} extra)` : ''
      return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Bedrooms', detail: `${count} bedrooms${extra}.`, source: src }
    },
  },

  // --- Hard rule: garden presence ---
  {
    prefCategory: 'lifestyle',
    prefKey: 'garden_required',
    factCategory: 'lifestyle',
    factKey: 'has_garden',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (prefValue !== true) return null
      const src = sourceNote ?? (vs === 'verified' ? 'Floor plan' : 'Property listing')
      if (factValue === null) {
        return { status: 'unknown', label: 'Garden', detail: 'Garden presence unconfirmed.', source: src }
      }
      if (factValue === false) {
        return { status: 'conflict', label: 'Garden', detail: 'No garden — a non-negotiable for this buyer.', source: src }
      }
      return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Garden', detail: 'Garden confirmed.', source: src }
    },
  },

  // --- Hard rule: garden privacy (garden_private = false → conflict when garden required) ---
  {
    prefCategory: 'lifestyle',
    prefKey: 'garden_required',
    factCategory: 'lifestyle',
    factKey: 'garden_private',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (prefValue !== true) return null
      if (factValue === null) return null  // unknown privacy → will appear in worthAsking
      const src = sourceNote ?? (vs === 'verified' ? 'Floor plan' : 'Property listing')
      if (factValue === false) {
        return { status: 'conflict', label: 'Garden: south-facing', detail: 'Adjacent development will overlook the garden after completion.', source: src }
      }
      return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Garden: south-facing', detail: 'Private south-facing garden.', source: src }
    },
  },

  // --- Soft: property type match ---
  {
    prefCategory: 'property_type',
    prefKey: 'type',
    factCategory: 'property_type',
    factKey: 'type',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (!prefValue || prefValue === 'any') return null
      const src = sourceNote ?? (vs === 'verified' ? 'Land registry' : 'Property listing')
      if (factValue === null) {
        return { status: 'unknown', label: 'Property type', detail: `Buyer prefers a ${String(prefValue)} — type unconfirmed.`, source: src }
      }
      if (prefValue === factValue) {
        return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Property type', detail: `${capitalise(String(factValue))} — matches preference.`, source: src }
      }
      return { status: 'conflict', label: 'Property type', detail: `Listed as ${String(factValue)}; buyer prefers ${String(prefValue)}.`, source: src }
    },
  },

  // --- Soft: ideal bedroom count ---
  {
    prefCategory: 'bedrooms',
    prefKey: 'ideal',
    factCategory: 'bedrooms',
    factKey: 'count',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (factValue === null || prefValue === null || prefValue === undefined) return null
      const ideal = Number(prefValue)
      const count = Number(factValue)
      const src = sourceNote ?? (vs === 'verified' ? 'Floor plan' : 'Property listing')
      if (count >= ideal) {
        return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Bedroom count', detail: `${count} bedrooms meets ideal of ${ideal}.`, source: src }
      }
      return { status: 'suggested', label: 'Bedroom count', detail: `${count} bedrooms — ideal was ${ideal}.`, source: src }
    },
  },

  // --- Soft: budget vs asking price ---
  {
    prefCategory: 'budget',
    prefKey: 'max_gbp',
    factCategory: 'budget',  // virtual — resolved from property record below
    factKey: 'asking_price',
    apply: (prefValue, _factValue, _vs, _sourceNote, _priority, property) => {
      if (!prefValue) return null
      const maxGbp = Number(prefValue)
      const priceGbp = Math.round(property.askingPrice / 100)
      const address = `${property.addressLine1}, ${property.postcode}`
      if (priceGbp <= maxGbp) {
        return { status: 'confirmed', label: 'Budget', detail: `Asking price £${formatPrice(priceGbp)} within stated maximum of £${formatPrice(maxGbp)}.`, source: address }
      }
      if (priceGbp <= Math.round(maxGbp * 1.10)) {
        return { status: 'suggested', label: 'Budget', detail: `Asking price £${formatPrice(priceGbp)} is slightly over stated maximum of £${formatPrice(maxGbp)}.`, source: address }
      }
      return { status: 'conflict', label: 'Budget', detail: `Asking price £${formatPrice(priceGbp)} exceeds stated maximum of £${formatPrice(maxGbp)}.`, source: address }
    },
  },

  // --- Soft: location area ---
  {
    prefCategory: 'location',
    prefKey: 'area',
    factCategory: 'location',
    factKey: 'area',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (!prefValue) return null
      const src = sourceNote ?? (vs === 'verified' ? 'OS data' : 'Property listing')
      if (factValue === null) {
        return { status: 'unknown', label: 'Location', detail: `Buyer is looking in ${String(prefValue)} — location unconfirmed.`, source: src }
      }
      const prefArea = String(prefValue).toLowerCase()
      const factArea = String(factValue).toLowerCase()
      if (prefArea === factArea || factArea.includes(prefArea) || prefArea.includes(factArea)) {
        return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Location', detail: `${String(factValue)} matches buyer's preferred area.`, source: src }
      }
      return { status: 'suggested', label: 'Location', detail: `Property in ${String(factValue)}; buyer specified ${String(prefValue)}.`, source: src }
    },
  },

  // --- Soft: renovation appetite vs condition ---
  {
    prefCategory: 'style',
    prefKey: 'renovation_appetite',
    factCategory: 'condition',
    factKey: 'state',
    apply: (prefValue, factValue, vs, sourceNote) => {
      if (!prefValue || prefValue === 'unknown') return null
      const src = sourceNote ?? (vs === 'verified' ? 'Survey' : 'Agent notes')
      if (factValue === null) {
        return { status: 'unknown', label: 'Condition', detail: 'Property condition not confirmed.', source: src }
      }
      if (prefValue === 'none' && factValue === 'move_in_ready') {
        return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Condition', detail: 'Move-in ready — matches buyer\'s preference for no renovation.', source: src }
      }
      if (prefValue === 'none' && factValue === 'light_cosmetic') {
        return { status: 'suggested', label: 'Condition', detail: 'Light cosmetic work likely — buyer prefers move-in ready.', source: src }
      }
      if ((prefValue === 'cosmetic' || prefValue === 'full') && factValue !== 'move_in_ready') {
        return { status: vs === 'verified' ? 'confirmed' : 'suggested', label: 'Condition', detail: `${conditionLabel(String(factValue))} — buyer open to renovation.`, source: src }
      }
      return null
    },
  },
]

// ─── Core matching function ───────────────────────────────────────────────────

export function runMatching(
  preferences: PreferenceInput[],
  facts: PropertyFact[],
  property: PropertyRecord
): PropertyFitData {
  const prefMap = new Map<string, { typedValue: unknown; priority: string }>()
  for (const p of preferences) {
    prefMap.set(`${p.category}.${p.key}`, { typedValue: p.typedValue, priority: p.priority })
  }

  const factMap = new Map<string, { typedValue: unknown; vs: string; sourceNote: string | null }>()
  for (const f of facts) {
    factMap.set(`${f.category}.${f.key}`, {
      typedValue: f.typedValue,
      vs: f.verificationState,
      sourceNote: f.sourceNote,
    })
  }

  const strongMatches: FitItem[] = []
  const compromises: FitItem[] = []
  const conflicts: FitItem[] = []
  const unknowns: FitItem[] = []
  const seenLabels = new Set<string>()

  for (const rule of RULES) {
    const pref = prefMap.get(`${rule.prefCategory}.${rule.prefKey}`)
    if (!pref) continue

    // Budget rule uses property record for the fact value
    let factEntry: { typedValue: unknown; vs: string; sourceNote: string | null } | undefined
    if (rule.prefKey === 'max_gbp') {
      factEntry = { typedValue: null, vs: 'verified', sourceNote: null }
    } else {
      factEntry = factMap.get(`${rule.factCategory}.${rule.factKey}`)
    }

    const result = rule.apply(
      pref.typedValue,
      factEntry?.typedValue ?? null,
      factEntry?.vs ?? null,
      factEntry?.sourceNote ?? null,
      pref.priority,
      property
    )

    if (!result) continue
    if (seenLabels.has(result.label)) continue
    seenLabels.add(result.label)

    const item: FitItem = {
      label: result.label,
      detail: result.detail,
      status: result.status,
      source: result.source,
    }

    if (result.status === 'conflict') conflicts.push(item)
    else if (result.status === 'confirmed') strongMatches.push(item)
    else if (result.status === 'suggested') compromises.push(item)
    else unknowns.push(item)
  }

  // Dealbreakers → worthAsking
  const dbPref = prefMap.get('dealbreakers.items')
  const worthAsking: string[] = []
  if (dbPref && Array.isArray(dbPref.typedValue)) {
    for (const item of dbPref.typedValue as string[]) {
      worthAsking.push(`Does this property have any issues with: ${item}?`)
    }
  }

  const verdict = deriveVerdict(conflicts.length, strongMatches.length, unknowns.length)

  return {
    propertyName: property.addressLine1,
    propertyAddress: `${property.addressLine1}, ${property.postcode}`,
    propertyPrice: `£${formatPrice(Math.round(property.askingPrice / 100))}`,
    propertyVerdict: DB_VERDICT_TO_TRUST_STATUS[verdict] ?? 'suggested',
    strongMatches,
    compromises,
    conflicts,
    unknowns,
    worthAsking,
  }
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

export function deriveVerdict(
  conflictCount: number,
  strongCount: number,
  unknownCount: number
): string {
  if (conflictCount > 0) return 'conflict'
  if (strongCount >= 3 && unknownCount === 0) return 'strong_fit'
  if (unknownCount > 0) return 'check_before_viewing'
  return 'potential'
}

export async function loadAnalysis(
  agencyBuyerId: string,
  propertyId: string,
  agencyId?: string
): Promise<PropertyFitData | null> {
  const admin = getAdminClient()

  let query = admin
    .from('property_analyses')
    .select('result_json')
    .eq('agency_buyer_id', agencyBuyerId)
    .eq('property_id', propertyId)

  if (agencyId) {
    query = query.eq('agency_id', agencyId)
  }

  const { data } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return data.result_json as PropertyFitData
}

export async function runAndPersistAnalysis(
  agencyBuyerId: string,
  propertyId: string,
  agencyId: string
): Promise<void> {
  const admin = getAdminClient()

  // 1. Find home_profile → draft profile_version via subject_id
  const { data: agencyBuyer } = await admin
    .from('agency_buyers')
    .select('id, subject_id')
    .eq('id', agencyBuyerId)
    .eq('agency_id', agencyId)
    .single()

  if (!agencyBuyer) throw new Error('Agency buyer not found or not authorized')

  const { data: profile } = await admin
    .from('home_profiles')
    .select('id')
    .eq('subject_id', agencyBuyer.subject_id)
    .single()

  if (!profile) throw new Error('No home profile found for buyer')

  const { data: version } = await admin
    .from('home_profile_versions')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('status', 'draft')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (!version) throw new Error('No draft profile version found')

  // 2. Load preferences
  const { data: prefRows } = await admin
    .from('profile_preferences')
    .select('category, key, typed_value, priority')
    .eq('version_id', version.id)
    .neq('category', 'meta')

  const preferences = (prefRows ?? []).map(row => ({
    category: row.category as string,
    key: row.key as string,
    typedValue: (row.typed_value as { value?: unknown })?.value ?? null,
    priority: row.priority as string,
  }))

  // 3. Load property + facts
  const propertyData = await loadPropertyWithFacts(propertyId)
  if (!propertyData) throw new Error('Property not found')

  // 4. Run matching
  const fitData = runMatching(preferences, propertyData.facts, propertyData.property)
  const verdict = deriveVerdict(fitData.conflicts.length, fitData.strongMatches.length, fitData.unknowns.length)

  // 5. Replace existing analysis, insert fresh
  await admin
    .from('property_analyses')
    .delete()
    .eq('agency_buyer_id', agencyBuyerId)
    .eq('property_id', propertyId)

  const { error } = await admin
    .from('property_analyses')
    .insert({
      agency_id: agencyId,
      property_id: propertyId,
      agency_buyer_id: agencyBuyerId,
      profile_version_id: version.id,
      property_revision: propertyData.property.revision,
      verdict,
      result_json: fitData,
    })

  if (error) throw new Error(`Analysis failed to save: ${error.message}`)
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatPrice(n: number): string {
  return n.toLocaleString('en-GB')
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function conditionLabel(state: string): string {
  const map: Record<string, string> = {
    move_in_ready: 'Move-in ready',
    light_cosmetic: 'Light cosmetic work',
    full_renovation: 'Full renovation needed',
  }
  return map[state] ?? capitalise(state.replace(/_/g, ' '))
}
