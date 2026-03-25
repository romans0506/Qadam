'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, ArrowLeft, MessageSquare, BookOpen, Building2, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { getProfile, getPortfolio } from '@/services/profileService'
import { UserProfile, PortfolioItem } from '@/types/student'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickQuestions = [
  'Каковы мои шансы поступить в НУ?',
  'Какой экзамен лучше — SAT или ACT?',
  'Когда регистрироваться на IELTS?',
  'Как улучшить профиль для MIT?',
  'Что добавить в портфолио?',
  'Составь план подготовки на 3 месяца',
]

const actionShortcuts = [
  { label: 'Пройди тесты',        href: '/tests',        icon: BookOpen },
  { label: 'Сохрани университет', href: '/universities', icon: Building2 },
  { label: 'Календарь',           href: '/calendar',    icon: CalendarDays },
]

function computeReadinessScore(profile: Partial<UserProfile> | null): number {
  if (!profile) return 0
  let score = 0
  let weight = 0

  if (profile.gpa) {
    score  += (profile.gpa / 4.0) * 35
    weight += 35
  }
  if (profile.ent_score) {
    score  += (profile.ent_score / 140) * 35
    weight += 35
  } else if (profile.sat_score) {
    score  += (profile.sat_score / 1600) * 35
    weight += 35
  }
  if (profile.ielts_score) {
    score  += (profile.ielts_score / 9.0) * 20
    weight += 20
  } else if (profile.toefl_score) {
    score  += (profile.toefl_score / 120) * 20
    weight += 20
  }
  if (profile.grade) {
    const gradeProgress = Math.min(Math.max((Number(profile.grade) - 9) / 3, 0), 1)
    score  += gradeProgress * 10
    weight += 10
  }

  if (weight === 0) return 0
  return Math.min(100, Math.round((score / weight) * 100))
}

