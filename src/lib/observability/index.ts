import { getAdminClient } from '@/lib/supabase/admin'

interface AuditEventParams {
  actorType: string
  actorId: string
  agencyId: string
  action: string
  targetType?: string
  targetId?: string
  safeMetadata?: Record<string, unknown>
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const admin = getAdminClient()
    await admin.from('audit_events').insert({
      actor_type: params.actorType,
      actor_id: params.actorId,
      agency_id: params.agencyId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      safe_metadata: params.safeMetadata ?? {},
    })
  } catch (err) {
    // Audit failures are non-fatal
    console.error('[audit] failed to log event:', err)
  }
}
