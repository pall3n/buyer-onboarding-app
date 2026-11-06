import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

/**
 * Server Component client — read-only cookie access.
 * Use in Server Components and page.tsx files.
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // No setAll: Server Components cannot write response cookies
    },
  })
}

/**
 * Server Action / Route Handler client — read + write cookie access.
 * Use in Server Actions and route handlers.
 */
export async function createServerActionClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) =>
        toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
    },
  })
}
