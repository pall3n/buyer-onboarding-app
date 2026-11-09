import { z } from 'zod'
import { cache } from 'react'
import { getAdminClient } from '@/lib/supabase/admin'
import type { HomeBriefData, ImportanceItem } from '@/lib/demo-data'

// ─── Extraction schema ────────────────────────────────────────────────────────

export const ExtractedPreferencesSchema = z.object({
  location: z
    .object({
      area: z.string().optional(),
      commute_note: z.string().optional(),
    })
    .optional(),
  property_type: z
    .object({
      type: z.enum(['house', 'flat', 'any']).optional(),
      style: z.enum(['period', 'modern', 'new_build', 'any']).optional(),
    })
    .optional(),
  bedrooms: z
    .object({
      minimum: z.number().int().optional(),
      ideal: z.number().int().optional(),
      needs_home_office: z.boolean().optional(),
    })
    .optional(),
  lifestyle: z
    .object({
      pets: z.string().optional(),
      working_from_home: z.boolean().optional(),
      garden_required: z.boolean().optional(),
      hosts_regularly: z.boolean().optional(),
    })
    .optional(),
  budget: z
    .object({
      min_gbp: z.number().optional(),
      max_gbp: z.number().optional(),
      firmness: z.enum(['firm', 'flexible', 'unknown']).optional(),
    })
    .optional(),
  timing: z
    .object({
      chain_status: z.enum(['chain_free', 'has_chain', 'unknown']).optional(),
      urgency: z.enum(['urgent', 'flexible', 'unknown']).optional(),
    })
    .optional(),
  dealbreakers: z
    .object({
      items: z.array(z.string()).optional(),
    })
    .optional(),
  style: z
    .object({
      renovation_appetite: z
        .enum(['none', 'cosmetic', 'full', 'unknown'])
        .optional(),
      aesthetic_words: z.array(z.string()).optional(),
    })
    .optional(),
  topics_covered: z.array(
    z.enum([
      'location',
      'property_type',
      'bedrooms',
      'lifestyle',
      'budget',
      'timing',
      'dealbreakers',
      'style',
    ])
  ),
})

export type ExtractedPreferences = z.infer<typeof ExtractedPreferencesSchema>

// ─── Profile helpers ──────────────────────────────────────────────────────────

