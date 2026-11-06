import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!

let _adminClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase admin client that bypasses RLS.
 * Uses the service role key — NEVER reference this from client components.
 * Only called from server-side code (Server Actions, Route Handlers, Server Components).
 */
export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _adminClient
}
