export interface Country {
  id: string
  code: string | null
  name: string
  region: 'kazakhstan' | 'abroad'
  flag_icon: string | null
}

export interface City {
  id: string
  country_id: string
  name: string
}

export interface University {
  id: string
  name: string
  description_short: string | null
  description_full: string | null
  website_url: string | null
  type: string | null
  has_campus: boolean
  has_dormitory: boolean
  photo_url: string | null
  main_country_id: string | null
  main_city_id: string | null
  created_at: string
  updated_at: string
  country?: Country
  city?: City
  rankings?: UniversityRanking[]
  campuses?: Campus[]
  majors?: UniversityMajor[]
  deadlines?: UniversityDeadline[]
  name_ru?: string | null
  aliases?: string | null
}

export interface Campus {
  id: string
  university_id: string
  country_id: string
  city_id: string | null
  address: string | null
  is_main: boolean
  has_dormitory: boolean
  country?: Country
  city?: City
}

export interface RankingSource {
  id: string
  name: string
  website_url: string | null
}

export interface UniversityRanking {
  id: string
  university_id: string
  ranking_source_id: string
  year: number
  position: number
  score: number | null
  source?: RankingSource
}

export interface Major {
  id: string
  code: string | null
  name: string
  description: string | null
}

export interface UniversityMajor {
  id: string
  university_id: string
  major_id: string
  degree_level: string | null
  required_ent: number | null
  required_sat: number | null
  required_gpa: number | null
  budget_places: number | null
  paid_places: number | null
  major?: Major
}

export interface NcaaTeam {
  id: string
  sport: string
  division: string
  conference: string | null
  ranking: number | null
  wins: number | null
  losses: number | null
  season: string | null
}

export interface EducationalEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string | null
  url: string | null
  organizer: string | null
  country: string | null
}

export interface UniversityDeadline {
  id: string
  university_id: string
  major_id: string | null
  type: string
  date: string
  description: string | null
}

export interface SavedUniversity {
  id: string
  user_id: string
  university_id: string
  note: string | null
  priority: number | null
  created_at: string
  university?: University
}