import { getAdminClient } from '@/lib/supabase/admin'

// ─── Privacy thresholds ───────────────────────────────────────────────────────

/** Total cohort must reach this before any demand data is shown */
export const MINIMUM_COHORT = 10

/** Individual cell counts below this are shown as redacted */
export const MINIMUM_CELL = 3

/** Profile freshness: ignore profiles approved more than this many days ago */
const STALE_DAYS = 90

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CohortRow {
  label: string
  /** null means count was below MINIMUM_CELL and has been suppressed */
  count: number | null
}

export interface DemandSnapshot {
  asOf: string
  agencyName: string
  totalActiveBuyers: number
  /** true when totalActiveBuyers < MINIMUM_COHORT — no detail shown */
  suppressed: boolean
  byArea: CohortRow[]
  byBudget: CohortRow[]
  byBedrooms: CohortRow[]
  gardenDemand: { count: number | null; note: string } | null
  exclusions: {
    inactive: number
    staleProfile: number
    noApprovedProfile: number
  }
  source: 'demo' | 'live'
  disclaimer: string
}

// ─── Budget band labelling ────────────────────────────────────────────────────

interface BudgetBand {
  label: string
  min: number  // pence
  max: number  // pence — Infinity for the top band
}

const BUDGET_BANDS: BudgetBand[] = [
  { label: 'Up to £500,000',      min: 0,          max: 50_000_000 },
  { label: '£500,000 – £700,000', min: 50_000_000, max: 70_000_000 },
  { label: '£700,000 – £900,000', min: 70_000_000, max: 90_000_000 },
  { label: 'Over £900,000',       min: 90_000_000, max: Infinity   },
]

function budgetBand(maxGbp: number): string {
  const pence = maxGbp * 100
  for (const band of BUDGET_BANDS) {
    if (pence <= band.max) return band.label
  }
  return BUDGET_BANDS[BUDGET_BANDS.length - 1].label
}

function bedroomLabel(minimum: number): string {
  if (minimum <= 2) return '2 bedrooms'
  if (minimum === 3) return '3 bedrooms'
  if (minimum === 4) return '4 bedrooms'
  return '5+ bedrooms'
}

// ─── Suppression helpers ──────────────────────────────────────────────────────

/** Returns the count if it meets MINIMUM_CELL, otherwise null (redacted) */
export function suppressSmall(count: number): number | null {
  return count >= MINIMUM_CELL ? count : null
}

function toCohortRows(counts: Map<string, number>): CohortRow[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count: suppressSmall(count) }))
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

const DISCLAIMER =
  "These figures represent indications of buyer preferences recorded with this agency. " +
  "They are not offers, guarantees of purchase, valuations, or confirmations of any " +
  "buyer's financial qualification. Buyer searches may change, lapse, or be withdrawn " +
  "at any time. This snapshot should not be presented as a confirmed list of purchasers."

// ─── Live computation ─────────────────────────────────────────────────────────

/**
 * Computes a privacy-safe demand snapshot from real profile_preferences data.
 * Each agency_buyer counts once regardless of household composition.
 * Buyers with inactive status, stale profiles, or no approved version are excluded.
 */
