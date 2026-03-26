import { createSupabaseBrowserClient } from '@/lib/supabase'

interface EventTemplate {
  id: string
  title: string
  description: string | null
  source_type: string
  month: number
  day: number
  condition_field: string | null
  condition_op: string | null
  condition_value: string | null
  condition2_field: string | null
  condition2_op: string | null
  condition2_value: string | null
  is_active: boolean
}

function matchesCondition(
  field: string | null,
  op: string | null,
  value: string | null,
  profile: Record<string, any>
): boolean {
  if (!field || !op) return true
  const profileVal = profile[field]
  switch (op) {
    case 'missing':     return !profileVal
    case 'present':     return !!profileVal
    case 'equals':      return profileVal === value
    case 'not_equals':  return profileVal !== value
    default:            return true
  }
}

function interpolate(text: string, profile: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => profile[key] ?? key)
}

export async function generateCalendarFromUniversity(
  userId: string,
  universityId: string
): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()

  const { data: deadlines, error: deadlinesError } = await supabase
    .from('university_deadlines')
    .select('*, university:universities(name)')
    .eq('university_id', universityId)

  if (deadlinesError) {
    console.error('generateCalendarFromUniversity: failed to load deadlines:', deadlinesError)
    return false
  }

  if (!deadlines || deadlines.length === 0) return false

  for (const d of deadlines) {
    const { data: existing } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', d.id)
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: insertError } = await supabase.from('user_calendar_events').insert({
      user_id: userId,
      source_type: 'university_deadline',
      source_id: d.id,
      title: `${d.university?.name} — ${
        d.type === 'application' ? '📋 Подача документов' :
        d.type === 'exam'        ? '📝 Экзамен' :
        d.type === 'essay'       ? '✍️ Дедлайн эссе' :
        d.description || d.type
      }`,
      description: d.description,
      start_date: new Date(d.date).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    if (insertError) {
      console.error('generateCalendarFromUniversity insert error:', insertError)
      return false
    }
  }

  return true
}

export async function generateCalendarFromProfile(userId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()

  // Загружаем профиль
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_university, target_country, target_specialty, ent_score, ielts_score, sat_score')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    console.error('generateCalendarFromProfile: failed to load profile:', profileError)
    return false
  }

  // Загружаем шаблоны из БД
  const { data: templates, error: templatesError } = await supabase
    .from('event_templates')
    .select('id, title, description, source_type, month, day, condition_field, condition_op, condition_value, condition2_field, condition2_op, condition2_value, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (templatesError || !templates) {
    console.error('generateCalendarFromProfile: failed to load templates:', templatesError)
    return false
  }

  const year = new Date().getFullYear()

  for (const tpl of templates as EventTemplate[]) {
    // Проверяем оба условия
    const cond1 = matchesCondition(tpl.condition_field, tpl.condition_op, tpl.condition_value, profile)
    const cond2 = matchesCondition(tpl.condition2_field, tpl.condition2_op, tpl.condition2_value, profile)
    if (!cond1 || !cond2) continue

    const title = interpolate(tpl.title, profile)
    const description = tpl.description ? interpolate(tpl.description, profile) : null

    // Проверяем что такого события ещё нет
    const { data: existing } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', 'profile_goal')
      .eq('title', title)
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: insertError } = await supabase.from('user_calendar_events').insert({
      user_id: userId,
      source_type: tpl.source_type,
      title,
      description,
      start_date: new Date(`${year}-${String(tpl.month).padStart(2, '0')}-${String(tpl.day).padStart(2, '0')}`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    if (insertError) {
      console.error('generateCalendarFromProfile insert error:', insertError)
      return false
    }
  }

  return true
}
