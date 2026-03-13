import { supabase } from '@/lib/supabase'
import type { University } from '@/types/university'   // или '@/types/student', если тип там
export async function getUniversities(): Promise<University[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('ranking_position', { ascending: true, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function getUniversityById(id: string): Promise<University | null> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}