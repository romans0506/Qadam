'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUniversities, getCountries } from '@/services/universityService'
import { University, Country } from '@/types/university'
import UniversityCard from '@/components/universities/UniversityCard'
import UniversityFilters from '@/components/universities/UniversityFilters'

const PAGE_SIZE = 20

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    region: '' as '' | 'kazakhstan' | 'abroad',
    country_id: '',
    type: '',
    has_dormitory: false,
    has_campus: false,
  })

  useEffect(() => {
    getCountries().then(setCountries)
  }, [])

  const loadUniversities = useCallback(async (newOffset: number, replace: boolean) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    const data = await getUniversities({
      region: filters.region || undefined,
      country_id: filters.country_id || undefined,
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

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.country?.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.description_short?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Университеты</h1>
          <p className="text-blue-300">Найди свой университет мечты</p>
        </div>

        {/* Поиск */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Поиск по названию, городу, стране..."
            className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/40 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Фильтры */}
        <UniversityFilters filters={filters} countries={countries} onChange={setFilters} />

        {/* Счётчик */}
        {!loading && (
          <p className="text-blue-300 text-sm mt-4 mb-2">
            Показано: {universities.length} университетов
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-white">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p>Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white py-12">
            <p className="text-xl mb-2">Ничего не найдено</p>
            <p className="text-blue-300 text-sm mb-4">Попробуй другой запрос или сбрось фильтры</p>
            <button
              onClick={() => {
                setSearch('')
                setFilters({ region: '', country_id: '', type: '', has_dormitory: false, has_campus: false })
              }}
              className="bg-white text-blue-900 px-6 py-2 rounded-full font-medium hover:bg-blue-50"
            >
              Сбросить всё
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {filtered.map(uni => (
                <UniversityCard key={uni.id} university={uni} />
              ))}
            </div>

            {hasMore && !search && (
              <div className="text-center mt-6">
                <button
                  onClick={() => loadUniversities(offset, false)}
                  disabled={loadingMore}
                  className="bg-white text-blue-900 px-8 py-3 rounded-full font-medium hover:bg-blue-50 disabled:opacity-50 transition"
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
