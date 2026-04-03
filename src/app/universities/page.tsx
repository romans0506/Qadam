'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUniversities, getCountries, getMajors } from '@/services/universityService'
import { University, Country, Major } from '@/types/university'
import UniversityCard from '@/components/universities/UniversityCard'
import UniversityFilters from '@/components/universities/UniversityFilters'
import UniversitiesSubNav from '@/components/universities/UniversitiesSubNav'

const PAGE_SIZE = 20

const RESET_FILTERS = {
  region: '' as '' | 'kazakhstan' | 'abroad',
  country_id: '',
  major_id: '',
  type: '',
  has_dormitory: false,
  has_campus: false,
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(RESET_FILTERS)

  useEffect(() => {
    getCountries().then(setCountries)
    getMajors().then(setMajors)
  }, [])

  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

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
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      offset: newOffset,
    })

    if (replace) setUniversities(data)
    else setUniversities(prev => [...prev, ...data])

    setHasMore(data.length === PAGE_SIZE)
    setOffset(newOffset + data.length)
    setLoading(false)
    setLoadingMore(false)
  }, [filters, debouncedSearch])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    loadUniversities(0, true)
  }, [filters, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = universities

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-6xl mx-auto px-6 py-18">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="t-headline mb-2">Университеты</h1>
          <p className="t-body max-w-xl">
            Найди свой университет мечты — фильтруй по стране, специальности и условиям поступления.
          </p>
        </div>

        {/* ── Sub-nav ──────────────────────────────────────────────────── */}
        <UniversitiesSubNav active="list" />

        {/* ── Search ───────────────────────────────────────────────────── */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Поиск по названию, городу, стране..."
            className="inp pr-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
              aria-label="Очистить поиск"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="mb-12">
          <UniversityFilters filters={filters} countries={countries} majors={majors} onChange={setFilters} />
        </div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        {!loading && (
          <p className="t-label normal-case tracking-normal text-[var(--text-quaternary)] mb-6">
            {filtered.length} {filtered.length === 1 ? 'университет' : 'университетов'}
          </p>
        )}

        {/* ── States ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="t-body">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="t-title mb-2">Ничего не найдено</p>
            <p className="t-body mb-8">Попробуй другой запрос или сбрось фильтры</p>
            <button
              onClick={() => { setSearch(''); setFilters(RESET_FILTERS) }}
              className="btn-primary"
            >
              Сбросить всё
            </button>
          </div>
        ) : (
          <>
            {/* ── Grid ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map(uni => (
                <UniversityCard key={uni.id} university={uni} />
              ))}
            </div>

            {/* ── Load more ──────────────────────────────────────────────── */}
            {hasMore && !search && (
              <div className="text-center mt-16">
                <button
                  onClick={() => loadUniversities(offset, false)}
                  disabled={loadingMore}
                  className="btn-secondary disabled:opacity-40"
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
