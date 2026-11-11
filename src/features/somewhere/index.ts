import { getAdminClient } from '@/lib/supabase/admin'
import type { SomewhereConnection } from '@/features/buyer-account/index'

export type { SomewhereConnection }

export type SomewherePurpose =
  | 'property_intelligence'
  | 'location_data'
  | 'market_reports'

/**
 * Creates an explicit, purpose-specific Somewhere connection for a buyer.
 * This is intentionally separate from profile_shares (agency grants) — it uses
 * a different table and a different consent flow.
 * Returns the new connection ID.
 */
export async function createSomewhereConnection(
  subjectId: string,
  purposes: SomewherePurpose[]
): Promise<string> {
  if (subjectId.startsWith('demo-')) return 'demo-somewhere-connection'

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('somewhere_connections')
    .insert({
      subject_id: subjectId,
      purposes,
      status: 'active',
      consent_recorded_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) throw new Error('Failed to create Somewhere connection')

  return data.id as string
}

/**
 * Revokes the buyer's Somewhere connection.
 * Does NOT affect profile_shares — this is scoped to somewhere_connections only.
 */
export async function revokeSomewhereConnection(
  connectionId: string,
  subjectId: string
): Promise<void> {
  if (connectionId.startsWith('demo-')) return

  const admin = getAdminClient()

  // Ownership check: the connection must belong to this subject
  const { data: conn } = await admin
    .from('somewhere_connections')
    .select('id, subject_id')
    .eq('id', connectionId)
    .eq('subject_id', subjectId)
    .single()

  if (!conn) return

  await admin
    .from('somewhere_connections')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', connectionId)
}

/**
 * Loads active Somewhere connections for a subject.
 */
export async function loadSomewhereConnections(subjectId: string): Promise<SomewhereConnection[]> {
  if (subjectId.startsWith('demo-')) return []

  const admin = getAdminClient()
  const { data } = await admin
    .from('somewhere_connections')
    .select('id, subject_id, purposes, status, consent_recorded_at, revoked_at')
    .eq('subject_id', subjectId)
    .order('consent_recorded_at', { ascending: false })

  return (data ?? []).map(r => ({
    connectionId: r.id as string,
    subjectId: r.subject_id as string,
    purposes: (r.purposes as string[]) ?? [],
    status: r.status as SomewhereConnection['status'],
    consentRecordedAt: r.consent_recorded_at as string,
    revokedAt: (r.revoked_at as string | null) ?? null,
  }))
}
