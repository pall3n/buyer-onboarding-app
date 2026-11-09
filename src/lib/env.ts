import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SERVICE_ROLE_KEY: z.string().min(1, 'SERVICE_ROLE_KEY is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  OPENAI_API_KEY: z.string().min(1).optional(),
})

type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env)
  }
  return _env
}
