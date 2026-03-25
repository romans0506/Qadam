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

const selectClass = 'bg-white/5 border border-white/10 text-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition [&>option]:bg-[#0f1629] [&>option]:text-white'

export default function UniversityFilters({ filters, countries, majors, onChange }: Props) {
  const filteredCountries = countries.filter(c =>
    !filters.region || c.region === filters.region
  )

  const hasActive = filters.region || filters.country_id || filters.major_id || filters.type || filters.has_dormitory || filters.has_campus

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex flex-wrap gap-2 items-center">

        {/* Region pills */}
        <div className="flex gap-1.5">
          {[
            { value: '', label: 'Все' },
            { value: 'kazakhstan', label: '🇰🇿 Казахстан' },
            { value: 'abroad', label: '✈️ Зарубежные' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, region: opt.value as Filters['region'], country_id: '' })}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                filters.region === opt.value
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Country */}
        {filteredCountries.length > 0 && (
          <select
            className={selectClass}
            value={filters.country_id}
            onChange={e => onChange({ ...filters, country_id: e.target.value })}
          >
            <option value="">Все страны</option>
            {filteredCountries.map(c => (
              <option key={c.id} value={c.id}>
                {c.flag_icon} {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Major */}
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

        {/* Type */}
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

        {/* Checkboxes */}
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition">
          <input
            type="checkbox"
            checked={filters.has_dormitory}
            onChange={e => onChange({ ...filters, has_dormitory: e.target.checked })}
            className="w-4 h-4 rounded accent-indigo-500"
          />
          Общежитие
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition">
          <input
            type="checkbox"
            checked={filters.has_campus}
            onChange={e => onChange({ ...filters, has_campus: e.target.checked })}
            className="w-4 h-4 rounded accent-indigo-500"
          />
          Кампус
        </label>

        {hasActive && (
          <button
            onClick={() => onChange({ region: '', country_id: '', major_id: '', type: '', has_dormitory: false, has_campus: false })}
            className="ml-auto text-xs text-slate-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
