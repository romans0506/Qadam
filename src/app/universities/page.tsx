'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUniversities } from '@/services/universityService'
import { University } from '@/types/university'
import UniversityCard from '@/components/universities/UniversityCard'
import UniversityFilters from '@/components/universities/UniversityFilters'

const PAGE_SIZE = 20

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    region: '' as '' | 'kazakhstan' | 'abroad',
    type: '',
    has_dormitory: false,
    has_campus: false,
  })

  const loadUniversities = useCallback(async (newOffset: number, replace: boolean) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    const data = await getUniversities({
      region: filters.region || undefined,
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
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Университеты 🎓</h1>
          <p className="text-blue-200">Найди свой университет мечты</p>
        </div>

        {/* Поиск */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="🔍 Поиск по названию, городу, стране..."
            className="w-full bg-white rounded-2xl px-5 py-4 text-gray-800 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Фильтры */}
        <UniversityFilters filters={filters} onChange={setFilters} />

        {/* Счётчик результатов */}
        {!loading && (
          <p className="text-blue-200 text-sm mt-4 mb-2">
            Показано: {universities.length} университетов
          </p>
        )}

        {loading ? (
          <div className="text-center text-white py-12">
            <p className="text-xl">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white py-12">
            <p className="text-xl mb-2">Ничего не найдено</p>
            <p className="text-blue-200 text-sm">Попробуй другой запрос или сбрось фильтры</p>
            <button
              onClick={() => { setSearch(''); setFilters({ region: '', type: '', has_dormitory: false, has_campus: false }) }}
              className="mt-4 bg-white text-blue-900 px-6 py-2 rounded-full font-medium hover:bg-blue-50"
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