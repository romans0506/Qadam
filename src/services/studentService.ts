import { supabase } from '@/lib/supabase'
import { StudentData } from '@/types/student'

export async function saveStudent(data: StudentData) {
  // Сохраняем студента
  const { data: student, error } = await supabase
    .from('students')
    .insert({
      grade: parseInt(data.grade),
      city: data.city,
      gpa: parseFloat(data.gpa),
      ent_score: data.ent_score ? parseInt(data.ent_score) : null
    })
    .select()
    .single()

  if (error || !student) return null

  // Сохраняем предметы
  const subjects = Object.entries(data.subjects)
    .filter(([, grade]) => grade !== '')
    .map(([subject, grade]) => ({
      student_id: student.id,
      subject,
      grade: parseInt(grade)
    }))

  if (subjects.length > 0) {
    await supabase.from('student_subjects').insert(subjects)
  }

  // Сохраняем интересы
  const interests = data.interests.map(interest => ({
    student_id: student.id,
    interest
  }))

  if (interests.length > 0) {
    await supabase.from('student_interests').insert(interests)
  }

  return student
}