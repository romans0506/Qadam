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

const selectClass = [
  'bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-secondary)]',
  'rounded-pill px-4 py-2 text-sm focus:outline-none transition cursor-pointer',
  'focus:border-[var(--border-strong)] hover:border-[var(--border-strong)]',
  '[&>option]:bg-[#111111] [&>option]:text-[var(--text-primary)]',
].join(' ')

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
          className={`btn-secondary text-sm px-4 py-2 h-auto ${
            filters.region === opt.value
              ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
              : ''
          }`}
        >
          {opt.label}
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Country select */}
      {filteredCountries.length > 0 && (
        <select
          className={selectClass}
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
          className={selectClass}
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
        className={selectClass}
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
        className={`btn-secondary text-sm px-4 py-2 h-auto ${
          filters.has_dormitory
            ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
            : ''
        }`}
      >
        Общежитие
      </button>

      {/* Campus toggle pill */}
      <button
        onClick={() => onChange({ ...filters, has_campus: !filters.has_campus })}
        className={`btn-secondary text-sm px-4 py-2 h-auto ${
          filters.has_campus
            ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
            : ''
        }`}
      >
        Кампус
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
