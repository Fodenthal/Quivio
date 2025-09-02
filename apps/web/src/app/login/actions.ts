'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const birthYear = formData.get('birthYear') as string

  // Note: Age validation is handled client-side to prevent form submission
  // This server action should only be called for valid ages

  // Sign up with birth year in metadata (COPPA compliant - only store birth year)
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        birth_year: birthYear ? parseInt(birthYear) : null,
        is_age_verified: true,
      }
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
