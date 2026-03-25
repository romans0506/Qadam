'use client'
import { Country, Major } from '@/types/university'

interface Filters {
  region: '' | 'kazakhstan' | 'abroad'
  country_id: string
  major_id: string
  type: string
  has_dormitory: boolean
  has_campus: boolean
}

interface Props {
  filters: Filters
  countries: Country[]
  majors: Major[]
  onChange: (filters: Filters) => void
}

const selectClass = (active: boolean) => [
  'border rounded-pill px-4 py-2 text-sm focus:outline-none transition cursor-pointer',
  '[&>option]:bg-[#111111] [&>option]:text-[var(--text-primary)]',
  active
    ? '!bg-[var(--accent-soft)] !border-[var(--accent)]/50 !text-[var(--accent)] font-medium'
    : 'bg-[var(--bg-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
].join(' ')

const btnClass = (active: boolean) => `btn-secondary text-sm px-4 py-2 h-auto transition ${
  active
    ? '!bg-[var(--accent-soft)] !text-[var(--accent)] !border-[var(--accent)]/50 font-medium'
    : ''
}`

const RESET: Filters = { region: '', country_id: '', major_id: '', type: '', has_dormitory: false, has_campus: false }

export default function UniversityFilters({ filters, countries, majors, onChange }: Props) {
  const filteredCountries = countries.filter(c =>
    !filters.region || c.region === filters.region
  )

  const hasActive = filters.region || filters.country_id || filters.major_id ||
    filters.type || filters.has_dormitory || filters.has_campus

  return (
    <div className="flex flex-wrap gap-2 items-center">

      {/* Region — pill group */}
      {[
        { value: '' as const, label: 'Все' },
        { value: 'kazakhstan' as const, label: '🇰🇿 Казахстан' },
        { value: 'abroad' as const, label: '✈️ Зарубежные' },
      ].map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange({ ...filters, region: opt.value, country_id: '' })}
          className={btnClass(filters.region === opt.value)}
        >
          {opt.label}
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Country select */}
      {filteredCountries.length > 0 && (
        <select
          className={selectClass(!!filters.country_id)}
          value={filters.country_id}
          onChange={e => onChange({ ...filters, country_id: e.target.value })}
        >
          <option value="">Все страны</option>
          {filteredCountries.map(c => (
            <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>
          ))}
        </select>
      )}

      {/* Major select */}
      {majors.length > 0 && (
        <select
          className={selectClass(!!filters.major_id)}
          value={filters.major_id}
          onChange={e => onChange({ ...filters, major_id: e.target.value })}
        >
          <option value="">Все специальности</option>
          {majors.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Type select */}
      <select
        className={selectClass(!!filters.type)}
        value={filters.type}
        onChange={e => onChange({ ...filters, type: e.target.value })}
      >
        <option value="">Все типы</option>
        <option value="national">Национальные</option>
        <option value="technical">Технические</option>
        <option value="private">Частные</option>
      </select>

      {/* Dormitory toggle pill */}
      <button
        onClick={() => onChange({ ...filters, has_dormitory: !filters.has_dormitory })}
        className={btnClass(filters.has_dormitory)}
      >
        🏠 Общежитие
      </button>

      {/* Campus toggle pill */}
      <button
        onClick={() => onChange({ ...filters, has_campus: !filters.has_campus })}
        className={btnClass(filters.has_campus)}
      >
        🏛️ Кампус
      </button>

      {/* Reset */}
      {hasActive && (
        <button
          onClick={() => onChange(RESET)}
          className="t-label normal-case tracking-normal text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition ml-auto px-3 py-2"
        >
          Сбросить ✕
        </button>
      )}
    </div>
  )
}
