import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types/student'

export async function getProfile(clerkId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) return null
  return data
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'clerk_id' })
    .select()
    .single()

  if (error) return null
  return data
}