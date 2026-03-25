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

  const completedCount = tests.filter(t => getTestStatus(t.id) === 'completed').length

  if (loading) return (
    <main className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Загрузка...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Тесты</h1>
          <p className="text-slate-500 text-sm">Пройди тесты, чтобы узнать своё направление</p>
          {tests.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / tests.length) * 100}%` }}
                />
              </div>
              <span className="text-slate-500 text-xs shrink-0">{completedCount}/{tests.length}</span>
            </div>
          )}
        </div>

        {tests.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-lg">Тесты скоро появятся!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => {
              const status = getTestStatus(test.id)
              const unlocked = isUnlocked(index)
              const isCompleted = status === 'completed'

              return (
                <div
                  key={test.id}
                  className={`relative bg-white/[0.03] border rounded-2xl p-5 transition-all duration-200 ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                      : unlocked
                      ? 'border-indigo-500/20 hover:border-indigo-500/40 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]'
                      : 'border-white/[0.05] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Step indicator */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : unlocked
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-white/5 text-slate-600'
                    }`}>
                      {isCompleted ? '✓' : unlocked ? index + 1 : '🔒'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm ${
                        isCompleted ? 'text-emerald-300' : unlocked ? 'text-white' : 'text-slate-600'
                      }`}>
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{test.description}</p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isCompleted ? (
                        <>
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-lg">
                            Пройден
                          </span>
                          <button
                            onClick={() => retakeTest(test.id)}
                            className="text-slate-500 hover:text-slate-300 text-xs transition"
                          >
                            Пройти заново
                          </button>
                        </>
                      ) : unlocked ? (
                        <button
                          onClick={() => router.push(`/tests/${test.id}`)}
                          className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                        >
                          Начать →
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">Заблокировано</span>
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