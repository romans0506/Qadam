'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface Question {
  id: string
  text: string
  type: string
  order: number
  options: Option[]
}

interface Option {
  id: string
  text: string
  value: string
  order: number
}

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    params.then(p => setTestId(p.id))
  }, [params])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId || !testId) return
    loadTest()
  }, [userId, testId])

  async function loadTest() {
  const supabase = createSupabaseBrowserClient()

  const { data: questionsData } = await supabase
    .from('test_questions')
    .select('*, options:test_options(*)')
    .eq('test_id', testId)
    .order('order')

  setQuestions(questionsData ?? [])

  // Ищем существующую сессию
  const { data: existingSessions } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId!)
    .eq('test_id', testId!)
    .eq('status', 'in_progress')
    .limit(1)

  if (existingSessions && existingSessions.length > 0) {
    setSessionId(existingSessions[0].id)
  } else {
    const { data: newSession } = await supabase
      .from('user_test_sessions')
      .insert({ user_id: userId, test_id: testId, status: 'in_progress' })
      .select()
      .single()
    setSessionId(newSession?.id ?? null)
  }

  setLoading(false)
}

  function selectOption(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: [optionId] }))
  }


  const [testResult, setTestResult] = useState<{ code: string; data: Record<string, unknown> } | null>(null)
  
