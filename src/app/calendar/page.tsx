'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function CalendarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual'>('all')
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    type: 'deadline'
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
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

    const { error } = await supabase
      .from('user_calendar_events')
      .insert({
        user_id: userId,
        title: form.title,
        description: form.description || null,
        start_date: new Date(form.start_date).toISOString(),
        source_type: form.type,
        is_auto_generated: false,
        is_done: false,
      })

    if (error) { console.error('Ошибка:', error); return }

    setForm({ title: '', description: '', start_date: '', type: 'deadline' })
    setShowForm(false)
    loadEvents()
  }

  async function toggleDone(id: string, current: boolean) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('user_calendar_events').update({ is_done: !current }).eq('id', id)
    setEvents(events.map(e => e.id === id ? { ...e, is_done: !current } : e))
  }

  async function deleteEvent(id: string) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('user_calendar_events').delete().eq('id', id)
    setEvents(events.filter(e => e.id !== id))
  }

  // Группируем события по месяцам
  const filteredEvents = events.filter(e => {
    if (filter === 'auto') return e.is_auto_generated
    if (filter === 'manual') return !e.is_auto_generated
    return true
  })

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const month = new Date(event.start_date).toLocaleDateString('ru-RU', {
      month: 'long', year: 'numeric'
    })
    if (!groups[month]) groups[month] = []
    groups[month].push(event)
    return groups
  }, {} as Record<string, CalendarEvent[]>)

  const sourceConfig: Record<string, { label: string; color: string; dot: string }> = {
    university_deadline: { label: 'Дедлайн', color: 'bg-red-500/10 border-red-500/20 text-red-400', dot: 'bg-red-400' },
    profile_goal: { label: 'Цель', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', dot: 'bg-indigo-400' },
    deadline: { label: 'Дедлайн', color: 'bg-red-500/10 border-red-500/20 text-red-400', dot: 'bg-red-400' },
    exam: { label: 'Экзамен', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400', dot: 'bg-violet-400' },
    event: { label: 'Событие', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
    reminder: { label: 'Напоминание', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  }

  const inputClass = 'w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition'

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
          <h1 className="text-3xl font-bold text-white mb-1">Календарь</h1>
          <p className="text-slate-500 text-sm">
            {events.filter(e => !e.is_done).length} предстоящих событий
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { value: 'all', label: 'Все' },
            { value: 'auto', label: 'Авто' },
            { value: 'manual', label: 'Мои' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as typeof filter)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                filter === opt.value
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
          >
            {showForm ? '✕ Закрыть' : '+ Событие'}
          </button>
        </div>

        {/* Add event form */}
        {showForm && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-5 space-y-3">
            <input
              className={inputClass}
              placeholder="Название события"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Описание (необязательно)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
            />
            <select
              className={`${inputClass} [&>option]:bg-[#0f1629]`}
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="deadline">Дедлайн</option>
              <option value="exam">Экзамен</option>
              <option value="event">Событие</option>
              <option value="reminder">Напоминание</option>
            </select>
            <button
              onClick={addEvent}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              Сохранить
            </button>
          </div>
        )}

        {/* Empty state */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-lg mb-1">Нет событий</p>
            <p className="text-slate-600 text-sm">Сохрани университет или заполни профиль — события появятся автоматически!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest capitalize">{month}</p>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Timeline */}
                <div className="relative pl-5 space-y-2">
                  <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" />

                  {monthEvents.map(event => {
                    const src = sourceConfig[event.source_type ?? ''] ?? { label: event.source_type ?? '', color: 'bg-slate-500/10 border-slate-500/20 text-slate-400', dot: 'bg-slate-400' }
                    return (
                      <div
                        key={event.id}
                        className={`relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] rounded-xl p-4 transition ${event.is_done ? 'opacity-50' : ''}`}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute -left-[1.35rem] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-[#030712] ${src.dot}`} />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={event.is_done}
                              onChange={() => toggleDone(event.id, event.is_done)}
                              className="mt-1 w-4 h-4 cursor-pointer accent-indigo-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-white text-sm font-medium leading-snug ${event.is_done ? 'line-through text-slate-500' : ''}`}>
                                {event.title}
                              </p>
                              {event.description && (
                                <p className="text-slate-500 text-xs mt-0.5">{event.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-xs text-slate-600">
                                  {new Date(event.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                </span>
                                {event.source_type && (
                                  <span className={`text-xs px-2 py-0.5 rounded-md border ${src.color}`}>
                                    {src.label}
                                  </span>
                                )}
                                {event.is_auto_generated && (
                                  <span className="text-xs px-2 py-0.5 rounded-md border bg-slate-500/10 border-slate-500/20 text-slate-500">
                                    авто
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="text-slate-600 hover:text-red-400 transition shrink-0 mt-0.5 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}