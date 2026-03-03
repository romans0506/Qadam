'use client'
import { useEffect, useState } from 'react'

interface StudentData {
  grade: string
  city: string
  gpa: string
  ent_score: string
  interests: string[]
  subjects: Record<string, string>
}

interface Result {
  university: string
  specialty: string
  chance: number
  color: string
}

export default function Dashboard() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('studentData')
    if (saved) {
      const data = JSON.parse(saved)
      setStudent(data)
      const calculated = calculateChances(data)
      setResults(calculated)
      setAnalysis(getSmartAnalysis(data, calculated))
    }
  }, [])

 function getSmartAnalysis(data: StudentData, calculated: Result[]): string {
  const gpa = parseFloat(data.gpa) || 0
  const ent = parseInt(data.ent_score) || 0
  const topResult = calculated[0]

  let analysis = ''

  // Персональный анализ
  if (gpa >= 4.5) {
    analysis += `У тебя отличный средний балл ${gpa} — это большой плюс! 🌟\n\n`
  } else if (gpa >= 3.5) {
    analysis += `Твой средний балл ${gpa} — хороший старт. Есть куда расти! 💪\n\n`
  } else {
    analysis += `Средний балл ${gpa} говорит о том, что нужно усилить подготовку. Но всё реально! 🎯\n\n`
  }

  // Совет по ЕНТ
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

  // Совет по специальности
  if (topResult) {
    analysis += `🎓 Главный совет: твои шансы выше всего в "${topResult.specialty}" (${topResult.university}) — ${topResult.chance}%. Сосредоточься на этом направлении!`
  }

  return analysis
}

  function calculateChances(data: StudentData): Result[] {
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

  if (!student) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Заголовок */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Твои шансы 🎯</h1>
          <p className="text-blue-200">{student.grade} класс • ГПА: {student.gpa} • {student.city}</p>
        </div>

        {/* AI Анализ */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="font-bold text-gray-800 text-xl mb-3">📊 Персональный анализ</h2>
          <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
        </div>

        {/* Карточки результатов */}
        <div className="space-y-4">
          {results.map((result, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{result.specialty}</h3>
                  <p className="text-gray-500">{result.university}</p>
                </div>
                <div className={`text-3xl font-bold ${
                  result.color === 'green' ? 'text-green-500' :
                  result.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {result.chance}%
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.color === 'green' ? 'bg-green-500' :
                    result.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.chance}%` }}
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {result.chance >= 70 ? '✅ Высокие шансы — подавай!' :
                 result.chance >= 40 ? '⚠️ Средние шансы — готовься усерднее' :
                 '❌ Низкие шансы — нужно больше подготовки'}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="/onboarding" className="text-blue-200 hover:text-white underline">
            ← Изменить данные
          </a>
        </div>

      </div>
    </main>
  )
}