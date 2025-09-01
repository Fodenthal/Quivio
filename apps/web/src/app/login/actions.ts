'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const birthYear = formData.get('birthYear') as string

  // Server-side age validation
  if (birthYear) {
    const currentYear = new Date().getFullYear()
    const age = currentYear - parseInt(birthYear)
    
    if (age < 13) {
      // Redirect to error page with age-specific message
      redirect('/error?message=age_requirement')
    }
  }

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
    console.error('Signup error:', error)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
