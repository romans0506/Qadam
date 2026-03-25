'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Plus, X, RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  source_type: string | null
  is_auto_generated: boolean
  is_done: boolean
}

/* Left-border accent colour per event type */
const sourceConfig: Record<string, { label: string; border: string; badge: string }> = {
  university_deadline: { label: 'Дедлайн',     border: 'border-l-red-500/70',    badge: 'text-red-400 border-red-500/30' },
  deadline:           { label: 'Дедлайн',     border: 'border-l-red-500/70',    badge: 'text-red-400 border-red-500/30' },
  exam:               { label: 'Экзамен',     border: 'border-l-violet-500/70', badge: 'text-violet-400 border-violet-500/30' },
  profile_goal:       { label: 'Цель',        border: 'border-l-[var(--accent)]/60', badge: 'text-[var(--accent)] border-[var(--accent)]/30' },
  event:              { label: 'Событие',     border: 'border-l-emerald-500/70', badge: 'text-emerald-400 border-emerald-500/30' },
  reminder:           { label: 'Напомин.',    border: 'border-l-amber-500/70',  badge: 'text-amber-400 border-amber-500/30' },
}
const fallbackSrc = { label: '', border: 'border-l-[var(--border-strong)]', badge: 'text-[var(--text-tertiary)] border-[var(--border)]' }

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
}

export default function CalendarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual'>('all')
  const [form, setForm] = useState({ title: '', description: '', start_date: '', type: 'deadline' })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.push('/login'); return }
      setUserId(data.session?.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    loadEvents()
  }, [userId])

  async function loadEvents() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from('user_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })
    setEvents(data ?? [])
    setLoading(false)
  }

  async function addEvent() {
    if (!userId || !form.title || !form.start_date) return
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('user_calendar_events').insert({
      user_id: userId,
      title: form.title,
      description: form.description || null,
      start_date: new Date(form.start_date).toISOString(),
      source_type: form.type,
      is_auto_generated: false,
      is_done: false,
    })
    if (error) { console.error(error); return }
    setForm({ title: '', description: '', start_date: '', type: 'deadline' })
    setShowForm(false)
    loadEvents()
  }

  async function toggleDone(id: string, current: boolean) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('user_calendar_events').update({ is_done: !current }).eq('id', id)
    setEvents(ev => ev.map(e => e.id === id ? { ...e, is_done: !current } : e))
  }

  async function deleteEvent(id: string) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('user_calendar_events').delete().eq('id', id)
    setEvents(ev => ev.filter(e => e.id !== id))
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'auto') return e.is_auto_generated
    if (filter === 'manual') return !e.is_auto_generated
    return true
  })

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const month = new Date(event.start_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  const pendingCount = events.filter(e => !e.is_done).length

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
          <h1 className="t-headline mb-2">Календарь</h1>
          <p className="t-body">
            {pendingCount > 0
              ? `${pendingCount} предстоящих событий`
              : 'Всё сделано — ты красавчик'}
          </p>
        </div>

        {/* ── Controls bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {([
            { value: 'all',    label: 'Все' },
            { value: 'auto',   label: 'Авто' },
            { value: 'manual', label: 'Мои' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`btn-secondary text-sm px-4 py-2 h-auto ${
                filter === opt.value
                  ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
                  : ''
              }`}
            >
              {opt.label}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={loadEvents}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 h-auto text-sm"
              title="Синхронизировать с университетами"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
              Синхронизировать
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 h-auto text-sm"
            >
              {showForm
                ? <><X size={13} strokeWidth={1.5} /> Закрыть</>
                : <><Plus size={13} strokeWidth={1.5} /> Событие</>
              }
            </button>
          </div>
        </div>

        {/* ── Add event form ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="card p-6 mb-8 flex flex-col gap-3"
            >
              <p className="t-label mb-2">Новое событие</p>
              <input
                className="inp"
                placeholder="Название события"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <input
                className="inp"
                placeholder="Описание (необязательно)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="date"
                className="inp"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
              <select
                className="inp [&>option]:bg-[#111111]"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="deadline">Дедлайн</option>
                <option value="exam">Экзамен</option>
                <option value="event">Событие</option>
                <option value="reminder">Напоминание</option>
              </select>
              <button onClick={addEvent} className="btn-primary mt-1">
                Сохранить
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {filteredEvents.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="t-title text-[var(--text-secondary)] mb-2">Нет событий</p>
            <p className="t-body text-sm">Сохрани университет или заполни профиль — события появятся автоматически</p>
          </div>
        ) : (
          /* ── Timeline ──────────────────────────────────────────────── */
          <div className="space-y-12">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>

                {/* Month label */}
                <div className="flex items-center gap-4 mb-6">
                  <p className="t-label capitalize">{month}</p>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {/* Events */}
                <motion.div
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  <AnimatePresence>
                    {monthEvents.map(event => {
                      const src = sourceConfig[event.source_type ?? ''] ?? fallbackSrc
                      const d = new Date(event.start_date)
                      const day = d.getDate()
                      const mon = d.toLocaleDateString('ru-RU', { month: 'short' })

                      return (
                        <motion.div
                          key={event.id}
                          variants={listItem}
                          exit="exit"
                          layout
                        >
                          <div className={`card card-hover flex items-stretch gap-0 overflow-hidden border-l-4 ${src.border} ${event.is_done ? 'opacity-50' : ''}`}>

                            {/* Date column */}
                            <div className="flex flex-col items-center justify-center px-5 py-4 border-r border-[var(--border)] shrink-0 min-w-[64px]">
                              <p className="font-bold text-2xl leading-none text-[var(--text-primary)] tabular-nums">{day}</p>
                              <p className="t-label mt-1 normal-case tracking-normal">{mon}</p>
                            </div>

                            {/* Body */}
                            <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-4">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleDone(event.id, event.is_done)}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition shrink-0"
                              >
                                {event.is_done
                                  ? <CheckSquare size={16} strokeWidth={1.5} className="text-emerald-400" />
                                  : <Square size={16} strokeWidth={1.5} />
                                }
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className={`t-title text-base leading-snug ${event.is_done ? 'line-through text-[var(--text-tertiary)]' : ''}`}>
                                  {event.title}
                                </p>
                                {event.description && (
                                  <p className="t-body text-sm mt-0.5 truncate">{event.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {event.source_type && src.label && (
                                    <span className={`t-label normal-case tracking-normal border px-2.5 py-0.5 rounded-full ${src.badge}`}>
                                      {src.label}
                                    </span>
                                  )}
                                  {event.is_auto_generated && (
                                    <span className="t-label normal-case tracking-normal text-[var(--text-quaternary)]">
                                      авто
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="px-4 text-[var(--text-quaternary)] hover:text-red-400 transition shrink-0"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
