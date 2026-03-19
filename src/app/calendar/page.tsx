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

  const sourceColors: Record<string, string> = {
    university_deadline: 'bg-red-50 text-red-700',
    profile_goal: 'bg-blue-50 text-blue-700',
    deadline: 'bg-red-50 text-red-700',
    exam: 'bg-purple-50 text-purple-700',
    event: 'bg-green-50 text-green-700',
    reminder: 'bg-yellow-50 text-yellow-700',
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
          <h1 className="text-4xl font-bold mb-2">Календарь 📅</h1>
          <p className="text-blue-200">
            {events.filter(e => !e.is_done).length} предстоящих событий
          </p>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'all', label: '🌍 Все' },
            { value: 'auto', label: '🤖 Авто' },
            { value: 'manual', label: '✏️ Мои' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === opt.value
                  ? 'bg-white text-blue-900'
                  : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-white text-blue-900 font-bold py-3 rounded-2xl mb-4 hover:bg-blue-50 transition"
        >
          {showForm ? 'Отмена' : '+ Добавить событие'}
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <div className="space-y-3">
              <input
                className="w-full border rounded-lg p-3 text-gray-800"
                placeholder="Название"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <input
                className="w-full border rounded-lg p-3 text-gray-800"
                placeholder="Описание (необязательно)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="date"
                className="w-full border rounded-lg p-3 text-gray-800"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
              <select
                className="w-full border rounded-lg p-3 text-gray-800"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="deadline">📅 Дедлайн</option>
                <option value="exam">📝 Экзамен</option>
                <option value="event">🎯 Событие</option>
                <option value="reminder">🔔 Напоминание</option>
              </select>
              <button
                onClick={addEvent}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
            <p className="text-lg mb-2">Нет событий</p>
            <p className="text-sm">Сохрани университет или заполни профиль — события появятся автоматически!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-white font-bold text-lg mb-3 capitalize">{month}</h2>
                <div className="space-y-3">
                  {monthEvents.map(event => (
                    <div
                      key={event.id}
                      className={`bg-white rounded-2xl p-4 shadow-lg ${event.is_done ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={event.is_done}
                            onChange={() => toggleDone(event.id, event.is_done)}
                            className="w-5 h-5 mt-1 cursor-pointer"
                          />
                          <div>
                            <p className={`font-bold text-gray-800 ${event.is_done ? 'line-through' : ''}`}>
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-gray-500 text-sm mt-1">{event.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs text-gray-400">
                                {new Date(event.start_date).toLocaleDateString('ru-RU', {
                                  day: 'numeric', month: 'long'
                                })}
                              </span>
                              {event.source_type && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${sourceColors[event.source_type] || 'bg-gray-100 text-gray-600'}`}>
                                  {event.source_type === 'university_deadline' ? '🏛️ Универ' :
                                   event.source_type === 'profile_goal' ? '🎯 Цель' :
                                   event.source_type}
                                </span>
                              )}
                              {event.is_auto_generated && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                  🤖 Авто
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-gray-300 hover:text-red-500 transition ml-2 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}