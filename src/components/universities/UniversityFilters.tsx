'use client'

interface Filters {
  region: '' | 'kazakhstan' | 'abroad'
  type: string
  has_dormitory: boolean
  has_campus: boolean
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function UniversityFilters({ filters, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg">
      <div className="flex flex-wrap gap-3 items-center">

        <div className="flex gap-2">
          {[
            { value: '', label: '🌍 Все' },
            { value: 'kazakhstan', label: '🇰🇿 Казахстан' },
            { value: 'abroad', label: '✈️ Зарубежные' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, region: opt.value as Filters['region'] })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filters.region === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          className="border rounded-full px-4 py-2 text-sm text-gray-700"
          value={filters.type}
          onChange={e => onChange({ ...filters, type: e.target.value })}
        >
          <option value="">Все типы</option>
          <option value="national">Национальные</option>
          <option value="technical">Технические</option>
          <option value="private">Частные</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.has_dormitory}
            onChange={e => onChange({ ...filters, has_dormitory: e.target.checked })}
            className="w-4 h-4"
          />
          Общежитие
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.has_campus}
            onChange={e => onChange({ ...filters, has_campus: e.target.checked })}
            className="w-4 h-4"
          />
          Кампус
        </label>

      </div>
    </div>
  )
}