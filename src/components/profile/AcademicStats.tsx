'use client'
import { useState } from 'react'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

const FIELDS = [
  { label: 'GPA', field: 'gpa', min: 0, max: 4, step: 0.1, placeholder: '0 — 4.0', isFloat: true },
  { label: 'ЕНТ', field: 'ent_score', min: 0, max: 140, step: 1, placeholder: '0 — 140', isFloat: false },
  { label: 'IELTS', field: 'ielts_score', min: 0, max: 9, step: 0.5, placeholder: '0 — 9.0', isFloat: true },
  { label: 'SAT', field: 'sat_score', min: 400, max: 1600, step: 10, placeholder: '400 — 1600', isFloat: false },
  { label: 'ACT', field: 'act_score', min: 1, max: 36, step: 1, placeholder: '1 — 36', isFloat: false },
  { label: 'TOEFL', field: 'toefl_score', min: 0, max: 120, step: 1, placeholder: '0 — 120', isFloat: false },
]

const STAT_COLORS = [
  'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
  'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
  'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
]

export default function AcademicStats({ profile, editing, onChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleChange(field: string, min: number, max: number, isFloat: boolean, raw: string) {
    if (raw === '') {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
      onChange({ ...profile, [field]: undefined })
      return
    }
    const val = isFloat ? parseFloat(raw) : parseInt(raw)
    if (isNaN(val)) return
    if (val < min || val > max) {
      setErrors(prev => ({ ...prev, [field]: `${min} — ${max}` }))
      return   // ← block saving out-of-range values
    }
    const newErrors = { ...errors }
    delete newErrors[field]
    setErrors(newErrors)
    onChange({ ...profile, [field]: val })
  }

  const stats = [
    { label: 'GPA', value: profile.gpa },
    { label: 'ЕНТ', value: profile.ent_score },
    { label: 'IELTS', value: profile.ielts_score },
    { label: 'SAT', value: profile.sat_score },
    { label: 'ACT', value: profile.act_score },
    { label: 'TOEFL', value: profile.toefl_score },
  ]

  return (
    <div className="card p-6 mt-4">
      <h2 className="t-label mb-4">Академические показатели</h2>

      {/* Bento stat grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.map(({ label, value }, i) => (
          <div key={label} className={`bg-gradient-to-br ${STAT_COLORS[i]} border rounded-xl p-3 text-center`}>
            <p className="text-lg font-bold">{value ?? '—'}</p>
            <p className="text-[var(--text-quaternary)] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit fields */}
      {editing && (
        <div className="space-y-2.5 border-t border-[var(--border)] pt-4">
          <p className="form-hint mb-3">Введи свои результаты:</p>
          {FIELDS.map(({ label, field, min, max, step, placeholder, isFloat }) => (
            <div key={field}>
              <div className="flex items-center gap-3">
                <span className="w-14 form-label mb-0 shrink-0">{label}</span>
                <input
                  type="number" min={min} max={max} step={step}
                  placeholder={placeholder}
                  value={profile[field as keyof UserProfile] as number || ''}
                  onChange={e => handleChange(field, min, max, isFloat, e.target.value)}
                  className={`inp flex-1 ${
                    errors[field] ? '!border-red-500/50 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''
                  }`}
                />
              </div>
              {errors[field] && (
                <p className="text-red-400 text-xs mt-1 pl-[68px]">Диапазон: {errors[field]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
