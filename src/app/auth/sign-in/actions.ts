'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData): Promise<never> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createServerActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/auth/sign-in?error=invalid_credentials')
  }

  revalidatePath('/buyers', 'layout')
  redirect('/buyers')
}
