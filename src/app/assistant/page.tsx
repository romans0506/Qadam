'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { getProfile, getPortfolio } from '@/services/profileService'
import { UserProfile, PortfolioItem } from '@/types/student'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface StrengthsData {
  strengths: string[]
  weaknesses: string[]
  next_steps: string[]
  score: number
}

export default function AssistantPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [strengths, setStrengths] = useState<StrengthsData | null>(null)
  const [strengthsLoading, setStrengthsLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const CHAT_STORAGE_PREFIX = 'qadam_ai_chat_v1'

  function getChatStorageKey(uid: string) {
    return `${CHAT_STORAGE_PREFIX}:${uid}`
  }

  function loadSavedMessages(uid: string): Message[] | null {
    try {
      const raw = localStorage.getItem(getChatStorageKey(uid))
      if (!raw) return null
      const parsed = JSON.parse(raw) as Message[]
      if (!Array.isArray(parsed)) return null
      return parsed.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    } catch {
      return null
    }
  }

  function persistMessages(uid: string, next: Message[]) {
    try {
      localStorage.setItem(getChatStorageKey(uid), JSON.stringify(next))
    } catch (e) {
      console.warn('Failed to persist chat history:', e)
    }
  }

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

  useEffect(() => {
    if (!userId) return
    if (!messages.length) return
    persistMessages(userId, messages)
  }, [userId, messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    const [profileData, portfolioData] = await Promise.all([
      getProfile(userId!),
      getPortfolio(userId!)
    ])
    setProfile(profileData)
    setPortfolio(portfolioData)

    // Загружаем анализ сильных/слабых сторон
    loadStrengths(profileData, portfolioData)

    const savedMessages = loadSavedMessages(userId!)
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages)
      setInitializing(false)
      return
    }

    setInitializing(false)
    await sendInitialAnalysis(profileData, portfolioData)
  }

  async function loadStrengths(profileData: Partial<UserProfile> | null, portfolioData: PortfolioItem[]) {
    setStrengthsLoading(true)
    try {
      const res = await fetch('/api/analyze/strengths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData, portfolio: portfolioData }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.strengths) setStrengths(data)
      }
    } catch {
      // Не блокируем UI при ошибке анализа
    } finally {
      setStrengthsLoading(false)
    }
  }

  async function sendInitialAnalysis(
    profileData: Partial<UserProfile> | null,
    portfolioData: PortfolioItem[]
  ) {
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch('/api/analyze/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [],
          profile: profileData,
          portfolio: portfolioData,
          isInitial: true,
        })
      })
      const data = await res.json()
      setMessages([{ role: 'assistant', content: data?.message ?? 'AI не вернул ответ' }])
    } catch {
      setMessages([{ role: 'assistant', content: 'AI временно недоступен. Попробуй позже.' }])
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user' as const, content: input }
    const baseMessages = [...messages, userMessage]
    let calendarAssistantNote: string | null = null
    if (userId) {
      calendarAssistantNote = await tryApplyCalendarCommand(userId, input)
    }

    if (calendarAssistantNote) {
      setMessages([...baseMessages, { role: 'assistant', content: calendarAssistantNote }])
      setInput('')
      return
    }

    setMessages(baseMessages)
    setInput('')
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)

    try {
      const res = await fetch('/api/analyze/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: baseMessages,
          profile,
          portfolio,
          isInitial: false,
        })
      })
      const data = await res.json()
      if (data?.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        if (userId) {
          const supabase = createSupabaseBrowserClient()
          supabase.from('ai_assistant_interactions').insert({
            user_id: userId,
            request_type: 'chat',
            input_snapshot: { message: input },
            response_summary: data.message.substring(0, 200),
          }).then(({ error }) => { if (error) console.error('Failed to save interaction:', error) })
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуй ещё раз.' }])
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  function normalizeMonth(month: string): number | null {
    const m = month.toLowerCase()
    const map: Record<string, number> = {
      'январь': 1, 'января': 1, 'янв': 1,
      'февраль': 2, 'февраля': 2, 'февр': 2,
      'март': 3, 'марта': 3,
      'апрель': 4, 'апреля': 4, 'апр': 4,
      'май': 5, 'мая': 5,
      'июнь': 6, 'июня': 6,
      'июль': 7, 'июля': 7, 'июл': 7,
      'август': 8, 'августа': 8,
      'сентябрь': 9, 'сентября': 9, 'сен': 9,
      'октябрь': 10, 'октября': 10, 'окт': 10,
      'ноябрь': 11, 'ноября': 11, 'ноя': 11,
      'декабрь': 12, 'декабря': 12, 'дек': 12,
    }
    return map[m] ?? null
  }

  function parseDateFromText(text: string): string | null {
    const t = text.trim()
    const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const dm = t.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/)
    if (dm) {
      return `${dm[3]}-${String(dm[2]).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`
    }
    const md = t.match(/\b(\d{1,2})\s*([а-яА-Яa-zA-Z\.]+)\s*(\d{4})\b/)
    if (md) {
      const monthNum = normalizeMonth(md[2].replace('.', '').toLowerCase())
      if (!monthNum) return null
      return `${md[3]}-${String(monthNum).padStart(2, '0')}-${String(md[1]).padStart(2, '0')}`
    }
    return null
  }

  async function tryApplyCalendarCommand(uid: string, text: string): Promise<string | null> {
    const normalized = text.toLowerCase()
    const notes: string[] = []

    // A) Университетские дедлайны
    const likelyCalendarDeadlines =
      (normalized.includes('календар') || normalized.includes('calendar')) &&
      (normalized.includes('дедлайн') || normalized.includes('даты') || normalized.includes('dates') || normalized.includes('application'))

    if (likelyCalendarDeadlines) {
      const supabase = createSupabaseBrowserClient()
      const { data: candidates } = await supabase
        .from('universities')
        .select('id, name, description_short')
        .limit(80)

      if (!candidates || candidates.length === 0) {
        notes.push('В базе университетов пока пусто, не могу добавить дедлайны.')
      } else {
        const res = await fetch('/api/calendar/resolve-university', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, candidates }),
        })
        const ai = await res.json()
        const universityId = ai?.university_id ?? ai?.universityId ?? ai?.id ?? null
        const universityName = ai?.matched_name ?? ai?.university_name ?? null

        if (!universityId) {
          notes.push('Не смог распознать университет по твоему запросу.')
        } else {
          const ok = await (await import('@/services/calendarService')).generateCalendarFromUniversity(uid, universityId)
          if (!ok) {
            notes.push(`Не удалось добавить дедлайны для ${universityName ?? 'университета'}.`)
          } else {
            const sinceIso = new Date(Date.now() - 2 * 60 * 1000).toISOString()
            const { data: inserted } = await supabase
              .from('user_calendar_events')
              .select('title, start_date')
              .eq('user_id', uid)
              .eq('source_type', 'university_deadline')
              .eq('is_auto_generated', true)
              .gte('created_at', sinceIso)
              .order('start_date', { ascending: true })

            const lines = [`Добавил дедлайны для ${universityName ?? 'университета'}:`]
            for (const e of (inserted ?? []).slice(0, 12)) {
              const d = e.start_date ? new Date(e.start_date).toLocaleDateString('ru-RU') : ''
              lines.push(`- ${e.title}${d ? ` (${d})` : ''}`)
            }
            if (!inserted?.length) lines.push('События не найдены (возможно, они уже были добавлены).')
            notes.push(lines.join('\n'))
          }
        }
      }
    }

    // B) IELTS/SAT/ЕНТ/ACT/TOEFL + дата -> добавляем событие
    const examPatterns = [
      { key: 'ielts', label: 'IELTS', desc: 'Регистрация/сдача IELTS' },
      { key: 'sat', label: 'SAT', desc: 'Регистрация/сдача SAT' },
      { key: 'ент', label: 'ЕНТ', desc: 'Сдача ЕНТ' },
      { key: 'ent', label: 'ЕНТ', desc: 'Сдача ЕНТ' },
      { key: 'act', label: 'ACT', desc: 'Регистрация/сдача ACT' },
      { key: 'toefl', label: 'TOEFL', desc: 'Регистрация/сдача TOEFL' },
    ]
    const dateStr = parseDateFromText(text)
    const matchedExam = examPatterns.find(p => normalized.includes(p.key))

    if (matchedExam && dateStr) {
      const supabase = createSupabaseBrowserClient()
      const isoDate = new Date(`${dateStr}T00:00:00.000Z`).toISOString()
      const title = `📝 ${matchedExam.label} — ${dateStr}`

      const { error } = await supabase.from('user_calendar_events').insert({
        user_id: uid,
        title,
        description: matchedExam.desc,
        start_date: isoDate,
        source_type: 'exam',
        is_auto_generated: false,
        is_done: false,
      })

      notes.push(error
        ? 'Нашёл дату, но не смог добавить событие в календарь.'
        : `Добавил ${matchedExam.label} в календарь на ${dateStr}.`)
    }

    return notes.length ? notes.join('\n') : null
  }

  const quickQuestions = [
    'Каковы мои шансы поступить в НУ?',
    'Какой экзамен лучше — SAT или ACT?',
    'Когда зарегистрироваться на IELTS?',
    'Составь план подготовки на 3 месяца',
    'Что добавить в портфолио?',
    'Как улучшить профиль для MIT?',
  ]

  function getScoreColor(score: number) {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getScoreBg(score: number) {
    if (score >= 75) return 'bg-green-50 border-green-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  if (initializing) return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xl font-medium">AI анализирует твой профиль...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-screen p-4 gap-3">

        {/* Заголовок */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold text-white">AI Помощник</h1>
            <p className="text-blue-300 text-xs">Персональный навигатор по поступлению</p>
          </div>
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="bg-blue-800/50 text-blue-200 text-xs px-3 py-1.5 rounded-full hover:bg-blue-700/50 transition"
          >
            {showAnalysis ? 'Скрыть анализ' : 'Показать анализ'}
          </button>
        </div>

        {/* Панель анализа сильных/слабых сторон */}
        {showAnalysis && (
          <div className={`rounded-2xl border p-4 ${strengths ? getScoreBg(strengths.score) : 'bg-white/5 border-white/10'}`}>
            {strengthsLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Анализирую профиль...
              </div>
            ) : strengths ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Анализ профиля</p>
                  <span className={`text-2xl font-bold ${getScoreColor(strengths.score)}`}>
                    {strengths.score}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1">Сильные стороны</p>
                    <ul className="space-y-1">
                      {strengths.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-1">
                          <span className="text-green-500 shrink-0">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">Слабые стороны</p>
                    <ul className="space-y-1">
                      {strengths.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-1">
                          <span className="text-red-400 shrink-0">!</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">Следующие шаги</p>
                  <div className="flex flex-wrap gap-1">
                    {strengths.next_steps.map((step, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{step}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-xs">Заполни профиль, чтобы получить анализ</p>
            )}
          </div>
        )}

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-lg'
              }`}>
                {msg.role === 'assistant' && (
                  <p className="text-xs text-blue-500 font-semibold mb-1">Qadam AI</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs text-blue-500 font-semibold mb-1">Qadam AI</p>
                <div className="flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые вопросы */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="bg-white/10 text-blue-100 text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition border border-white/10"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Поле ввода */}
        <div className="flex gap-2 pb-2">
          <input
            type="text"
            placeholder="Задай вопрос AI помощнику..."
            className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-500 transition disabled:opacity-40 font-bold text-lg"
          >
            ↑
          </button>
        </div>

      </div>
    </main>
  )
}
