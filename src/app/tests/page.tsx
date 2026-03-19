'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface Test {
  id: string
  code: string
  title: string
  description: string | null
  order: number
  is_active: boolean
}

interface TestSession {
  test_id: string
  status: string
}

export default function TestsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId])

  async function loadData() {
    const supabase = createSupabaseBrowserClient()
    const [testsRes, sessionsRes] = await Promise.all([
      supabase.from('tests').select('*').eq('is_active', true).order('order'),
      supabase.from('user_test_sessions').select('test_id, status').eq('user_id', userId)
    ])
    setTests(testsRes.data ?? [])
    setSessions(sessionsRes.data ?? [])
    setLoading(false)
  }

  async function retakeTest(testId: string) {
    const supabase = createSupabaseBrowserClient()

    // Удаляем старые данные
    const { data: oldSessions } = await supabase
      .from('user_test_sessions')
      .select('id')
      .eq('user_id', userId!)
      .eq('test_id', testId)

    if (oldSessions && oldSessions.length > 0) {
      const sessionIds = oldSessions.map(s => s.id)
      await supabase.from('user_test_answers').delete().in('session_id', sessionIds)
      await supabase.from('user_test_results').delete().in('session_id', sessionIds)
      await supabase.from('user_test_sessions').delete().eq('user_id', userId!).eq('test_id', testId)
    }

    await loadData()
    router.push(`/tests/${testId}`)
  }

  function getTestStatus(testId: string) {
    const session = sessions.find(s => s.test_id === testId)
    return session?.status ?? null
  }

  function isUnlocked(index: number) {
    if (index === 0) return true
    const prevTest = tests[index - 1]
    return getTestStatus(prevTest.id) === 'completed'
  }

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Тесты 🧠</h1>
          <p className="text-blue-200">Пройди тесты чтобы узнать своё направление</p>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
            <p className="text-lg">Тесты скоро появятся!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test, index) => {
              const status = getTestStatus(test.id)
              const unlocked = isUnlocked(index)

              return (
                <div
                  key={test.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg ${!unlocked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        status === 'completed' ? 'bg-green-100 text-green-700' :
                        unlocked ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {status === 'completed' ? '✓' : index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{test.title}</h3>
                        {test.description && (
                          <p className="text-gray-500 text-sm">{test.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {status === 'completed' ? (
                        <>
                          <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                            Пройден ✓
                          </span>
                          <button
                            onClick={() => retakeTest(test.id)}
                            className="text-blue-500 text-xs hover:underline"
                          >
                            🔄 Пройти заново
                          </button>
                        </>
                      ) : unlocked ? (
                        <button
                          onClick={() => router.push(`/tests/${test.id}`)}
                          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-700 transition"
                        >
                          Начать →
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">🔒 Заблокирован</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}