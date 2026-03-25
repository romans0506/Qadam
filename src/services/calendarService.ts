import { createSupabaseBrowserClient } from '@/lib/supabase'

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
        d.type === 'exam' ? '📝 Экзамен' :
        d.type === 'essay' ? '✍️ Дедлайн эссе' :
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

  // Получаем профиль пользователя
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_university, target_country, target_specialty, ent_score, ielts_score, sat_score')
    .eq('user_id', userId)
    .single()

  if (profileError) {
    console.error('generateCalendarFromProfile: failed to load profile:', profileError)
    return false
  }

  if (!profile) return false

  const events: Array<{
    user_id: string
    source_type: string
    title: string
    description: string
    start_date: string
    is_auto_generated: boolean
    is_done: boolean
  }> = []
  const now = new Date()
  const year = now.getFullYear()

  // Если нет ЕНТ — добавляем напоминание
  if (!profile.ent_score) {
    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '📝 Зарегистрироваться на ЕНТ',
      description: 'Регистрация на ЕНТ обычно открывается в феврале-марте',
      start_date: new Date(`${year}-03-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '📚 Начать подготовку к ЕНТ',
      description: 'Рекомендуем начать подготовку минимум за 3 месяца',
      start_date: new Date(`${year}-03-15`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '🎯 Сдача ЕНТ',
      description: 'ЕНТ обычно проводится в июне',
      start_date: new Date(`${year}-06-10`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })
  }

  // Если нет IELTS/SAT и цель зарубежный универ
  if (!profile.ielts_score && profile.target_country && profile.target_country !== 'Казахстан') {
    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '🌍 Зарегистрироваться на IELTS',
      description: 'Для поступления за рубеж нужен IELTS минимум 6.0',
      start_date: new Date(`${year}-04-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })
  }

  if (!profile.sat_score && profile.target_country === 'США') {
    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '📊 Зарегистрироваться на SAT',
      description: 'SAT нужен для поступления в американские университеты',
      start_date: new Date(`${year}-04-15`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })
  }

  // Если есть целевой университет — добавляем напоминание
  if (profile.target_university) {
    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: `🎓 Изучить требования — ${profile.target_university}`,
      description: 'Проверь актуальные требования к поступлению',
      start_date: new Date(`${year}-04-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: `📄 Подготовить документы — ${profile.target_university}`,
      description: 'Аттестат, транскрипт, фото, мед. справка',
      start_date: new Date(`${year}-05-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })
  }

  // Если есть целевой зарубежный университет — добавляем эссе и рекомендации
  if (profile.target_university && profile.target_country && profile.target_country !== 'Казахстан') {
    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: `✍️ Начать писать эссе — ${profile.target_university}`,
      description: 'Common App / личное эссе для поступления',
      start_date: new Date(`${year}-08-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: `📝 Черновик эссе — ${profile.target_university}`,
      description: 'Закончить первый черновик и отдать на проверку',
      start_date: new Date(`${year}-09-01`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: '📨 Попросить рекомендательные письма',
      description: 'Обратись к учителям и наставникам за рекомендациями',
      start_date: new Date(`${year}-09-15`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })

    events.push({
      user_id: userId,
      source_type: 'profile_goal',
      title: `✅ Финальная версия эссе — ${profile.target_university}`,
      description: 'Отредактировать и утвердить финальный вариант',
      start_date: new Date(`${year}-10-15`).toISOString(),
      is_auto_generated: true,
      is_done: false,
    })
  }

  // Универсальные события для всех
  events.push({
    user_id: userId,
    source_type: 'profile_goal',
    title: '💼 Обновить портфолио',
    description: 'Добавь олимпиады, сертификаты и достижения',
    start_date: new Date(`${year}-05-15`).toISOString(),
    is_auto_generated: true,
    is_done: false,
  })

  events.push({
    user_id: userId,
    source_type: 'profile_goal',
    title: '📋 Подача документов',
    description: 'Финальный дедлайн подачи документов в университеты КЗ',
    start_date: new Date(`${year}-07-15`).toISOString(),
    is_auto_generated: true,
    is_done: false,
  })

  // Вставляем только те события которых ещё нет (по title + user_id)
  for (const event of events) {
    const { data: existing } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', 'profile_goal')
      .eq('title', event.title)
      .limit(1)

    if (existing && existing.length > 0) continue
    const { error: insertError } = await supabase.from('user_calendar_events').insert(event)
    if (insertError) {
      console.error('generateCalendarFromProfile insert error:', insertError)
      return false
    }
  }

  return true
}