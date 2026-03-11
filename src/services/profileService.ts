import { supabase } from '@/lib/supabase'
import { UserProfile, PortfolioItem } from '@/types/student'

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

export async function getPortfolio(clerkId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('clerk_id', clerkId)
    .order('year', { ascending: false })

  if (error) return []
  return data
}

export async function addPortfolioItem(item: Omit<PortfolioItem, 'id' | 'created_at'>): Promise<PortfolioItem | null> {
  const { data, error } = await supabase
    .from('portfolio')
    .insert(item)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id)

  return !error
}