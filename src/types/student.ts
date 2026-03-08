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