export interface StudentData {
  grade: string
  city: string
  gpa: string
  ent_score: string
  interests: string[]
  subjects: {
    математика: string
    физика: string
    химия: string
    биология: string
    история: string
    английский: string
  }
}

export interface UserProfile {
  id: string
  clerk_id: string
  full_name: string
  nickname: string
  city: string
  school: string
  grade: number
  avatar_url: string
  gpa: number
  ent_score: number
  sat_score: number
  act_score: number
  ielts_score: number
  toefl_score: number
  languages: string[]
  target_country: string
  target_university: string
  target_specialty: string
  interests: string[]
  bio: string
  created_at: string
}

export interface PortfolioItem {
  id: string
  clerk_id: string
  type: 'olympiad' | 'certificate' | 'volunteer' | 'leadership' | 'extracurricular'
  title: string
  description: string
  year: number
  created_at: string
}