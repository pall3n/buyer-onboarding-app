import { getAdminClient } from '@/lib/supabase/admin'
import { requireAgentAuthForRoute } from '@/lib/auth/index'
import { loadPropertyWithFacts } from '@/features/properties/index'
import { runMatching, deriveVerdict, loadAnalysis, DB_VERDICT_TO_TRUST_STATUS } from '@/features/matching/index'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agencyBuyerId = searchParams.get('agencyBuyerId')
  const propertyId = searchParams.get('propertyId')

  if (!agencyBuyerId || !propertyId) {
    return new Response('Missing agencyBuyerId or propertyId', { status: 400 })
  }

  const agent = await requireAgentAuthForRoute()
  if (!agent) return new Response('Unauthorized', { status: 401 })

  const fitData = await loadAnalysis(agencyBuyerId, propertyId)
  if (!fitData) return new Response('Not found', { status: 404 })

  return Response.json({ fitData })
}

export async function POST(request: Request) {
  const { agencyBuyerId, propertyId } = await request.json() as {
    agencyBuyerId: string
    propertyId: string
  }

  const agent = await requireAgentAuthForRoute()
  if (!agent) return new Response('Unauthorized', { status: 401 })

  const admin = getAdminClient()

  // 1. Verify agencyBuyerId belongs to agent's agency and get subject_id
  const { data: agencyBuyer } = await admin
    .from('agency_buyers')
    .select('id, subject_id')
    .eq('id', agencyBuyerId)
    .eq('agency_id', agent.agencyId)
    .single()

  if (!agencyBuyer) return new Response('Agency buyer not found', { status: 404 })

  // 2. Find home_profile → draft profile_version
  const { data: profile } = await admin
    .from('home_profiles')
    .select('id')
    .eq('subject_id', agencyBuyer.subject_id)
    .single()

  if (!profile) return new Response('No home profile found for buyer', { status: 404 })

  const { data: version } = await admin
    .from('home_profile_versions')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('status', 'draft')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (!version) return new Response('No draft profile version found', { status: 404 })

  // 3. Load preferences
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

  // 4. Load property + facts
  const propertyData = await loadPropertyWithFacts(propertyId)
  if (!propertyData) return new Response('Property not found', { status: 404 })

  // 5. Run matching
  const fitData = runMatching(preferences, propertyData.facts, propertyData.property)

  // 6. Derive DB verdict
  const verdict = deriveVerdict(
    fitData.conflicts.length,
    fitData.strongMatches.length,
    fitData.unknowns.length
  )

  // 7. Replace any existing analysis for this buyer+property, then insert fresh
  await admin
    .from('property_analyses')
    .delete()
    .eq('agency_buyer_id', agencyBuyerId)
    .eq('property_id', propertyId)

  const { error } = await admin
    .from('property_analyses')
    .insert({
      agency_id: agent.agencyId,
      property_id: propertyId,
      agency_buyer_id: agencyBuyerId,
      profile_version_id: version.id,
      property_revision: propertyData.property.revision,
      verdict,
      result_json: fitData,
    })

  if (error) {
    console.error('[analysis] insert failed:', error)
    return new Response('Analysis failed to save', { status: 500 })
  }

  // Suppress unused import warning
  void DB_VERDICT_TO_TRUST_STATUS

  return Response.json({ fitData })
}