async function finishTest() {
  if (!sessionId || !userId || !testId) return
  const supabase = createSupabaseBrowserClient()

  // Сохраняем ответы
  for (const [questionId, optionIds] of Object.entries(answers)) {
    await supabase.from('user_test_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      selected_option_ids: optionIds,
    })
  }

  // Получаем значения выбранных вариантов
  const { data: selectedOptions } = await supabase
    .from('test_options')
    .select('value, question_id')
    .in('id', Object.values(answers).flat())

  // Считаем результат
  const test = await supabase
    .from('tests')
    .select('code')
    .eq('id', testId)
    .single()

  let resultCode = 'completed'
  let resultData: Record<string, unknown> = { answers }

  if (test.data?.code === 'personality' && selectedOptions) {
    // Подсчёт MBTI
    const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    selectedOptions.forEach(opt => {
      if (opt.value && counts[opt.value] !== undefined) {
        counts[opt.value]++
      }
    })
    const mbti = [
      counts.E >= counts.I ? 'E' : 'I',
      counts.S >= counts.N ? 'S' : 'N',
      counts.T >= counts.F ? 'T' : 'F',
      counts.J >= counts.P ? 'J' : 'P',
    ].join('')
    resultCode = mbti
    resultData = { mbti, counts }

    // Сохраняем тип личности в профиль
    await supabase
      .from('profiles')
      .update({ personality_type: mbti })
      .eq('user_id', userId)

  } else if (test.data?.code === 'interests' && selectedOptions) {
    // Подсчёт интересов
    const counts: Record<string, number> = {}
    selectedOptions.forEach(opt => {
      if (opt.value) counts[opt.value] = (counts[opt.value] || 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    resultCode = top || 'analytical'
    resultData = { counts, top }

  } else if (test.data?.code === 'skills' && selectedOptions) {
    // Подсчёт навыков
    const skillMap: Record<string, string> = {}
    questions.forEach((q, i) => {
      const answer = selectedOptions.find(o => o.question_id === q.id)
      if (answer) skillMap[`skill_${i + 1}`] = answer.value
    })
    const avg = Object.values(skillMap).reduce((a, b) => a + parseInt(b), 0) / Object.values(skillMap).length
    resultCode = avg >= 3 ? 'strong' : avg >= 2 ? 'average' : 'needs_improvement'
    resultData = { skillMap, average: avg }
  }

  // Сохраняем результат
  await supabase.from('user_test_results').insert({
    session_id: sessionId,
    user_id: userId,
    test_id: testId,
    result_code: resultCode,
    result_data: resultData,
  })

  await supabase
    .from('user_test_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  setTestResult({ code: resultCode, data: resultData })
  setFinished(true)
}

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  if (finished && testResult) {
  const mbtiDescriptions: Record<string, { title: string; desc: string; careers: string[] }> = {
    INTJ: { title: 'Стратег', desc: 'Независимый мыслитель с острым умом', careers: ['IT', 'Наука', 'Инженерия'] },
    INTP: { title: 'Логик', desc: 'Изобретательный аналитик', careers: ['Математика', 'IT', 'Исследования'] },
    ENTJ: { title: 'Командир', desc: 'Смелый лидер с харизмой', careers: ['Бизнес', 'Право', 'Менеджмент'] },
    ENTP: { title: 'Полемист', desc: 'Умный и любопытный мыслитель', careers: ['Предпринимательство', 'Право', 'IT'] },
    INFJ: { title: 'Активист', desc: 'Тихий и мистический идеалист', careers: ['Психология', 'Медицина', 'Педагогика'] },
    INFP: { title: 'Посредник', desc: 'Поэтичный и добросердечный человек', careers: ['Журналистика', 'Психология', 'Искусство'] },
    ENFJ: { title: 'Протагонист', desc: 'Харизматичный вдохновляющий лидер', careers: ['Педагогика', 'Медицина', 'PR'] },
    ENFP: { title: 'Борец', desc: 'Энтузиаст с богатым воображением', careers: ['Журналистика', 'Маркетинг', 'Педагогика'] },
    ISTJ: { title: 'Администратор', desc: 'Практичный и надёжный человек', careers: ['Бухгалтерия', 'Право', 'Менеджмент'] },
    ISFJ: { title: 'Защитник', desc: 'Преданный и заботливый защитник', careers: ['Медицина', 'Педагогика', 'Социальная работа'] },
    ESTJ: { title: 'Менеджер', desc: 'Отличный администратор и организатор', careers: ['Бизнес', 'Право', 'Менеджмент'] },
    ESFJ: { title: 'Консул', desc: 'Заботливый и общительный человек', careers: ['Медицина', 'Педагогика', 'HR'] },
    ISTP: { title: 'Виртуоз', desc: 'Смелый и практичный экспериментатор', careers: ['Инженерия', 'IT', 'Механика'] },
    ISFP: { title: 'Артист', desc: 'Гибкий и обаятельный художник', careers: ['Дизайн', 'Архитектура', 'Медицина'] },
    ESTP: { title: 'Делец', desc: 'Умный и энергичный предприниматель', careers: ['Бизнес', 'Спорт', 'Предпринимательство'] },
    ESFP: { title: 'Развлекатель', desc: 'Спонтанный и энергичный человек', careers: ['Журналистика', 'PR', 'Педагогика'] },
  }

  const interestDescriptions: Record<string, { title: string; desc: string; specialties: string[] }> = {
    analytical: { title: 'Аналитик', desc: 'Тебе нравится решать сложные задачи', specialties: ['Математика', 'IT', 'Физика'] },
    social: { title: 'Помощник', desc: 'Тебе важно помогать людям', specialties: ['Медицина', 'Педагогика', 'Психология'] },
    creative: { title: 'Творец', desc: 'Тебе нравится создавать новое', specialties: ['Дизайн', 'Архитектура', 'Журналистика'] },
    managerial: { title: 'Организатор', desc: 'Тебе нравится управлять процессами', specialties: ['Менеджмент', 'Бизнес', 'Право'] },
  }

  const isMBTI = Object.keys(mbtiDescriptions).includes(testResult.code)
  const isInterest = Object.keys(interestDescriptions).includes(testResult.code)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Тест пройден!</h1>

        {isMBTI && (
          <div className="mt-4 mb-6">
            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="text-indigo-500 text-sm font-medium mb-1">Твой тип личности</p>
              <p className="text-4xl font-bold text-indigo-700">{testResult.code}</p>
              <p className="text-indigo-600 font-medium">{mbtiDescriptions[testResult.code]?.title}</p>
              <p className="text-gray-500 text-sm mt-1">{mbtiDescriptions[testResult.code]?.desc}</p>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-2">Подходящие направления:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {mbtiDescriptions[testResult.code]?.careers.map(c => (
                <span key={c} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        )}

        {isInterest && (
          <div className="mt-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-green-500 text-sm font-medium mb-1">Твой профиль интересов</p>
              <p className="text-2xl font-bold text-green-700">{interestDescriptions[testResult.code]?.title}</p>
              <p className="text-gray-500 text-sm mt-1">{interestDescriptions[testResult.code]?.desc}</p>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-2">Рекомендуемые специальности:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {interestDescriptions[testResult.code]?.specialties.map(s => (
                <span key={s} className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {testResult.code === 'strong' && (
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-green-700 mb-1">💪 Сильный профиль!</p>
            <p className="text-gray-500 text-sm">У тебя хорошие академические навыки</p>
          </div>
        )}

        {testResult.code === 'average' && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-yellow-700 mb-1">📈 Есть потенциал!</p>
            <p className="text-gray-500 text-sm">Продолжай развиваться — результаты улучшатся</p>
          </div>
        )}

        {testResult.code === 'needs_improvement' && (
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-red-700 mb-1">📚 Нужно больше практики</p>
            <p className="text-gray-500 text-sm">Сосредоточься на подготовке к экзаменам</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/tests')}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50"
          >
            К тестам
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
          >
            Профиль →
          </button>
        </div>
      </div>
    </main>
  )
}

  if (questions.length === 0) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
        <p className="text-gray-500 mb-4">В этом тесте пока нет вопросов</p>
        <button
          onClick={() => router.push('/tests')}
          className="text-blue-600 hover:underline"
        >
          ← Назад
        </button>
      </div>
    </main>
  )

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const hasAnswer = answers[currentQuestion.id]?.length > 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Прогресс */}
        <div className="flex gap-1 mb-8">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < currentIndex ? 'bg-green-400' :
                i === currentIndex ? 'bg-white' : 'bg-blue-800'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">
            Вопрос {currentIndex + 1} из {questions.length}
          </p>
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options
              .sort((a, b) => a.order - b.order)
              .map(option => (
                <button
                  key={option.id}
                  onClick={() => selectOption(currentQuestion.id, option.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    answers[currentQuestion.id]?.includes(option.id)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {option.text}
                </button>
              ))}
          </div>

          <div className="flex gap-3 mt-6">
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50"
              >
                ← Назад
              </button>
            )}
            {isLast ? (
              <button
                onClick={finishTest}
                disabled={!hasAnswer}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-40"
              >
                Завершить ✓
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                disabled={!hasAnswer}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-40"
              >
                Далее →
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}