'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function CustomSelect({ value, options, onChange, placeholder = 'Выбрать...', disabled, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/[0.05] border rounded-xl px-3.5 py-2.5 text-sm text-left
          transition-all duration-200 outline-none
          ${open
            ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
            : 'border-white/10 hover:border-white/16 hover:bg-white/[0.06]'
          }
          ${disabled ? 'opacity-35 cursor-default' : 'cursor-pointer'}
        `}
      >
        <span className={selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-quaternary)]'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-[var(--text-tertiary)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`
                  w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left
                  transition-colors duration-100
                  ${opt.value === value
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {opt.label}
                {opt.value === value && <Check size={14} strokeWidth={2} className="text-[var(--accent)] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
