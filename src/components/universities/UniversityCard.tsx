import Link from 'next/link'
import Image from 'next/image'
import { University } from '@/types/university'

function FlagImg({ code }: { code: string }) {
  const c = code.toLowerCase()
  return (
    <img
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w40/${c}.png 1x, https://flagcdn.com/w80/${c}.png 2x`}
      width={20}
      height={15}
      alt=""
      className="inline-block rounded-[2px] shrink-0"
      loading="lazy"
    />
  )
}

export default function UniversityCard({ university }: { university: University }) {
  const topRanking = university.rankings?.[0]

  const typeLabel: Record<string, string> = {
    national: 'Национальный',
    technical: 'Технический',
    private: 'Частный',
  }

  return (
    <Link href={`/universities/${university.id}`} className="group block h-full">
      <article className="card card-hover h-full flex flex-col overflow-hidden">

        {/* ── Photo / placeholder header ─────────────────────────────── */}
        {university.photo_url ? (
          <div className="relative h-44 shrink-0 overflow-hidden">
            <Image
              src={university.photo_url}
              alt={university.name}
              fill quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500 scale-[1.02] group-hover:scale-100"
            />
            {/* scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />

            {topRanking && (
              <div className="absolute top-4 right-4">
                <span className="t-label bg-black/60 backdrop-blur border border-white/10 px-2.5 py-1 rounded-full text-[10px] text-[var(--text-secondary)]">
                  #{topRanking.position} {topRanking.source?.name ?? 'QS'}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* No-photo: decorative gradient bar */
          <div className="relative h-24 shrink-0 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#111111] flex items-center justify-center">
            <span className="text-5xl opacity-10 select-none">🎓</span>
            {topRanking && (
              <div className="absolute top-4 right-4">
                <span className="t-label bg-black/60 backdrop-blur border border-white/10 px-2.5 py-1 rounded-full text-[10px] text-[var(--text-secondary)]">
                  #{topRanking.position} {topRanking.source?.name ?? 'QS'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-6 gap-3">

          {/* Location — label row */}
          <p className="t-label flex items-center gap-1.5">
            {university.country?.flag_icon && <FlagImg code={university.country.flag_icon} />}
            {[university.city?.name, university.country?.name].filter(Boolean).join(', ')}
          </p>

          {/* University name */}
          <h3 className="t-title group-hover:text-white/80 transition-colors">
            {university.name}
          </h3>

          {/* Short description */}
          {university.description_short && (
            <p className="t-body line-clamp-2 flex-1">
              {university.description_short}
            </p>
          )}

          {/* ── Tags ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 pt-1 mt-auto">
            {university.type && (
              <span className="t-label bg-white/[0.04] border border-[var(--border)] px-3 py-1 rounded-full normal-case tracking-normal text-[var(--text-tertiary)]">
                {typeLabel[university.type] ?? university.type}
              </span>
            )}
            {university.has_dormitory && (
              <span className="t-label bg-white/[0.04] border border-[var(--border)] px-3 py-1 rounded-full normal-case tracking-normal text-[var(--text-tertiary)]">
                Общежитие
              </span>
            )}
            {university.has_campus && (
              <span className="t-label bg-white/[0.04] border border-[var(--border)] px-3 py-1 rounded-full normal-case tracking-normal text-[var(--text-tertiary)]">
                Кампус
              </span>
            )}
            {university.campuses && university.campuses.length > 1 && (
              <span className="t-label normal-case tracking-normal text-[var(--text-quaternary)]">
                {university.campuses.map(c => c.country?.flag_icon
                  ? <FlagImg key={c.id} code={c.country.flag_icon} />
                  : null
                )}
              </span>
            )}
          </div>

        </div>
      </article>
    </Link>
  )
}
