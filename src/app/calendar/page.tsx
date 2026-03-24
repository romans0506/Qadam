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

const sourceConfig: Record<string, { label: string; color: string }> = {
  university_deadline: { label: 'Универ', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  profile_goal:        { label: 'Цель',   color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  deadline:            { label: 'Дедлайн', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  exam:                { label: 'Экзамен', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  event:               { label: 'Событие', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  reminder:            { label: 'Напом.', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
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
    setEvents(events.map(e => e.id === id ? { ...e, is_done: !current } : e))
  }

  async function deleteEvent(id: string) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('user_calendar_events').delete().eq('id', id)
    setEvents(events.filter(e => e.id !== id))
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'auto') return e.is_auto_generated
    if (filter === 'manual') return !e.is_auto_generated
    return true
  })

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const month = new Date(event.start_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    if (!groups[month]) groups[month] = []
    groups[month].push(event)
    return groups
  }, {} as Record<string, CalendarEvent[]>)

  const upcoming = events.filter(e => !e.is_done).length

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
          <h1 className="text-4xl font-bold mb-2">Календарь</h1>
          <p className="text-blue-300">
            {upcoming > 0 ? `${upcoming} предстоящих событий` : 'Нет предстоящих событий'}
          </p>
        </div>

        {/* Фильтры + кнопка */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {[
              { value: 'all', label: 'Все' },
              { value: 'auto', label: 'Авто' },
              { value: 'manual', label: 'Мои' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as typeof filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === opt.value
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-blue-300 hover:bg-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        </div>

        {/* Форма */}
        {showForm && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-4 space-y-3">
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Название события"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Описание (необязательно)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="date"
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
            />
            <select
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
            >
              Сохранить
            </button>
          </div>
        )}

        {/* События */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-blue-300">
            <p className="text-lg mb-1">Нет событий</p>
            <p className="text-sm opacity-70">Заполни профиль или сохрани университет — события появятся автоматически</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 capitalize">{month}</h2>
                <div className="space-y-2">
                  {monthEvents.map(event => {
                    const src = sourceConfig[event.source_type ?? ''] ?? { label: event.source_type ?? '', color: 'bg-white/10 text-white/50 border-white/10' }
                    return (
                      <div
                        key={event.id}
                        className={`bg-white/8 border border-white/10 rounded-xl p-4 transition ${event.is_done ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={event.is_done}
                            onChange={() => toggleDone(event.id, event.is_done)}
                            className="w-4 h-4 mt-1 cursor-pointer accent-blue-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-white text-sm ${event.is_done ? 'line-through' : ''}`}>
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-blue-300/70 text-xs mt-0.5 leading-relaxed">{event.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="text-white/40 text-xs">
                                {new Date(event.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                              </span>
                              {event.source_type && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${src.color}`}>
                                  {src.label}
                                </span>
                              )}
                              {event.is_auto_generated && (
                                <span className="text-xs text-white/30">авто</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="text-white/20 hover:text-red-400 transition text-sm shrink-0"
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
