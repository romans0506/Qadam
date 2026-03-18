export interface CalendarEvent {
  id: string
  user_id: string
  source_type: string | null
  source_id: string | null
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  reminder_at: string | null
  is_auto_generated: boolean
  created_at: string
  updated_at: string
}

export interface UniversityDeadline {
  id: string
  university_id: string
  major_id: string | null
  type: string
  date: string
  description: string | null
}