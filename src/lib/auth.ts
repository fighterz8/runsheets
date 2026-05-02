import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/supabase/types'

export async function getSessionProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, org_id, email, role, created_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return profile as UserProfile
}

export async function requireProfile(): Promise<UserProfile> {
  const profile = await getSessionProfile()

  if (!profile) {
    redirect('/login')
  }

  return profile
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireProfile()

  if (profile.role !== 'admin') {
    redirect('/events')
  }

  return profile
}
