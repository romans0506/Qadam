import { createSupabaseBrowserClient } from '@/lib/supabase'
import { University, SavedUniversity, Country, Major } from '@/types/university'

export async function getMajors(): Promise<Major[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('majors')
    .select('*')
    .order('name')
  if (error) return []
  return data ?? []
}

export async function getUniversities(filters?: {
  region?: 'kazakhstan' | 'abroad'
  country_id?: string
  major_id?: string
  type?: string
  has_dormitory?: boolean
  has_campus?: boolean
  limit?: number
  offset?: number
}): Promise<University[]> {
  const supabase = createSupabaseBrowserClient()

  const pageSize = filters?.limit ?? 20
  const pageOffset = filters?.offset ?? 0

  // If filtering by major, first resolve the university IDs
  let majorUniversityIds: string[] | null = null
  if (filters?.major_id) {
    const { data: umData } = await supabase
      .from('university_majors')
      .select('university_id')
      .eq('major_id', filters.major_id)
    majorUniversityIds = (umData ?? []).map((r: any) => r.university_id)
    if (majorUniversityIds.length === 0) return []
  }

  let query = supabase
    .from('universities')
    .select(`
      *,
      country:countries!main_country_id(*),
      city:cities!main_city_id(*),
      rankings:university_rankings(
        position, year,
        source:ranking_sources(name)
      ),
      campuses(
        *,
        country:countries(flag_icon, name)
      )
    `)
    .range(pageOffset, pageOffset + pageSize - 1)

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.has_dormitory) query = query.eq('has_dormitory', true)
  if (filters?.has_campus) query = query.eq('has_campus', true)
  if (filters?.country_id) query = query.eq('main_country_id', filters.country_id)
  if (majorUniversityIds) query = query.in('id', majorUniversityIds)

  const { data, error } = await query
  if (error) return []

  // Фильтруем по региону на стороне клиента
  let result = data ?? []
  if (filters?.region) {
    result = result.filter((u: any) => u.country?.region === filters.region)
  }

  return result
}

export async function getUniversityById(id: string): Promise<University | null> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('universities')
    .select(`
      *,
      country:countries!main_country_id(*),
      city:cities!main_city_id(*),
      rankings:university_rankings(
        position, year,
        source:ranking_sources(name)
      ),
      campuses(
        *,
        country:countries(flag_icon, name),
        city:cities(name)
      )
    `)
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getCountries(): Promise<Country[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name')
  if (error) return []
  return data ?? []
}

export async function getSavedUniversities(userId: string): Promise<SavedUniversity[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('user_saved_universities')
    .select(`
      *,
      university:universities(
        *,
        country:countries!main_country_id(*),
        rankings:university_rankings(position, year, source:ranking_sources(name))
      )
    `)
    .eq('user_id', userId)
    .order('priority', { ascending: true })
  if (error) return []
  return data ?? []
}

export async function saveUniversity(
  userId: string,
  universityId: string
): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase
    .from('user_saved_universities')
    .upsert({ user_id: userId, university_id: universityId }, { onConflict: 'user_id,university_id' })
  return !error
}

export async function unsaveUniversity(
  userId: string,
  universityId: string
): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase
    .from('user_saved_universities')
    .delete()
    .eq('user_id', userId)
    .eq('university_id', universityId)
  return !error
}