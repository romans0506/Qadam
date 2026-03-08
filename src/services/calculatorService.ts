import { StudentData } from '@/types/student'

export interface Result {
  university: string
  specialty: string
  chance: number
  color: string
}

export function calculateChances(data: StudentData): Result[] {
  const gpa = parseFloat(data.gpa) || 0
  const ent = parseInt(data.ent_score) || (gpa * 20)

  const specialties = [
    { university: 'Назарбаев Университет', specialty: 'Программная инженерия', required: 100, field: 'IT' },
    { university: 'КБТУ', specialty: 'Компьютерные науки', required: 95, field: 'IT' },
    { university: 'МУИТ', specialty: 'Информационные системы', required: 90, field: 'IT' },
    { university: 'КазНУ', specialty: 'Медицина', required: 110, field: 'Медицина' },
    { university: 'КазНУ', specialty: 'Право', required: 85, field: 'Право' },
    { university: 'КИМЭП', specialty: 'Бизнес', required: 80, field: 'Бизнес' },
  ]

  return specialties
    .filter(s => data.interests.length === 0 || data.interests.includes(s.field))
    .map(s => {
      const entScore = (ent / s.required) * 60
      const gpaScore = (gpa / 5) * 40
      const chance = Math.min(Math.round(entScore + gpaScore), 95)
      const color = chance >= 70 ? 'green' : chance >= 40 ? 'yellow' : 'red'
      return { university: s.university, specialty: s.specialty, chance, color }
    })
    .sort((a, b) => b.chance - a.chance)
}

export function getSmartAnalysis(data: StudentData, results: Result[]): string {
  const gpa = parseFloat(data.gpa) || 0
  const ent = parseInt(data.ent_score) || 0
  const topResult = results[0]

  let analysis = ''

  if (gpa >= 4.5) {
    analysis += `У тебя отличный средний балл ${gpa} — это большой плюс! 🌟\n\n`
  } else if (gpa >= 3.5) {
    analysis += `Твой средний балл ${gpa} — хороший старт. Есть куда расти! 💪\n\n`
  } else {
    analysis += `Средний балл ${gpa} говорит о том, что нужно усилить подготовку. Но всё реально! 🎯\n\n`
  }

  if (!ent) {
    analysis += `📚 Советы по подготовке к ЕНТ:\n`
    analysis += `1. Начни с математики — она обязательна для большинства специальностей\n`
    analysis += `2. Решай пробные тесты каждую неделю на сайте testent.kz\n`
    analysis += `3. Уделяй минимум 2 часа в день профильным предметам\n\n`
  } else if (ent < 80) {
    analysis += `📚 Твой ЕНТ балл ${ent} — нужно подтянуть:\n`
    analysis += `1. Сфокусируйся на слабых предметах\n`
    analysis += `2. Пройди курсы подготовки к ЕНТ (Bilim, Ustaz.kz)\n`
    analysis += `3. Решай минимум 1 пробный тест в неделю\n\n`
  } else {
    analysis += `📚 Твой ЕНТ балл ${ent} — хороший результат!\n`
    analysis += `1. Поддерживай темп подготовки\n`
    analysis += `2. Обрати внимание на профильные предметы\n`
    analysis += `3. Попробуй олимпиады — дают дополнительные баллы\n\n`
  }

  if (topResult) {
    analysis += `🎓 Главный совет: твои шансы выше всего в "${topResult.specialty}" (${topResult.university}) — ${topResult.chance}%`
  }

  return analysis
}