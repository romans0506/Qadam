'use client'
import { useState } from 'react'
import { CalendarPlus, Check, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface Props {
  universityName: string
  deadlineType: string
  deadlineDate: string
  description: string | null
}

export default function DeadlineCalendarButton({ universityName, deadlineType, deadlineDate, description }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleAdd() {
    setStatus('loading')
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setStatus('idle'); return }

    const start = new Date(deadlineDate)
    start.setHours(23, 59, 0, 0)

    const reminder = new Date(start)
    reminder.setDate(reminder.getDate() - 7)

    await supabase.from('user_calendar_events').insert({
      user_id: session?.user.id,
      source_type: 'university_deadline',
      title: `${universityName} — ${deadlineType}`,
      description: description ?? undefined,
      start_date: start.toISOString(),
      reminder_at: reminder.toISOString(),
      is_auto_generated: false,
    })
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <Check size={13} strokeWidth={2} />
        Добавлено
      </span>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status === 'loading'}
      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition disabled:opacity-50"
    >
      {status === 'loading'
        ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
        : <CalendarPlus size={13} strokeWidth={1.5} />
      }
      В календарь
    </button>
  )
}
