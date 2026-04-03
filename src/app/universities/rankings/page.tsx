'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2, ExternalLink, ChevronRight } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'
import UniversitiesSubNav from '@/components/universities/UniversitiesSubNav'

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

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const rowItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function RankingsPage() {
  const [universities, setUniversities] = useState<RankedUniversity[]>([])
  const [sources, setSources] = useState<RankingSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSources() }, [])
  useEffect(() => { loadRankings() }, [selectedSource, selectedYear])

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

  const years = Array.from(new Set(universities.map(u => u.ranking.year))).sort((a, b) => b - a)
  const activeSource = sources.find(s => s.id === selectedSource)

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-6 py-18">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="t-headline mb-2">Университеты</h1>
          <p className="t-body">Найди свой университет мечты или посмотри мировые рейтинги.</p>
        </div>

        {/* ── Sub-nav ──────────────────────────────────────────────────── */}
        <UniversitiesSubNav active="rankings" />

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-12">
          <div className="flex flex-wrap gap-2">
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(s.id)}
                className={`btn-secondary text-sm px-4 py-2 h-auto ${
                  selectedSource === s.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
                    : ''
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {years.length > 1 && (
            <CustomSelect
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Все годы"
              className="w-36"
              options={[
                { value: '', label: 'Все годы' },
                ...years.map(y => ({ value: String(y), label: String(y) }))
              ]}
            />
          )}

          {activeSource?.website_url && (
            <a
              href={activeSource.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 t-label normal-case tracking-normal text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
            >
              <ExternalLink size={12} strokeWidth={1.5} />
              Официальный сайт
            </a>
          )}
        </div>

        {/* ── States ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 size={18} strokeWidth={1.5} className="text-[var(--accent)] animate-spin" />
            <p className="t-body">Загрузка...</p>
          </div>
        ) : universities.length === 0 ? (
          <div className="card-glass p-16 text-center">
            <p className="t-title text-[var(--text-secondary)] mb-2">Нет данных</p>
            <p className="t-body text-sm">Выбери другой источник рейтинга</p>
          </div>
        ) : (
          <motion.div
            key={`${selectedSource}-${selectedYear}`}
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {universities.map((uni, index) => {
              const pos = uni.ranking.position
              const rankColor =
                pos <= 10 ? 'text-amber-400/20' :
                pos <= 50 ? 'text-[var(--accent)]/15' :
                'text-white/[0.04]'

              return (
                <motion.div key={`${uni.id}-${index}`} variants={rowItem}>
                  <Link href={`/universities/${uni.id}`} className="group block">
                    <div className="card card-hover relative overflow-hidden flex items-center gap-5 p-5">
                      <span className={`absolute right-5 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none tabular-nums ${rankColor}`}
                        style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                        {String(pos).padStart(2, '0')}
                      </span>

                      <div className="shrink-0 w-12 text-right">
                        <span className={`font-bold tabular-nums text-lg leading-none ${
                          pos <= 10 ? 'text-amber-400' :
                          pos <= 50 ? 'text-[var(--accent)]' :
                          'text-[var(--text-tertiary)]'
                        }`}>
                          {pos}
                        </span>
                      </div>

                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-raised)] border border-[var(--border)] shrink-0">
                        {uni.photo_url ? (
                          <Image src={uni.photo_url} alt={uni.name} width={44} height={44} className="object-cover w-full h-full opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-20">🎓</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 relative z-10">
                        <p className="t-title text-base group-hover:text-white transition-colors truncate">{uni.name}</p>
                        <p className="t-label normal-case tracking-normal text-[var(--text-tertiary)] mt-1 truncate flex items-center gap-1.5">
                          {uni.country?.flag_icon && (
                            <img src={`https://flagcdn.com/w40/${uni.country.flag_icon.toLowerCase()}.png`} width={16} height={12} alt="" className="inline-block rounded-[2px] shrink-0" />
                          )}
                          {[uni.city?.name, uni.country?.name].filter(Boolean).join(', ')}
                        </p>
                      </div>

                      <div className="shrink-0 relative z-10 text-right hidden sm:block">
                        <p className="t-label">{uni.ranking.source?.name}</p>
                        <p className="t-label text-[var(--text-quaternary)] mt-0.5">{uni.ranking.year}</p>
                      </div>

                      <ChevronRight size={16} strokeWidth={1.2} className="shrink-0 text-[var(--text-quaternary)] group-hover:text-[var(--text-secondary)] transition relative z-10" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}

      </div>
    </main>
  )
}
