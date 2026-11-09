import { getAdminClient } from '@/lib/supabase/admin'
import { requireAgentAuthForRoute } from '@/lib/auth/index'
import { loadAnalysis, runAndPersistAnalysis } from '@/features/matching/index'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agencyBuyerId = searchParams.get('agencyBuyerId')
  const propertyId = searchParams.get('propertyId')

  if (!agencyBuyerId || !propertyId) {
    return new Response('Missing agencyBuyerId or propertyId', { status: 400 })
  }

  const agent = await requireAgentAuthForRoute()
  if (!agent) return new Response('Unauthorized', { status: 401 })

  // Verify agencyBuyerId belongs to this agent's agency
  const admin = getAdminClient()
  const { data: ab } = await admin
    .from('agency_buyers')
    .select('id')
    .eq('id', agencyBuyerId)
    .eq('agency_id', agent.agencyId)
    .single()

  if (!ab) return new Response('Not found', { status: 404 })

  const fitData = await loadAnalysis(agencyBuyerId, propertyId, agent.agencyId)
  if (!fitData) return new Response('Not found', { status: 404 })

  return Response.json({ fitData })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { agencyBuyerId?: string; propertyId?: string } | null
  if (!body?.agencyBuyerId || !body?.propertyId) {
    return new Response('Missing agencyBuyerId or propertyId', { status: 400 })
  }

  const { agencyBuyerId, propertyId } = body

  const agent = await requireAgentAuthForRoute()
  if (!agent) return new Response('Unauthorized', { status: 401 })

  try {
    await runAndPersistAnalysis(agencyBuyerId, propertyId, agent.agencyId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analysis] POST failed:', msg)
    if (msg.includes('not found') || msg.includes('not authorized')) {
      return new Response(msg, { status: 404 })
    }
    return new Response('Analysis failed', { status: 500 })
  }

  const fitData = await loadAnalysis(agencyBuyerId, propertyId, agent.agencyId)
  return Response.json({ fitData })
}
