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

  // Проверяем есть ли уже сессия
  const { data: existingSession } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .single()

  if (existingSession) {
    setSessionId(existingSession.id)
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

  async function finishTest() {
    if (!sessionId || !userId || !testId) return
    const supabase = createSupabaseBrowserClient()

    for (const [questionId, optionIds] of Object.entries(answers)) {
      await supabase.from('user_test_answers').insert({
        session_id: sessionId,
        question_id: questionId,
        selected_option_ids: optionIds,
      })
    }

    await supabase
      .from('user_test_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    await supabase.from('user_test_results').insert({
      session_id: sessionId,
      user_id: userId,
      test_id: testId,
      result_code: 'completed',
      result_data: { answers },
    })

    setFinished(true)
  }

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  if (finished) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Тест пройден!</h1>
        <p className="text-gray-500 mb-6">Отличная работа! Результаты сохранены.</p>
        <button
          onClick={() => router.push('/tests')}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
        >
          К списку тестов
        </button>
      </div>
    </main>
  )

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