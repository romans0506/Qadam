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

export default function AssistantPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
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

  // Сохраняем историю чата при изменении сообщений
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

    // Если история уже есть — восстанавливаем и не дергаем initial analysis заново
    const savedMessages = loadSavedMessages(userId!)
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages)
      setInitializing(false)
      return
    }

    setInitializing(false)

    // Приветственное сообщение от AI (только если истории ещё нет)
    await sendInitialAnalysis(profileData, portfolioData)
  }

  async function sendInitialAnalysis(
    profileData: Partial<UserProfile> | null,
    portfolioData: PortfolioItem[]
  ) {
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30000)
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
      if (data?.message) {
        setMessages([{ role: 'assistant', content: data.message }])
        return
      }
      setMessages([{ role: 'assistant', content: data?.message ?? 'AI не вернул ответ' }])
    } catch (e) {
      console.error(e)
      setMessages([{ role: 'assistant', content: 'AI временно недоступен. Попробуй позже.' }])
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user' as const, content: input }
    // 1) Пытаемся применить календарную команду пользователя
    //    (MIT -> генерация по дедлайнам; IELTS/SAT + дата -> добавление события)
    const baseMessages = [...messages, userMessage]
    let calendarAssistantNote: string | null = null
    if (userId) {
      calendarAssistantNote = await tryApplyCalendarCommand(userId, input)
    }
  
    if (calendarAssistantNote) {
      // Команду применили: отвечаем точным списком событий (без генерации ИИ),
      // чтобы не было "почти так".
      setMessages([...baseMessages, { role: 'assistant', content: calendarAssistantNote }])
      setInput('')
      return
    }

    setMessages(baseMessages)
    setInput('')
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30000)

    try {
      // 2) Отправляем вопрос в AI, чтобы он ответил “человечески”
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

        // Сохраняем в базу
        if (userId) {
          const supabase = createSupabaseBrowserClient()
          // Не блокируем чат на запись в БД (иначе при проблемах с RLS может "зависнуть" запрос)
          supabase
            .from('ai_assistant_interactions')
            .insert({
              user_id: userId,
              request_type: 'chat',
              input_snapshot: { message: input },
              response_summary: data.message.substring(0, 200),
            })
            .then(({ error }) => {
              if (error) console.error('Failed to save ai_assistant_interactions:', error)
            })
            .catch((err) => console.error('Failed to save ai_assistant_interactions:', err))
        }
        return
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.message ?? 'AI не вернул ответ'
      }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Произошла ошибка. Попробуй ещё раз.'
      }])
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  function normalizeMonth(month: string): number | null {
    const m = month.toLowerCase()
    const map: Record<string, number> = {
      'январь': 1,
      'января': 1,
      'янв': 1,
      'февраль': 2,
      'февраля': 2,
      'февр': 2,
      'март': 3,
      'марта': 3,
      'апрель': 4,
      'апреля': 4,
      'апр': 4,
      'май': 5,
      'мая': 5,
      'июнь': 6,
      'июня': 6,
      'июл': 7,
      'июль': 7,
      'июля': 7,
      'август': 8,
      'августа': 8,
      'сен': 9,
      'сентябрь': 9,
      'сентября': 9,
      'окт': 10,
      'октябрь': 10,
      'октября': 10,
      'ноя': 11,
      'ноябрь': 11,
      'ноября': 11,
      'дек': 12,
      'декабрь': 12,
      'декабря': 12,
    }
    return map[m] ?? null
  }

  function parseDateFromText(text: string): string | null {
    const t = text.trim()

    // 1) YYYY-MM-DD
    const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

    // 2) DD.MM.YYYY or DD/MM/YYYY
    const dm = t.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/)
    if (dm) {
      const d = String(dm[1]).padStart(2, '0')
      const m = String(dm[2]).padStart(2, '0')
      const y = dm[3]
      return `${y}-${m}-${d}`
    }

    // 3) "12 апреля 2026"
    const md = t.match(
      /\b(\d{1,2})\s*([а-яА-Яa-zA-Z\.]+)\s*(\d{4})\b/
    )
    if (md) {
      const d = String(md[1]).padStart(2, '0')
      const monthNum = normalizeMonth(md[2].replace('.', '').toLowerCase())
      if (!monthNum) return null
      const m = String(monthNum).padStart(2, '0')
      const y = md[3]
      return `${y}-${m}-${d}`
    }

    return null
  }

  async function tryApplyCalendarCommand(uid: string, text: string): Promise<string | null> {
    const normalized = text.toLowerCase()
    const notes: string[] = []

    // A) Университетские дедлайны (внеси даты/дедлайны ... в календарь)
    const likelyCalendarDeadlines =
      (normalized.includes('календар') || normalized.includes('calendar')) &&
      (normalized.includes('дедлайн') || normalized.includes('даты') || normalized.includes('dates') || normalized.includes('enroll') || normalized.includes('application'))

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
          const ok = await (await import('@/services/calendarService')).generateCalendarFromUniversity(
            uid,
            universityId
          )
          if (!ok) {
            notes.push(
              `Не удалось добавить дедлайны для ${universityName ?? 'университета'} в календарь. ` +
                'Проверь, что `university_deadlines` заполнены и что вставка в `user_calendar_events` разрешена.'
            )
          } else {
            // Точный список из БД, чтобы ответ совпадал с тем, что реально добавлено.
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
              notes.push(
                `Дедлайны добавились, но не смог прочитать события: ${insertedError.message}`
              )
            } else {
              const relevant = (inserted ?? []).filter((e) =>
                universityName ? (e.title ?? '').includes(String(universityName)) : true
              )

              const lines: string[] = []
              lines.push(`Добавил дедлайны для ${universityName ?? 'университета'}:`)
              for (const e of relevant.slice(0, 12)) {
                const d = e.start_date ? new Date(e.start_date).toLocaleDateString('ru-RU') : ''
                lines.push(`- ${e.title}${d ? ` (${d})` : ''}`)
              }
              if (relevant.length === 0) {
                lines.push('События не найдены в календаре (возможно, они уже были).')
              }
              notes.push(lines.join('\n'))
            }
          }
        }
      }
    }

    // B) IELTS/SAT + дата -> добавляем событие
    const wantsIelts = normalized.includes('ielts')
    const wantsSat = normalized.includes('sat') && !normalized.includes('ent')
    const dateStr = parseDateFromText(text)

    if ((wantsIelts || wantsSat) && dateStr) {
      const supabase = createSupabaseBrowserClient()
      const isoDate = new Date(`${dateStr}T00:00:00.000Z`).toISOString()

      const examLabel = wantsIelts ? 'IELTS' : 'SAT'
      const title = `📝 ${examLabel} — ${dateStr}`
      const description = wantsIelts
        ? 'Запись/регистрация на IELTS'
        : 'Регистрация на SAT'

      const { error } = await supabase.from('user_calendar_events').insert({
        user_id: uid,
        title,
        description,
        start_date: isoDate,
        source_type: 'exam',
        is_auto_generated: false,
        is_done: false,
      })

      if (error) {
        console.error('Failed to insert exam event:', error)
        notes.push('Нашёл дату, но не смог добавить событие в календарь (ошибка в БД).')
      }
      else {
        notes.push(`Добавил ${examLabel} в календарь на ${dateStr}.`)
      }
    }

    // если команда не распознана — не добавляем сообщение
    return notes.length ? notes.join('\n') : null
  }

  const quickQuestions = [
    'Каковы мои шансы поступить в НУ?',
    'Какой экзамен лучше сдавать — SAT или ACT?',
    'Когда нужно зарегистрироваться на IELTS?',
    'Как улучшить мой профиль для MIT?',
    'Что добавить в портфолио?',
    'Составь план подготовки на 3 месяца',
  ]

  if (initializing) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl mb-4">🤖</div>
        <p className="text-xl">AI анализирует твой профиль...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-screen p-4">

        {/* Заголовок */}
        <div className="text-center text-white py-4">
          <h1 className="text-2xl font-bold">🤖 AI Помощник</h1>
          <p className="text-blue-200 text-sm">Персональный навигатор по поступлению</p>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-lg'
              }`}>
                {msg.role === 'assistant' && (
                  <p className="text-xs text-blue-500 font-medium mb-1">🤖 Qadam AI</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs text-blue-500 font-medium mb-1">🤖 Qadam AI</p>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые вопросы */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="bg-blue-800 text-blue-100 text-xs px-3 py-1.5 rounded-full hover:bg-blue-700 transition"
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
            className="flex-1 bg-white rounded-2xl px-4 py-3 text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 transition disabled:opacity-40 font-bold"
          >
            →
          </button>
        </div>

      </div>
    </main>
  )
}