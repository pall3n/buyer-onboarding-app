import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/lib/env'

let _adminClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase admin client that bypasses RLS.
 * Uses the service role key — NEVER reference this from client components.
 * Only called from server-side code (Server Actions, Route Handlers, Server Components).
 */
export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const { SUPABASE_URL, SERVICE_ROLE_KEY } = getEnv()
    _adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _adminClient
}
