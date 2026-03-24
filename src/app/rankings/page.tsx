'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface RankedUniversity {
  id: string
  name: string
  photo_url: string | null
  country: { name: string; flag_icon: string | null } | null
  city: { name: string } | null
  ranking: {
    position: number
    year: number
    source: { id: string; name: string; website_url: string | null }
  }
}

interface RankingSource {
  id: string
  name: string
  website_url: string | null
}

export default function RankingsPage() {
  const [universities, setUniversities] = useState<RankedUniversity[]>([])
  const [sources, setSources] = useState<RankingSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSources()
  }, [])

  useEffect(() => {
    loadRankings()
  }, [selectedSource, selectedYear])

  async function loadSources() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase.from('ranking_sources').select('*').order('name')
    const list = data ?? []
    setSources(list)
    if (list.length > 0) setSelectedSource(list[0].id)
  }

  async function loadRankings() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()

    let query = supabase
      .from('university_rankings')
      .select(`
        position, year,
        source:ranking_sources(id, name, website_url),
        university:universities(
          id, name, photo_url,
          country:countries!main_country_id(name, flag_icon),
          city:cities!main_city_id(name)
        )
      `)
      .order('position', { ascending: true })
      .limit(100)

    if (selectedSource) query = query.eq('ranking_source_id', selectedSource)
    if (selectedYear) query = query.eq('year', parseInt(selectedYear))

    const { data } = await query
    const list = (data ?? []).map((r: any) => ({
      id: r.university.id,
      name: r.university.name,
      photo_url: r.university.photo_url,
      country: r.university.country,
      city: r.university.city,
      ranking: { position: r.position, year: r.year, source: r.source },
    }))
    setUniversities(list)
    setLoading(false)
  }

  const years = Array.from(new Set(
    universities.map(u => u.ranking.year)
  )).sort((a, b) => b - a)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Рейтинги университетов</h1>
          <p className="text-blue-300">Мировые и национальные рейтинги из авторитетных источников</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Источник */}
          <div className="flex flex-wrap gap-2">
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(s.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedSource === s.id
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-blue-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Год */}
          {years.length > 1 && (
            <select
              className="bg-white/10 border border-white/20 text-white rounded-full px-4 py-2 text-sm"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              <option value="">Все годы</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {selectedSource && sources.find(s => s.id === selectedSource)?.website_url && (
            <a
              href={sources.find(s => s.id === selectedSource)!.website_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 text-blue-300 hover:text-white text-sm px-4 py-2 rounded-full border border-white/10 transition ml-auto"
            >
              Официальный сайт ↗
            </a>
          )}
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-white">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p>Загрузка...</p>
          </div>
        ) : universities.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-blue-300">
            <p className="text-lg mb-1">Нет данных</p>
            <p className="text-sm opacity-70">Выбери другой источник рейтинга</p>
          </div>
        ) : (
          <div className="space-y-2">
            {universities.map((uni, index) => (
              <Link key={`${uni.id}-${index}`} href={`/universities/${uni.id}`}>
                <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition group">

                  {/* Позиция */}
                  <div className={`w-12 text-center font-bold text-lg shrink-0 ${
                    uni.ranking.position <= 10 ? 'text-yellow-400' :
                    uni.ranking.position <= 50 ? 'text-blue-300' :
                    'text-white/50'
                  }`}>
                    #{uni.ranking.position}
                  </div>

                  {/* Фото */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                    {uni.photo_url ? (
                      <Image src={uni.photo_url} alt={uni.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🎓</div>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-blue-300 transition truncate">{uni.name}</p>
                    <p className="text-blue-300/70 text-sm">
                      {uni.country?.flag_icon} {uni.city?.name && `${uni.city.name}, `}{uni.country?.name}
                    </p>
                  </div>

                  {/* Год */}
                  <div className="text-white/30 text-sm shrink-0">{uni.ranking.year}</div>

                  <div className="text-white/30 group-hover:text-white/60 transition shrink-0">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
