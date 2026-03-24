'use client'
import { useState } from 'react'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

const FIELDS = [
  { label: 'GPA', field: 'gpa', min: 1, max: 5, step: 0.1, placeholder: '1.0 — 5.0', isFloat: true },
  { label: 'ЕНТ', field: 'ent_score', min: 0, max: 140, step: 1, placeholder: '0 — 140', isFloat: false },
  { label: 'IELTS', field: 'ielts_score', min: 0, max: 9, step: 0.5, placeholder: '0 — 9.0', isFloat: true },
  { label: 'SAT', field: 'sat_score', min: 400, max: 1600, step: 10, placeholder: '400 — 1600', isFloat: false },
  { label: 'ACT', field: 'act_score', min: 1, max: 36, step: 1, placeholder: '1 — 36', isFloat: false },
  { label: 'TOEFL', field: 'toefl_score', min: 0, max: 120, step: 1, placeholder: '0 — 120', isFloat: false },
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
      setErrors(prev => ({ ...prev, [field]: `Допустимый диапазон: ${min} — ${max}` }))
    } else {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }

    onChange({ ...profile, [field]: val })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Академические показатели</h2>

      {/* Карточки показателей */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'GPA', value: profile.gpa, color: 'blue' },
          { label: 'ЕНТ', value: profile.ent_score, color: 'green' },
          { label: 'IELTS', value: profile.ielts_score, color: 'purple' },
          { label: 'SAT', value: profile.sat_score, color: 'orange' },
          { label: 'ACT', value: profile.act_score, color: 'red' },
          { label: 'TOEFL', value: profile.toefl_score, color: 'teal' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`text-center p-3 bg-${color}-50 rounded-xl`}>
            <p className={`text-xl font-bold text-${color}-600`}>{value || '—'}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Поля редактирования */}
      {editing && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-gray-500 text-sm font-medium">Редактировать показатели:</p>

          {FIELDS.map(({ label, field, min, max, step, placeholder, isFloat }) => (
            <div key={field}>
              <div className="flex items-center gap-3">
                <label className="w-16 text-gray-600 text-sm font-medium">{label}</label>
                <input
                  type="number"
                  min={min} max={max} step={step}
                  className={`flex-1 border rounded-lg p-2 text-gray-800 ${errors[field] ? 'border-red-400 focus:ring-red-300' : ''}`}
                  placeholder={placeholder}
                  value={profile[field as keyof UserProfile] as number || ''}
                  onChange={e => handleChange(field, min, max, isFloat, e.target.value)}
                />
              </div>
              {errors[field] && (
                <p className="text-red-500 text-xs mt-1 ml-20">{errors[field]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}