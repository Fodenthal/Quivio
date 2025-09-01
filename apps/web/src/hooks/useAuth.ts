"use client";

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

/**
 * Client-side auth hook that provides current user state
 * This hook runs in the browser and syncs with server-side auth state
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Check if user is age-verified (13+) based on metadata
  const isAgeVerified = user?.user_metadata?.is_age_verified === true
  
  // Check if user can chat (authenticated AND age-verified)
  const canChat = !!user && isAgeVerified

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAgeVerified,
    canChat,
  }
}
