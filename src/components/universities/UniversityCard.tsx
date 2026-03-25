import Link from 'next/link'
import Image from 'next/image'
import { University } from '@/types/university'

export default function UniversityCard({ university }: { university: University }) {
  const topRanking = university.rankings?.[0]

  const typeLabel: Record<string, string> = {
    national: 'Национальный',
    technical: 'Технический',
    private: 'Частный',
  }

  return (
    <Link href={`/universities/${university.id}`} className="group block h-full">
      <div className="relative h-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] hover:-translate-y-0.5">

        {/* Photo header */}
        {university.photo_url ? (
          <div className="relative h-32 overflow-hidden">
            <Image
              src={university.photo_url}
              alt={university.name}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
            {topRanking && (
              <div className="absolute top-3 right-3 bg-indigo-500/90 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                #{topRanking.position}
                {topRanking.source?.name ? ` ${topRanking.source.name}` : ''}
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-end px-5 pb-3">
            <span className="text-4xl opacity-30">🎓</span>
            {topRanking && (
              <div className="absolute top-3 right-3 bg-indigo-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                #{topRanking.position}
              </div>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Name + location */}
          <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-300 transition-colors mb-1">
            {university.name}
          </h3>
          <p className="text-slate-500 text-sm">
            {university.country?.flag_icon}{' '}
            {[university.city?.name, university.country?.name].filter(Boolean).join(', ')}
          </p>

          {/* Description */}
          {university.description_short && (
            <p className="text-slate-400 text-xs mt-3 line-clamp-2 leading-relaxed">
              {university.description_short}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {university.type && (
              <span className="bg-white/5 border border-white/10 text-slate-400 text-xs px-2.5 py-1 rounded-lg">
                {typeLabel[university.type] ?? university.type}
              </span>
            )}
            {university.has_dormitory && (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-lg">
                Общежитие
              </span>
            )}
            {university.has_campus && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-lg">
                Кампус
              </span>
            )}
            {university.campuses && university.campuses.length > 1 && (
              <span className="text-slate-500 text-xs px-1">
                {university.campuses.map(c => c.country?.flag_icon).filter(Boolean).join(' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
