'use client'
import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

interface Props {
  value: string          // yyyy-MM-dd
  onChange: (val: string) => void
  placeholder?: string
}

export default function DatePicker({ value, onChange, placeholder = 'Выбрать дату' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const selected = parsed && isValid(parsed) ? parsed : undefined

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(day: Date | undefined) {
    if (!day) return
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/[0.05] border rounded-xl px-3.5 py-2.5 text-sm text-left
          transition-all duration-200 outline-none
          ${open
            ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
            : 'border-white/10 hover:border-white/16 hover:bg-white/[0.06]'
          }
        `}
      >
        <span className={selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-quaternary)]'}>
          {selected ? format(selected, 'd MMMM yyyy', { locale: ru }) : placeholder}
        </span>
        <CalendarDays size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)] shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-1 duration-150">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={ru}
            defaultMonth={selected ?? new Date()}
            showOutsideDays
            classNames={{
              months:        'flex',
              month:         'space-y-3',
              month_caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-semibold text-[var(--text-primary)] capitalize',
              nav:           'flex items-center gap-1',
              button_previous: 'absolute left-1 top-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition',
              button_next:   'absolute right-1 top-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition',
              month_grid:    'w-full border-collapse',
              weekdays:      '',
              weekday:       'text-[var(--text-quaternary)] text-xs font-medium w-9 h-8',
              week:          '',
              day:           'p-0 text-center',
              day_button:    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition cursor-pointer',
              selected:      '[&_.rdp-day_button]:bg-[var(--accent)] [&_.rdp-day_button]:text-white [&_.rdp-day_button]:font-semibold [&_.rdp-day_button]:hover:bg-[var(--accent)]',
              today:         '[&_.rdp-day_button]:text-[var(--accent)] [&_.rdp-day_button]:font-bold',
              outside:       '[&_.rdp-day_button]:text-[var(--text-quaternary)] [&_.rdp-day_button]:opacity-40',
              disabled:      '[&_.rdp-day_button]:text-[var(--text-quaternary)] [&_.rdp-day_button]:opacity-20 [&_.rdp-day_button]:cursor-default',
              root:          'bg-[#1a1a1e] border border-white/10 rounded-xl p-4',
            }}
          />
        </div>
      )}
    </div>
  )
}
