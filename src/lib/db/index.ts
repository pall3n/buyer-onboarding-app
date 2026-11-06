import { getAdminClient } from '@/lib/supabase/admin'

interface AuditEventParams {
  actorType: string
  actorId?: string
  agencyId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}

/**
 * Appends an event to the audit_events table via the admin client.
 * Fire-and-forget — never throws; logs errors to console.error.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const admin = getAdminClient()
    await admin.from('audit_events').insert({
      actor_type: params.actorType,
      actor_id: params.actorId ?? null,
      agency_id: params.agencyId ?? null,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      safe_metadata: params.metadata ?? {},
    })
  } catch (err) {
    console.error('[audit] Failed to log audit event:', err)
  }
}
