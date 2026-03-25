'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUniversities, getCountries, getMajors } from '@/services/universityService'
import { University, Country, Major } from '@/types/university'
import UniversityCard from '@/components/universities/UniversityCard'
import UniversityFilters from '@/components/universities/UniversityFilters'

const PAGE_SIZE = 20

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    region: '' as '' | 'kazakhstan' | 'abroad',
    country_id: '',
    major_id: '',
    type: '',
    has_dormitory: false,
    has_campus: false,
  })

  useEffect(() => {
    getCountries().then(setCountries)
    getMajors().then(setMajors)
  }, [])

  const loadUniversities = useCallback(async (newOffset: number, replace: boolean) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    const data = await getUniversities({
      region: filters.region || undefined,
      country_id: filters.country_id || undefined,
      major_id: filters.major_id || undefined,
      type: filters.type || undefined,
      has_dormitory: filters.has_dormitory || undefined,
      has_campus: filters.has_campus || undefined,
      limit: PAGE_SIZE,
      offset: newOffset,
    })

    if (replace) {
      setUniversities(data)
    } else {
      setUniversities(prev => [...prev, ...data])
    }
    setHasMore(data.length === PAGE_SIZE)
    setOffset(newOffset + data.length)
    setLoading(false)
    setLoadingMore(false)
  }, [filters])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    loadUniversities(0, true)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Фильтрация по поиску на клиенте
  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.country?.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.description_short?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Университеты</h1>
          <p className="text-slate-500 text-sm">Найди свой университет мечты</p>
        </div>

        {/* Поиск */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Поиск по названию, городу, стране..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Фильтры */}
        <UniversityFilters filters={filters} countries={countries} majors={majors} onChange={setFilters} />

        {/* Счётчик результатов */}
        {!loading && (
          <p className="text-slate-600 text-xs mt-4 mb-2">
            {universities.length} университетов
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-300 text-lg mb-2">Ничего не найдено</p>
            <p className="text-slate-600 text-sm mb-6">Попробуй другой запрос или сбрось фильтры</p>
            <button
              onClick={() => { setSearch(''); setFilters({ region: '', country_id: '', major_id: '', type: '', has_dormitory: false, has_campus: false }) }}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-medium transition text-sm"
            >
              Сбросить всё
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {filtered.map(uni => (
                <UniversityCard key={uni.id} university={uni} />
              ))}
            </div>

            {hasMore && !search && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadUniversities(offset, false)}
                  disabled={loadingMore}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-8 py-2.5 rounded-xl font-medium disabled:opacity-40 transition text-sm"
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}