export const getOrCreateDraftProfile = cache(async function getOrCreateDraftProfile(
  subjectId: string
): Promise<{ profileId: string; versionId: string }> {
  const admin = getAdminClient()

  // Find or create home_profile for this subject
  let profileId: string

  const { data: existingProfile } = await admin
    .from('home_profiles')
    .select('id')
    .eq('subject_id', subjectId)
    .single()

  if (existingProfile) {
    profileId = existingProfile.id as string
  } else {
    const { data: newProfile, error } = await admin
      .from('home_profiles')
      .insert({ subject_id: subjectId })
      .select('id')
      .single()
    if (error || !newProfile) throw new Error(`Failed to create home profile: ${error?.message}`)
    profileId = newProfile.id as string
  }

  // Find existing draft version or create one
  const { data: existingDraft } = await admin
    .from('home_profile_versions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('status', 'draft')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (existingDraft) {
    return { profileId, versionId: existingDraft.id as string }
  }

  // Find max version number
  const { data: maxVersionRow } = await admin
    .from('home_profile_versions')
    .select('version_number')
    .eq('profile_id', profileId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = maxVersionRow ? (maxVersionRow.version_number as number) + 1 : 1

  const { data: newVersion, error: versionError } = await admin
    .from('home_profile_versions')
    .insert({ profile_id: profileId, version_number: nextVersion, status: 'draft' })
    .select('id')
    .single()

  if (versionError || !newVersion) {
    throw new Error(`Failed to create profile version: ${versionError?.message}`)
  }

  return { profileId, versionId: newVersion.id as string }
})

// ─── Preference upsert ────────────────────────────────────────────────────────

interface PrefRow {
  version_id: string
  category: string
  key: string
  typed_value: { value: unknown }
  priority: 'essential' | 'preferred' | 'flexible' | 'unknown'
  confirmation: 'suggested'
  source: 'conversation'
}

export async function upsertPreferences(
  versionId: string,
  extracted: ExtractedPreferences
): Promise<void> {
  const admin = getAdminClient()
  const rows: PrefRow[] = []

  function addRow(
    category: string,
    key: string,
    value: unknown,
    priority: PrefRow['priority']
  ) {
    if (value === undefined || value === null) return
    rows.push({
      version_id: versionId,
      category,
      key,
      typed_value: { value },
      priority,
      confirmation: 'suggested',
      source: 'conversation',
    })
  }

  // location
  if (extracted.location) {
    addRow('location', 'area', extracted.location.area, 'preferred')
    addRow('location', 'commute_note', extracted.location.commute_note, 'preferred')
  }

  // property_type
  if (extracted.property_type) {
    addRow('property_type', 'type', extracted.property_type.type, 'preferred')
    addRow('property_type', 'style', extracted.property_type.style, 'preferred')
  }

  // bedrooms
  if (extracted.bedrooms) {
    addRow('bedrooms', 'minimum', extracted.bedrooms.minimum, 'essential')
    addRow('bedrooms', 'ideal', extracted.bedrooms.ideal, 'preferred')
    addRow('bedrooms', 'needs_home_office', extracted.bedrooms.needs_home_office, 'preferred')
  }

  // lifestyle
  if (extracted.lifestyle) {
    addRow('lifestyle', 'pets', extracted.lifestyle.pets, 'preferred')
    addRow('lifestyle', 'working_from_home', extracted.lifestyle.working_from_home, 'preferred')
    addRow('lifestyle', 'garden_required', extracted.lifestyle.garden_required, 'preferred')
    addRow('lifestyle', 'hosts_regularly', extracted.lifestyle.hosts_regularly, 'preferred')
  }

  // budget
  if (extracted.budget) {
    addRow('budget', 'min_gbp', extracted.budget.min_gbp, 'preferred')
    addRow('budget', 'max_gbp', extracted.budget.max_gbp, 'preferred')
    addRow('budget', 'firmness', extracted.budget.firmness, 'preferred')
  }

  // timing
  if (extracted.timing) {
    addRow('timing', 'chain_status', extracted.timing.chain_status, 'preferred')
    addRow('timing', 'urgency', extracted.timing.urgency, 'preferred')
  }

  // dealbreakers — each item is essential
  if (extracted.dealbreakers?.items) {
    addRow('dealbreakers', 'items', extracted.dealbreakers.items, 'essential')
  }

  // style
  if (extracted.style) {
    addRow('style', 'renovation_appetite', extracted.style.renovation_appetite, 'preferred')
    addRow('style', 'aesthetic_words', extracted.style.aesthetic_words, 'preferred')
  }

  // topics_covered meta row
  rows.push({
    version_id: versionId,
    category: 'meta',
    key: 'topics_covered',
    typed_value: { value: extracted.topics_covered },
    priority: 'unknown',
    confirmation: 'suggested',
    source: 'conversation',
  })

  if (rows.length === 0) return

  // Delete existing preferences for this version and re-insert
  await admin.from('profile_preferences').delete().eq('version_id', versionId)
  await admin.from('profile_preferences').insert(rows)
}

// ─── Brief summary ────────────────────────────────────────────────────────────

interface PreferenceRow {
  category: string
  key: string
  typed_value: { value?: unknown }
  priority: string
}

export async function loadBriefSummary(
  versionId: string
): Promise<{ brief: HomeBriefData; topicsDone: number }> {
  const admin = getAdminClient()

  const { data: rows } = await admin
    .from('profile_preferences')
    .select('category, key, typed_value, priority')
    .eq('version_id', versionId)

  if (!rows || rows.length === 0) {
    return {
      brief: emptyBrief(),
      topicsDone: 0,
    }
  }

  const prefRows = rows as PreferenceRow[]

  // Calculate topicsDone from meta row
  const metaRow = prefRows.find(r => r.category === 'meta' && r.key === 'topics_covered')
  const topicsDone = Array.isArray(metaRow?.typed_value?.value)
    ? (metaRow.typed_value.value as unknown[]).length
    : 0

  // Build ImportanceItem lists
  const nonNegotiables: ImportanceItem[] = prefRows
    .filter(r => r.priority === 'essential' && r.category !== 'meta')
    .map(r => ({
      text: formatPrefLabel(r),
      importance: 'essential' as const,
    }))

  const thingsIdLove: ImportanceItem[] = prefRows
    .filter(
      r =>
        (r.priority === 'preferred' || r.priority === 'flexible') &&
        r.category !== 'meta'
    )
    .map(r => ({
      text: formatPrefLabel(r),
      importance: r.priority as 'preferred' | 'flexible',
    }))

  // Extract location for nutshell
  const locationRow = prefRows.find(r => r.category === 'location' && r.key === 'area')
  const locationArea =
    typeof locationRow?.typed_value?.value === 'string'
      ? locationRow.typed_value.value
      : ''

  return {
    brief: {
      buyerName: '',
      subtitleDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
      conversationDuration: String(topicsDone),
      nutshell: locationArea ? `Looking in ${locationArea}` : '',
      nonNegotiables,
      thingsIdLove,
      idealLifestyle: [],
      styleSwatches: [],
      renovationsToConsider: [],
    },
    topicsDone,
  }
}

function emptyBrief(): HomeBriefData {
  return {
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
}

function formatPrefLabel(row: PreferenceRow): string {
  const val = row.typed_value?.value
  if (Array.isArray(val)) return `${row.category}: ${val.join(', ')}`
  if (val !== undefined && val !== null) return `${row.category}: ${String(val)}`
  return `${row.category} / ${row.key}`
}

