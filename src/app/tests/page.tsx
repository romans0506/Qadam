'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, Loader2, ArrowRight, RotateCcw } from 'lucide-react'
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

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function TestsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.push('/login'); return }
      setUserId(data.session?.user.id)
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
      supabase.from('user_test_sessions').select('test_id, status').eq('user_id', userId),
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
  const progressPct = tests.length > 0 ? (completedCount / tests.length) * 100 : 0

  if (loading) return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 size={18} strokeWidth={1.5} className="text-[var(--accent)] animate-spin" />
        <p className="t-body">Загрузка...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-2xl mx-auto px-6 py-18">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-12">
          <h1 className="t-headline mb-2">Тесты</h1>
          <p className="t-body mb-8">Пройди тесты, чтобы узнать своё направление</p>

          {tests.length > 0 && (
            <div className="flex items-center gap-4">
              {/* Progress track */}
              <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
              <span className="t-label normal-case tracking-normal text-[var(--text-tertiary)] shrink-0 tabular-nums">
                {completedCount} / {tests.length}
              </span>
            </div>
          )}
        </div>

        {/* ── Test list ───────────────────────────────────────────────── */}
        {tests.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="t-title text-[var(--text-secondary)]">Тесты скоро появятся!</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col gap-4"
          >
            {/* Vertical connector line */}
            <div className="absolute left-[27px] top-14 bottom-14 w-px bg-gradient-to-b from-[var(--border-strong)] via-[var(--border)] to-transparent pointer-events-none" />

            {tests.map((test, index) => {
              const status = getTestStatus(test.id)
              const unlocked = isUnlocked(index)
              const isCompleted = status === 'completed'
              const isLocked = !unlocked

              return (
                <motion.div key={test.id} variants={cardItem}>
                  <div className={`relative flex gap-5 ${isLocked ? 'opacity-40' : ''}`}>

                    {/* Step indicator */}
                    <div className={`relative z-10 shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isLocked
                        ? 'bg-[var(--bg-raised)] border-[var(--border)]'
                        : 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
                    }`}>
                      {isCompleted
                        ? <CheckCircle2 size={20} strokeWidth={1.5} className="text-emerald-400" />
                        : isLocked
                        ? <Lock size={18} strokeWidth={1.2} className="text-[var(--text-quaternary)]" />
                        : <span className="text-[var(--accent)] font-bold text-sm">{index + 1}</span>
                      }
                    </div>

                    {/* Card */}
                    <div className={`flex-1 card p-5 flex items-start justify-between gap-4 ${
                      !isLocked && !isCompleted
                        ? 'border-[var(--accent)]/30 hover:border-[var(--accent)]/50 transition-colors'
                        : isCompleted
                        ? 'border-emerald-500/20'
                        : ''
                    }`}>
                      <div className="flex-1 min-w-0">
                        <h3 className={`t-title mb-1 ${isCompleted ? 'text-emerald-300' : isLocked ? 'text-[var(--text-quaternary)]' : ''}`}>
                          {test.title}
                        </h3>
                        {test.description && (
                          <p className="t-body text-sm leading-relaxed">{test.description}</p>
                        )}
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {isCompleted ? (
                          <>
                            <span className="btn-secondary text-xs px-3 py-1.5 h-auto cursor-default border-emerald-500/30 text-emerald-400">
                              Пройден
                            </span>
                            <button
                              onClick={() => retakeTest(test.id)}
                              className="flex items-center gap-1 t-label normal-case tracking-normal text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                            >
                              <RotateCcw size={11} strokeWidth={1.5} />
                              Заново
                            </button>
                          </>
                        ) : unlocked ? (
                          <button
                            onClick={() => router.push(`/tests/${test.id}`)}
                            className="btn-primary flex items-center gap-1.5 px-5"
                          >
                            Начать
                            <ArrowRight size={14} strokeWidth={2} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

      </div>
    </main>
  )
}
