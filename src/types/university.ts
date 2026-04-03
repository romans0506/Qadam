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
  name_ru?: string | null
  aliases?: string | null
  description_short: string | null
  description_full: string | null
  key_features: string | null
  website_url: string | null
  type: string | null
  campus_format: string | null
  has_campus: boolean
  has_dormitory: boolean
  photo_url: string | null
  logo_url: string | null
  main_country_id: string | null
  main_city_id: string | null
  created_at: string
  updated_at: string
  // Infrastructure
  infrastructure: string[] | null
  // Costs
  tuition_usd: number | null
  tuition_usd_max: number | null
  housing_usd: number | null
  housing_usd_max: number | null
  total_cost_note: string | null
  // Admission requirements
  gpa_min: number | null
  sat_min: number | null
  act_min: number | null
  ent_min: number | null
  ielts_min: number | null
  toefl_min: number | null
  documents_required: string[] | null
  // Bachelor's
  degree_language: string | null
  degree_duration: number | null
  // Competitiveness
  acceptance_rate: number | null
  selection_criteria: string | null
  // Social media
  social_instagram: string | null
  social_youtube: string | null
  social_linkedin: string | null
  social_facebook: string | null
  social_x: string | null
  // Relations
  country?: Country
  city?: City
  rankings?: UniversityRanking[]
  campuses?: Campus[]
  majors?: UniversityMajor[]
  deadlines?: UniversityDeadline[]
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
  parent_id: string | null
}

export interface UniversityMajor {
  id: string
  university_id: string
  major_id: string
  degree_level: string | null
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
  date_end: string | null
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