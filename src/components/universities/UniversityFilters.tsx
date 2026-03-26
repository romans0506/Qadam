'use client'
import { Country, Major } from '@/types/university'
import CustomSelect from '@/components/ui/CustomSelect'

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
      <button
        onClick={() => onChange({ ...filters, region: '', country_id: '' })}
        className={btnClass(filters.region === '')}
      >
        Все
      </button>
      <button
        onClick={() => onChange({ ...filters, region: 'kazakhstan', country_id: '' })}
        className={`${btnClass(filters.region === 'kazakhstan')} flex items-center gap-1.5`}
      >
        <img src="https://flagcdn.com/w40/kz.png" width={16} height={12} alt="" className="rounded-[2px]" />
        Казахстан
      </button>
      <button
        onClick={() => onChange({ ...filters, region: 'abroad', country_id: '' })}
        className={btnClass(filters.region === 'abroad')}
      >
        ✈️ Зарубежные
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Country select */}
      {filteredCountries.length > 0 && (
        <CustomSelect
          value={filters.country_id}
          onChange={v => onChange({ ...filters, country_id: v })}
          placeholder="Все страны"
          className="w-44"
          options={[
            { value: '', label: 'Все страны' },
            ...filteredCountries.map(c => ({ value: c.id, label: c.name }))
          ]}
        />
      )}

      {/* Major select */}
      {majors.length > 0 && (
        <CustomSelect
          value={filters.major_id}
          onChange={v => onChange({ ...filters, major_id: v })}
          placeholder="Все специальности"
          className="w-52"
          options={[
            { value: '', label: 'Все специальности' },
            ...majors.map(m => ({ value: m.id, label: m.name }))
          ]}
        />
      )}

      {/* Type select */}
      <CustomSelect
        value={filters.type}
        onChange={v => onChange({ ...filters, type: v })}
        placeholder="Все типы"
        className="w-40"
        options={[
          { value: '', label: 'Все типы' },
          { value: 'national', label: 'Национальные' },
          { value: 'technical', label: 'Технические' },
          { value: 'private', label: 'Частные' },
        ]}
      />

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
