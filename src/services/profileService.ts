import { createSupabaseBrowserClient } from '@/lib/supabase'
import { UserProfile, PortfolioItem, ProfileSubject } from '@/types/student'

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) return null
  return data
}

export async function getPortfolio(userId: string): Promise<PortfolioItem[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
  if (error) return []
  return data
}

export async function addPortfolioItem(
  item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>
): Promise<PortfolioItem | null> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(item)
    .select()
    .single()
  if (error) return null
  return data
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
  return !error
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadAvatar] storage error:', uploadError)
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function getSubjects(userId: string): Promise<ProfileSubject[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('profile_subjects')
    .select('*')
    .eq('user_id', userId)
  if (error) return []
  return data
}

export async function saveSubject(
  subject: Omit<ProfileSubject, 'id' | 'created_at'>
): Promise<ProfileSubject | null> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('profile_subjects')
    .upsert(subject, { onConflict: 'user_id,subject' })
    .select()
    .single()
  if (error) return null
  return data
}