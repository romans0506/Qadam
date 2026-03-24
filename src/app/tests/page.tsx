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
    return sessions.find(s => s.test_id === testId)?.status ?? null
  }

  function isUnlocked(index: number) {
    if (index === 0) return true
    return getTestStatus(tests[index - 1].id) === 'completed'
  }

  const completedCount = tests.filter(t => getTestStatus(t.id) === 'completed').length

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p>Загрузка...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Тесты</h1>
          <p className="text-blue-300">Определи тип личности и подходящее направление</p>
          {tests.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <div className="flex gap-1">
                {tests.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < completedCount ? 'bg-green-400' : 'bg-white/20'}`} />
                ))}
              </div>
              <span className="text-sm text-blue-200">{completedCount}/{tests.length} пройдено</span>
            </div>
          )}
        </div>

        {tests.length === 0 ? (
          <div className="bg-white/10 border border-white/10 rounded-2xl p-8 text-center text-blue-200">
            <p className="text-lg">Тесты скоро появятся!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => {
              const status = getTestStatus(test.id)
              const unlocked = isUnlocked(index)
              const completed = status === 'completed'

              return (
                <div
                  key={test.id}
                  className={`rounded-2xl p-5 border transition ${
                    completed
                      ? 'bg-green-900/20 border-green-500/30'
                      : unlocked
                        ? 'bg-white/10 border-white/20 hover:bg-white/15'
                        : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        completed ? 'bg-green-500/20 text-green-400' :
                        unlocked ? 'bg-blue-500/20 text-blue-300' :
                        'bg-white/10 text-white/30'
                      }`}>
                        {completed ? '✓' : unlocked ? index + 1 : '🔒'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{test.title}</h3>
                        {test.description && (
                          <p className="text-blue-300 text-sm mt-0.5">{test.description}</p>
                        )}
                        {!unlocked && (
                          <p className="text-white/30 text-xs mt-0.5">Пройди предыдущий тест</p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {completed ? (
                        <>
                          <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">
                            Пройден
                          </span>
                          <button
                            onClick={() => retakeTest(test.id)}
                            className="text-blue-400 text-xs hover:text-blue-300 transition"
                          >
                            Пройти снова
                          </button>
                        </>
                      ) : unlocked ? (
                        <button
                          onClick={() => router.push(`/tests/${test.id}`)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition font-medium"
                        >
                          Начать →
                        </button>
                      ) : null}
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
