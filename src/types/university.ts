export interface University {
  id: string
  name: string
  country: string
  city: string
  description: string | null
  type: string | null
  has_campus: boolean
  has_dorm: boolean
  photo_url: string | null
  ranking_position: number | null
  ranking_source: string | null
  ranking_year: number | null
}