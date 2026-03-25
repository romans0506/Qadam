import Link from 'next/link'
import Image from 'next/image'
import { getUniversityById } from '@/services/universityService'
import SaveUniversityButton from '@/components/universities/SaveUniversityButton'

type PageProps = {
  params: Promise<{ id: string }>
}

const typeLabel: Record<string, string> = {
  national: 'Национальный',
  technical: 'Технический',
  private: 'Частный',
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params
  const university = await getUniversityById(id)

  if (!university) {
    return (
      <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 text-lg mb-4">Университет не найден</p>
        <Link href="/universities" className="text-indigo-400 hover:text-indigo-300 text-sm transition">
          ← К списку университетов
        </Link>
      </main>
    )
  }

  const topRanking = university.rankings?.[0]

  return (
    <main className="min-h-screen bg-[#030712]">

      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {university.photo_url ? (
          <Image src={university.photo_url} alt={university.name} fill className="object-cover opacity-50" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-violet-900/20" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/60 to-transparent" />
        {/* Back link */}
        <Link href="/universities"
          className="absolute top-5 left-6 text-xs text-slate-400 hover:text-white bg-black/30 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 transition">
          ← Назад
        </Link>
        {/* Rank badge */}
        {topRanking && (
          <div className="absolute top-5 right-6 bg-indigo-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            #{topRanking.position} {topRanking.source?.name ?? 'QS'}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-10 pb-16">

        {/* Header card */}
        <div className="bg-[#030712]/80 backdrop-blur border border-white/[0.08] rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">{university.name}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {university.country?.flag_icon}{' '}
                {[university.city?.name, university.country?.name].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {university.description_full && (
            <p className="text-slate-400 text-sm leading-relaxed mb-5">{university.description_full}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {university.type && (
              <span className="bg-white/5 border border-white/10 text-slate-400 text-xs px-3 py-1.5 rounded-lg">
                {typeLabel[university.type] ?? university.type}
              </span>
            )}
            {university.has_dormitory && (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-lg">
                Общежитие
              </span>
            )}
            {university.has_campus && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-lg">
                Кампус
              </span>
            )}
            {university.website_url && (
              <a href={university.website_url} target="_blank" rel="noopener noreferrer"
                className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs px-3 py-1.5 rounded-lg transition">
                Официальный сайт ↗
              </a>
            )}
          </div>

          <SaveUniversityButton universityId={university.id} universityName={university.name} />
        </div>

        {/* Rankings */}
        {university.rankings && university.rankings.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Рейтинги</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {university.rankings.map(r => (
                <div key={r.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-400">#{r.position}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{r.source?.name ?? 'Рейтинг'}</p>
                  <p className="text-slate-600 text-xs">{r.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admission requirements */}
        {university.majors && university.majors.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Требования к поступлению</h2>
            <div className="space-y-3">
              {university.majors.map(um => (
                <div key={um.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm">{um.major?.name}</h3>
                    {um.degree_level && (
                      <span className="bg-white/5 border border-white/10 text-slate-400 text-xs px-2.5 py-1 rounded-lg">
                        {um.degree_level}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                    {um.required_ent && (
                      <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                        <span className="text-amber-400">ЕНТ</span> {um.required_ent}+
                      </div>
                    )}
                    {um.required_gpa && (
                      <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                        <span className="text-indigo-400">GPA</span> {um.required_gpa}+
                      </div>
                    )}
                    {um.required_sat && (
                      <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                        <span className="text-violet-400">SAT</span> {um.required_sat}+
                      </div>
                    )}
                    {um.budget_places && (
                      <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                        <span className="text-emerald-400">Грант</span> {um.budget_places} мест
                      </div>
                    )}
                    {um.paid_places && (
                      <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-400">Платно</span> {um.paid_places} мест
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campuses */}
        {university.campuses && university.campuses.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Кампусы</h2>
            <div className="space-y-2">
              {university.campuses.map(campus => (
                <div key={campus.id} className="flex items-center gap-3 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-xl">{campus.country?.flag_icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{campus.country?.name}</p>
                    {campus.address && <p className="text-slate-500 text-xs mt-0.5">{campus.address}</p>}
                  </div>
                  {campus.is_main && (
                    <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg">
                      Главный
                    </span>
                  )}
                  {campus.has_dormitory && (
                    <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg">
                      Общежитие
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
