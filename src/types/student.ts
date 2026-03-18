export interface UserProfile {
  user_id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  study_country: string | null
  city: string | null
  school: string | null
  grade: number | null
  gpa: number | null
  ent_score: number | null
  sat_score: number | null
  act_score: number | null
  ielts_score: number | null
  toefl_score: number | null
  languages: string[]
  interests: string[]
  target_country: string | null
  target_university: string | null
  target_specialty: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface ProfileSubject {
  id: string
  user_id: string
  subject: string
  grade: number | null
  created_at: string
}

export interface PortfolioItem {
  id: string
  user_id: string
  type: 'olympiad' | 'certificate' | 'volunteer' | 'leadership' | 'extracurricular'
  title: string
  description: string | null
  organization: string | null
  year: number | null
  evidence_url: string | null
  created_at: string
  updated_at: string
}