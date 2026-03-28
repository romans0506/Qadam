'use client'
import { useState } from 'react'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

/* ── Field definitions ──────────────────────────────────────── */
interface FieldDef {
  label: string
  field: string
  min: number
  max: number
  step: number      // 1 = integer, 0.1 / 0.5 = decimal
  maxLen: number     // max chars user can type
  placeholder: string
}

const FIELDS: FieldDef[] = [
  { label: 'GPA',   field: 'gpa',         min: 0,   max: 4,    step: 0.1, maxLen: 3, placeholder: '0.0 – 4.0' },
  { label: 'ЕНТ',   field: 'ent_score',   min: 0,   max: 140,  step: 1,   maxLen: 3, placeholder: '0 – 140' },
  { label: 'IELTS', field: 'ielts_score',  min: 0,   max: 9,    step: 0.5, maxLen: 3, placeholder: '0.0 – 9.0' },
  { label: 'SAT',   field: 'sat_score',    min: 400, max: 1600, step: 1,   maxLen: 4, placeholder: '400 – 1600' },
  { label: 'ACT',   field: 'act_score',    min: 1,   max: 36,   step: 1,   maxLen: 2, placeholder: '1 – 36' },
  { label: 'TOEFL', field: 'toefl_score',  min: 0,   max: 120,  step: 1,   maxLen: 3, placeholder: '0 – 120' },
]

const STAT_COLORS = [
  'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
  'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
  'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
]

/* ── Display formatter ──────────────────────────────────────── */
function formatDisplay(field: string, value: number): string {
  if (field === 'gpa' || field === 'ielts_score') return value.toFixed(1)
  return String(value)
}

export default function AcademicStats({ profile, editing, onChange }: Props) {
  // Local raw text per field (for typing intermediate values like "1" for SAT)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  function set(field: string, value: number | undefined) {
    onChange({ ...profile, [field]: value })
  }

  /* ── onChange: allow typing, filter invalid chars ─────────── */
  function handleInput(f: FieldDef, raw: string) {
    const isDecimal = f.step < 1

    // Allow only digits (and one dot for decimal fields)
    let cleaned: string
    if (isDecimal) {
      // Strip everything except digits and first dot
      cleaned = ''
      let hasDot = false
      for (const ch of raw) {
        if (ch >= '0' && ch <= '9') { cleaned += ch }
        else if (ch === '.' && !hasDot) { cleaned += '.'; hasDot = true }
      }
      // Limit: max 1 digit before dot, max 1 digit after dot
      const parts = cleaned.split('.')
      if (parts[0].length > 1) parts[0] = parts[0].slice(0, 1)
      if (parts.length > 1 && parts[1].length > 1) parts[1] = parts[1].slice(0, 1)
      cleaned = parts.join('.')
    } else {
      // Integer: digits only, limit length
      cleaned = raw.replace(/\D/g, '').slice(0, f.maxLen)
    }

    // Save draft for display
    setDrafts(prev => ({ ...prev, [f.field]: cleaned }))

    // Parse and store the number
    if (cleaned === '' || cleaned === '.') {
      set(f.field, undefined)
      return
    }

    const num = parseFloat(cleaned)
    if (isNaN(num)) { set(f.field, undefined); return }

    // Clamp to max on the fly (but don't clamp to min — user might still be typing)
    if (num > f.max) {
      set(f.field, f.max)
      setDrafts(prev => ({ ...prev, [f.field]: String(f.max) }))
      return
    }

    set(f.field, num)
  }

  /* ── onBlur: snap to step, clamp to min, clean up ────────── */
  function handleBlur(f: FieldDef) {
    const current = profile[f.field as keyof UserProfile] as number | undefined
    setDrafts(prev => { const n = { ...prev }; delete n[f.field]; return n })

    if (current == null) return

    let val = current

    // Clamp to range
    if (val < f.min) val = f.min
    if (val > f.max) val = f.max

    // Snap to step
    if (f.step === 0.5) {
      val = Math.round(val * 2) / 2
    } else if (f.step === 0.1) {
      val = Math.round(val * 10) / 10
    } else {
      val = Math.round(val)
    }

    set(f.field, val)
  }

  /* ── What to show in the input ───────────────────────────── */
  function inputValue(f: FieldDef): string {
    // If user is actively typing, show draft
    if (f.field in drafts) return drafts[f.field]
    // Otherwise show stored value
    const v = profile[f.field as keyof UserProfile] as number | undefined
    if (v == null) return ''
    return f.step < 1 ? v.toFixed(1) : String(v)
  }

  const stats = FIELDS.map(f => ({
    label: f.label,
    value: profile[f.field as keyof UserProfile] as number | undefined,
    field: f.field,
  }))

  return (
    <div className="card p-6 mt-4">
      <h2 className="t-label mb-4">Академические показатели</h2>

      {/* Bento stat grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.map(({ label, value, field }, i) => (
          <div key={label} className={`bg-gradient-to-br ${STAT_COLORS[i]} border rounded-xl p-3 text-center`}>
            <p className="text-lg font-bold">
              {value != null ? formatDisplay(field, value) : '—'}
            </p>
            <p className="text-[var(--text-quaternary)] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit fields */}
      {editing && (
        <div className="space-y-2.5 border-t border-[var(--border)] pt-4">
          <p className="form-hint mb-3">Введи свои результаты:</p>

          {FIELDS.map(f => (
            <div key={f.field} className="flex items-center gap-3">
              <span className="w-14 form-label mb-0 shrink-0">{f.label}</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder={f.placeholder}
                value={inputValue(f)}
                onChange={e => handleInput(f, e.target.value)}
                onBlur={() => handleBlur(f)}
                className="inp flex-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
