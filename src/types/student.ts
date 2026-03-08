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
  ielts_score: number
  bio: string
  created_at: string
}