export async function computeDemandSnapshot(agencyId: string): Promise<DemandSnapshot> {
  const admin = getAdminClient()
  const asOf = new Date().toISOString()
  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Load agency name for the pitch paragraph
  const { data: agencyRow } = await admin
    .from('agencies')
    .select('name')
    .eq('id', agencyId)
    .single()
  const agencyName = (agencyRow?.name as string | null) ?? 'Your agency'

  // 1. All buyers for this agency
  const { data: allBuyers } = await admin
    .from('agency_buyers')
    .select('id, status')
    .eq('agency_id', agencyId)

  const activeBuyerIds = (allBuyers ?? []).filter(b => b.status === 'active').map(b => b.id as string)
  const inactiveCount = (allBuyers ?? []).length - activeBuyerIds.length

  if (activeBuyerIds.length === 0) {
    return {
      asOf, agencyName, totalActiveBuyers: 0, suppressed: true,
      byArea: [], byBudget: [], byBedrooms: [], gardenDemand: null,
      exclusions: { inactive: inactiveCount, staleProfile: 0, noApprovedProfile: 0 },
      source: 'live', disclaimer: DISCLAIMER,
    }
  }

  // 2. Home profiles per buyer
  const { data: profiles } = await admin
    .from('home_profiles')
    .select('id, agency_buyer_id')
    .in('agency_buyer_id', activeBuyerIds)

  const profileByBuyer = new Map<string, string>()
  for (const p of profiles ?? []) {
    profileByBuyer.set(p.agency_buyer_id as string, p.id as string)
  }

  // 3. Latest approved profile version per home_profile, within freshness window
  const profileIds = Array.from(profileByBuyer.values())
  let freshVersions: Map<string, string> = new Map()
  let staleCount = 0
  let noProfileCount = 0

  if (profileIds.length > 0) {
    const { data: versions } = await admin
      .from('home_profile_versions')
      .select('id, home_profile_id, created_at')
      .in('home_profile_id', profileIds)
      .eq('status', 'approved')
      .gte('created_at', staleThreshold)
      .order('created_at', { ascending: false })

    // Latest fresh approved version per profile
    const seen = new Set<string>()
    for (const v of versions ?? []) {
      const profileId = v.home_profile_id as string
      if (!seen.has(profileId)) {
        freshVersions.set(profileId, v.id as string)
        seen.add(profileId)
      }
    }
  }

  // Count buyers with no fresh approved version
  for (const buyerId of activeBuyerIds) {
    const profileId = profileByBuyer.get(buyerId)
    if (!profileId) {
      noProfileCount++
    } else if (!freshVersions.has(profileId)) {
      staleCount++
    }
  }

  // 4. Collect eligible buyer IDs
  const eligibleBuyerIds = activeBuyerIds.filter(buyerId => {
    const profileId = profileByBuyer.get(buyerId)
    return profileId && freshVersions.has(profileId)
  })

  const totalActiveBuyers = eligibleBuyerIds.length

  if (totalActiveBuyers < MINIMUM_COHORT) {
    return {
      asOf, agencyName, totalActiveBuyers, suppressed: true,
      byArea: [], byBudget: [], byBedrooms: [], gardenDemand: null,
      exclusions: { inactive: inactiveCount, staleProfile: staleCount, noApprovedProfile: noProfileCount },
      source: 'live', disclaimer: DISCLAIMER,
    }
  }

  // 5. Load preferences for eligible versions
  const eligibleProfileIds = eligibleBuyerIds
    .map(id => profileByBuyer.get(id))
    .filter(Boolean) as string[]
  const eligibleVersionIds = eligibleProfileIds
    .map(pid => freshVersions.get(pid))
    .filter(Boolean) as string[]

  const { data: prefRows } = await admin
    .from('profile_preferences')
    .select('version_id, category, key, typed_value')
    .in('version_id', eligibleVersionIds)

  // Index by version_id
  const prefsByVersion = new Map<string, Array<{ category: string; key: string; typedValue: unknown }>>()
  for (const row of prefRows ?? []) {
    const vid = row.version_id as string
    if (!prefsByVersion.has(vid)) prefsByVersion.set(vid, [])
    prefsByVersion.get(vid)!.push({
      category: row.category as string,
      key: row.key as string,
      typedValue: (row.typed_value as { value?: unknown })?.value ?? null,
    })
  }

  // 6. Aggregate — one entry per eligible buyer
  const areaCounts = new Map<string, number>()
  const budgetCounts = new Map<string, number>()
  const bedroomCounts = new Map<string, number>()
  let gardenCount = 0

  for (const buyerId of eligibleBuyerIds) {
    const profileId = profileByBuyer.get(buyerId)!
    const versionId = freshVersions.get(profileId)!
    const prefs = prefsByVersion.get(versionId) ?? []

    for (const pref of prefs) {
      if (pref.category === 'location' && pref.key === 'area' && typeof pref.typedValue === 'string' && pref.typedValue) {
        areaCounts.set(pref.typedValue, (areaCounts.get(pref.typedValue) ?? 0) + 1)
      }
      if (pref.category === 'budget' && pref.key === 'max_gbp' && typeof pref.typedValue === 'number') {
        const band = budgetBand(pref.typedValue)
        budgetCounts.set(band, (budgetCounts.get(band) ?? 0) + 1)
      }
      if (pref.category === 'bedrooms' && pref.key === 'minimum' && typeof pref.typedValue === 'number') {
        const label = bedroomLabel(pref.typedValue)
        bedroomCounts.set(label, (bedroomCounts.get(label) ?? 0) + 1)
      }
      if (pref.category === 'lifestyle' && pref.key === 'garden_required' && pref.typedValue === true) {
        gardenCount++
      }
    }
  }

  return {
    asOf,
    agencyName,
    totalActiveBuyers,
    suppressed: false,
    byArea: toCohortRows(areaCounts),
    byBudget: toCohortRows(budgetCounts),
    byBedrooms: toCohortRows(bedroomCounts),
    gardenDemand: {
      count: suppressSmall(gardenCount),
      note: 'Buyers with an explicit garden requirement',
    },
    exclusions: { inactive: inactiveCount, staleProfile: staleCount, noApprovedProfile: noProfileCount },
    source: 'live',
    disclaimer: DISCLAIMER,
  }
}

// ─── Re-export ────────────────────────────────────────────────────────────────

export { DISCLAIMER }
