'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

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

  const activeSource = sources.find(s => s.id === selectedSource)

  return (
    <main className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Рейтинги</h1>
          <p className="text-slate-500 text-sm">Мировые и национальные рейтинги из авторитетных источников</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                  selectedSource === s.id
                    ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {years.length > 1 && (
            <select
              className="bg-white/5 border border-white/10 text-slate-300 rounded-xl px-4 py-1.5 text-sm focus:outline-none [&>option]:bg-[#0f1629]"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              <option value="">Все годы</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {activeSource?.website_url && (
            <a
              href={activeSource.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-slate-500 hover:text-indigo-400 transition flex items-center gap-1"
            >
              Официальный сайт ↗
            </a>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Загрузка...</p>
          </div>
        ) : universities.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg mb-1">Нет данных</p>
            <p className="text-slate-600 text-sm">Выбери другой источник рейтинга</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {universities.map((uni, index) => (
              <motion.div
                key={`${uni.id}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.015 }}
              >
                <Link href={`/universities/${uni.id}`}>
                  <div className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/20 rounded-xl p-3.5 transition group">

                    {/* Position */}
                    <div className={`w-10 text-center font-bold text-sm shrink-0 ${
                      uni.ranking.position <= 10 ? 'text-amber-400' :
                      uni.ranking.position <= 50 ? 'text-indigo-400' :
                      'text-slate-600'
                    }`}>
                      #{uni.ranking.position}
                    </div>

                    {/* Photo */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {uni.photo_url ? (
                        <Image src={uni.photo_url} alt={uni.name} width={36} height={36} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base opacity-20">🎓</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium group-hover:text-indigo-300 transition truncate">{uni.name}</p>
                      <p className="text-slate-600 text-xs">
                        {uni.country?.flag_icon} {[uni.city?.name, uni.country?.name].filter(Boolean).join(', ')}
                      </p>
                    </div>

                    <div className="text-slate-700 text-xs shrink-0">{uni.ranking.year}</div>
                    <div className="text-slate-700 group-hover:text-slate-400 transition shrink-0 text-sm">→</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