export default function AssistantPage() {
  const router = useRouter()
  const [userId, setUserId]   = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [view, setView] = useState<'analysis' | 'chat'>('analysis')
  const [initialAnalysis, setInitialAnalysis] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ANALYSIS_KEY         = (uid: string) => `qadam_ai_analysis_v1:${uid}`
  const ANALYSIS_PROFILE_KEY = (uid: string) => `qadam_ai_analysis_v1:${uid}:profile`

  function getProfileSnapshot(p: Partial<UserProfile> | null): string {
    if (!p) return ''
    return JSON.stringify({
      gpa: p.gpa, ent_score: p.ent_score, sat_score: p.sat_score,
      act_score: p.act_score, ielts_score: p.ielts_score, toefl_score: p.toefl_score,
      target_university: p.target_university, target_country: p.target_country,
    })
  }

  function loadCachedAnalysis(uid: string, currentSnapshot: string): string | null {
    try {
      const savedSnapshot = localStorage.getItem(ANALYSIS_PROFILE_KEY(uid))
      if (savedSnapshot !== currentSnapshot) return null          // profile changed → stale
      return localStorage.getItem(ANALYSIS_KEY(uid))
    } catch { return null }
  }

  function cacheAnalysis(uid: string, content: string, profileSnapshot: string) {
    try {
      localStorage.setItem(ANALYSIS_KEY(uid), content)
      localStorage.setItem(ANALYSIS_PROFILE_KEY(uid), profileSnapshot)
    } catch (e) { console.warn('Failed to cache analysis:', e) }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.push('/login'); return }
      setUserId(data.session?.user.id)
    })
  }, [router])

  useEffect(() => { if (userId) loadData() }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    const [profileData, portfolioData] = await Promise.all([
      getProfile(userId!),
      getPortfolio(userId!),
    ])
    setProfile(profileData)
    setPortfolio(portfolioData)

    // Each page visit = fresh chat. Only the initial analysis is cached.
    const snapshot = getProfileSnapshot(profileData)
    const cached   = loadCachedAnalysis(userId!, snapshot)
    if (cached) {
      setMessages([{ role: 'assistant', content: cached }])
      setInitialAnalysis(cached)
      setInitializing(false)
      return
    }
    setInitializing(false)
    await sendInitialAnalysis(profileData, portfolioData)
  }

  async function sendInitialAnalysis(
    profileData: Partial<UserProfile> | null,
    portfolioData: PortfolioItem[],
  ) {
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch('/api/analyze/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ messages: [], profile: profileData, portfolio: portfolioData, isInitial: true }),
      })
      const data = await res.json()
      const content = data?.message ?? 'AI не вернул ответ'
      setMessages([{ role: 'assistant', content }])
      setInitialAnalysis(content)
      if (userId) cacheAnalysis(userId, content, getProfileSnapshot(profileData))
    } catch {
      const fallback = 'AI временно недоступен. Попробуй позже.'
      setMessages([{ role: 'assistant', content: fallback }])
      setInitialAnalysis(fallback)
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  /* ── Calendar / command parsing ─────────────────────────────────────── */
  function normalizeMonth(month: string): number | null {
    const m = month.toLowerCase()
    const map: Record<string, number> = {
      'январь':1,'января':1,'янв':1,'февраль':2,'февраля':2,'февр':2,
      'март':3,'марта':3,'апрель':4,'апреля':4,'апр':4,'май':5,'мая':5,
      'июнь':6,'июня':6,'июл':7,'июль':7,'июля':7,'август':8,'августа':8,
      'сен':9,'сентябрь':9,'сентября':9,'окт':10,'октябрь':10,'октября':10,
      'ноя':11,'ноябрь':11,'ноября':11,'дек':12,'декабрь':12,'декабря':12,
    }
    return map[m] ?? null
  }

  function parseDateFromText(text: string): string | null {
    const t = text.trim()
    const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const dm = t.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/)
    if (dm) return `${dm[3]}-${String(dm[2]).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}`
    const md = t.match(/\b(\d{1,2})\s*([а-яА-Яa-zA-Z\.]+)\s*(\d{4})\b/)
    if (md) {
      const monthNum = normalizeMonth(md[2].replace('.','').toLowerCase())
      if (!monthNum) return null
      return `${md[3]}-${String(monthNum).padStart(2,'0')}-${String(md[1]).padStart(2,'0')}`
    }
    return null
  }

  async function tryApplyCalendarCommand(uid: string, text: string): Promise<string | null> {
    const normalized = text.toLowerCase()
    const notes: string[] = []

    const likelyCalendarDeadlines =
      (normalized.includes('календар') || normalized.includes('calendar')) &&
      (normalized.includes('дедлайн') || normalized.includes('даты') || normalized.includes('dates') ||
       normalized.includes('enroll') || normalized.includes('application'))

    if (likelyCalendarDeadlines) {
      const supabase = createSupabaseBrowserClient()
      const { data: candidates } = await supabase
        .from('universities').select('id, name, description_short').limit(80)

      if (!candidates || candidates.length === 0) {
        notes.push('В базе университетов пока пусто, не могу добавить дедлайны.')
      } else {
        const res = await fetch('/api/calendar/resolve-university', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, candidates }),
        })
        const ai = await res.json()
        const universityId   = ai?.university_id ?? ai?.universityId ?? ai?.id ?? null
        const universityName = ai?.matched_name ?? ai?.university_name ?? null

        if (!universityId) {
          notes.push('Не смог распознать университет по твоему запросу.')
        } else {
          const ok = await (await import('@/services/calendarService')).generateCalendarFromUniversity(uid, universityId)
          if (!ok) {
            notes.push(`Не удалось добавить дедлайны для ${universityName ?? 'университета'} в календарь.`)
          } else {
            const sinceIso = new Date(Date.now() - 2 * 60 * 1000).toISOString()
            const { data: inserted, error: insertedError } = await supabase
              .from('user_calendar_events')
              .select('title, start_date')
              .eq('user_id', uid)
              .eq('source_type', 'university_deadline')
              .eq('is_auto_generated', true)
              .gte('created_at', sinceIso)
              .order('start_date', { ascending: true })

            if (insertedError) {
              notes.push(`Дедлайны добавились, но не смог прочитать события: ${insertedError.message}`)
            } else {
              const relevant = (inserted ?? []).filter(e =>
                universityName ? (e.title ?? '').includes(String(universityName)) : true
              )
              const lines = [`Добавил дедлайны для ${universityName ?? 'университета'}:`]
              for (const e of relevant.slice(0, 12)) {
                const d = e.start_date ? new Date(e.start_date).toLocaleDateString('ru-RU') : ''
                lines.push(`- ${e.title}${d ? ` (${d})` : ''}`)
              }
              if (relevant.length === 0) lines.push('События не найдены (возможно, уже были).')
              notes.push(lines.join('\n'))
            }
          }
        }
      }
    }

    const wantsIelts = normalized.includes('ielts')
    const wantsSat   = normalized.includes('sat') && !normalized.includes('ent')
    const dateStr    = parseDateFromText(text)

    if ((wantsIelts || wantsSat) && dateStr) {
      const supabase = createSupabaseBrowserClient()
      const examLabel = wantsIelts ? 'IELTS' : 'SAT'
      const { error } = await supabase.from('user_calendar_events').insert({
        user_id: uid,
        title: `📝 ${examLabel} — ${dateStr}`,
        description: wantsIelts ? 'Запись/регистрация на IELTS' : 'Регистрация на SAT',
        start_date: new Date(`${dateStr}T00:00:00.000Z`).toISOString(),
        source_type: 'exam',
        is_auto_generated: false,
        is_done: false,
      })
      notes.push(error
        ? 'Нашёл дату, но не смог добавить событие в календарь (ошибка в БД).'
        : `Добавил ${examLabel} в календарь на ${dateStr}.`
      )
    }

    return notes.length ? notes.join('\n') : null
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user' as const, content: input }
    const baseMessages = [...messages, userMessage]

    let calendarNote: string | null = null
    if (userId) calendarNote = await tryApplyCalendarCommand(userId, input)

    if (calendarNote) {
      setMessages([...baseMessages, { role: 'assistant', content: calendarNote }])
      setInput('')
      return
    }

    setMessages(baseMessages)
    setInput('')
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch('/api/analyze/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ messages: baseMessages, profile, portfolio, isInitial: false }),
      })
      const data = await res.json()
      const reply = data?.message ?? 'AI не вернул ответ'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

      if (userId) {
        const supabase = createSupabaseBrowserClient()
        void Promise.resolve(supabase.from('ai_assistant_interactions').insert({
          user_id: userId,
          request_type: 'chat',
          input_snapshot: { message: input },
          response_summary: reply.substring(0, 200),
        })).then(({ error }) => { if (error) console.error('ai_assistant_interactions:', error) }).catch((err: unknown) => console.error('ai_assistant_interactions:', err))
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуй ещё раз.' }])
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const readinessScore = computeReadinessScore(profile)

  const scoreColor =
    readinessScore >= 70 ? 'text-emerald-400' :
    readinessScore >= 40 ? 'text-amber-400' :
    'text-red-400'

  const analysisLines = initialAnalysis.split('\n').filter(l => l.trim())

  const bentoStats = [
    { label: 'GPA',   value: profile?.gpa?.toFixed(1),        max: '4.0'  },
    { label: 'ЕНТ',   value: profile?.ent_score,              max: '140'  },
    { label: 'SAT',   value: profile?.sat_score,              max: '1600' },
    { label: 'IELTS', value: profile?.ielts_score?.toFixed(1),max: '9.0'  },
    { label: 'ACT',   value: profile?.act_score,              max: '36'   },
    { label: 'TOEFL', value: profile?.toefl_score,            max: '120'  },
  ].filter(s => s.value != null && s.value !== undefined)

  /* ── Initializing ─────────────────────────────────────────────────── */
  if (initializing) return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="text-center">
        <div className="ai-border mx-auto mb-6 w-16 h-16 rounded-2xl">
          <div className="w-full h-full rounded-[calc(1rem-1px)] bg-[var(--bg-base)] flex items-center justify-center">
            <Sparkles size={22} strokeWidth={1.5} className="text-[var(--accent)]" />
          </div>
        </div>
        <p className="t-title mb-1">Анализирую твой профиль...</p>
        <p className="t-body text-sm">Это займёт несколько секунд</p>
      </div>
    </main>
  )

  /* ── Analysis panel ───────────────────────────────────────────────── */
  if (view === 'analysis') return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/[0.04] blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-18 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center shrink-0">
              <Sparkles size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <div>
              <h1 className="t-title gradient-text-accent text-base leading-tight">AI Помощник</h1>
              <p className="t-label normal-case tracking-normal text-[var(--text-tertiary)]">Персональный навигатор</p>
            </div>
          </div>
          <button
            onClick={() => setView('chat')}
            className="btn-secondary flex items-center gap-2"
          >
            <MessageSquare size={14} strokeWidth={1.5} />
            Открыть диалог
          </button>
        </motion.div>

        {/* Score + Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 mb-6"
        >
          {/* Stats bento */}
          {bentoStats.length > 0 && (
            <div className="card-glass p-6">
              <p className="t-label mb-4">Академические показатели</p>
              <div className="grid grid-cols-3 gap-3">
                {bentoStats.map(s => (
                  <div key={s.label} className="card p-3 rounded-2xl text-center">
                    <p className="t-label mb-1">{s.label}</p>
                    <p className="t-title text-lg leading-none">{String(s.value)}</p>
                    <p className="t-label text-[var(--text-quaternary)] mt-0.5 text-[10px]">/ {s.max}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall score */}
          <div className="card-glass p-6 flex flex-col items-center justify-center min-w-[160px]">
            <p className="t-label mb-3 text-center">Общий балл</p>
            <div className={`text-5xl font-black tabular-nums leading-none mb-2 ${scoreColor}`}>
              {readinessScore}
            </div>
            <p className="t-label text-[var(--text-quaternary)]">/ 100</p>
            <div className="w-full mt-4 h-1.5 rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${readinessScore}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* AI Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card-glass p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center shrink-0">
              <Sparkles size={14} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="t-label gradient-text-accent normal-case tracking-normal text-sm font-semibold">
              Следующие шаги
            </span>
          </div>

          {loading && analysisLines.length === 0 ? (
            <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
              <Loader2 size={16} strokeWidth={1.5} className="animate-spin shrink-0" />
              <p className="t-body text-sm">Анализируем твой профиль...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {analysisLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <Sparkles
                    size={13}
                    strokeWidth={1.5}
                    className="text-[var(--accent)]/60 shrink-0 mt-1"
                  />
                  <p className="t-body text-sm leading-relaxed">{line}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="t-label mb-4">Быстрые действия</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actionShortcuts.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="card card-hover p-4 rounded-2xl flex flex-col items-center gap-2.5 text-center"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <Icon size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
                </div>
                <p className="t-body text-xs leading-snug">{label}</p>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </main>
  )

  /* ── Chat UI ──────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-screen px-4 pb-4">

        {/* Header */}
        <div className="flex items-center gap-3 py-5 border-b border-[var(--border)]">
          <button
            onClick={() => setView('analysis')}
            className="w-8 h-8 rounded-xl hover:bg-white/[0.05] flex items-center justify-center transition shrink-0"
          >
            <ArrowLeft size={16} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles size={14} strokeWidth={1.5} className="text-white" />
          </div>
          <div>
            <h1 className="t-title gradient-text-accent text-base leading-tight">Qadam AI</h1>
            <p className="t-label normal-case tracking-normal text-[var(--text-tertiary)]">Персональный навигатор</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="t-label normal-case tracking-normal text-[var(--text-tertiary)]">онлайн</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center shrink-0 mb-0.5">
                    <Sparkles size={13} strokeWidth={1.5} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-base)] rounded-3xl rounded-br-lg font-medium text-sm'
                    : 'card-glass rounded-3xl rounded-bl-lg text-sm text-[var(--text-secondary)] leading-relaxed'
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center shrink-0">
                <Sparkles size={13} strokeWidth={1.5} className="text-white" />
              </div>
              <div className="card-glass rounded-3xl rounded-bl-lg px-5 py-4">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full dot-1" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full dot-2" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full dot-3" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        <AnimatePresence>
          {messages.length < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="btn-secondary text-xs px-3.5 py-2 h-auto"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="ai-border">
          <div className="relative bg-[var(--bg-base)] rounded-[calc(1rem-1px)] flex items-center gap-2 p-2">
            <input
              type="text"
              placeholder="Задай вопрос AI помощнику..."
              className="flex-1 bg-transparent px-3 py-2 t-body text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0"
            >
              {loading
                ? <Loader2 size={14} strokeWidth={2} className="text-white animate-spin" />
                : <Send size={14} strokeWidth={2} className="text-white" />
              }
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
