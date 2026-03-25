import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Trophy, GraduationCap, Building2, Globe, ArrowLeft } from 'lucide-react'
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

const degreeLabel: Record<string, string> = {
  bachelor: 'Бакалавриат',
  master: 'Магистратура',
  phd: 'Докторантура',
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params
  const university = await getUniversityById(id)

  if (!university) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 gap-4">
        <p className="t-title text-[var(--text-secondary)]">Университет не найден</p>
        <Link href="/universities" className="btn-secondary text-sm">
          ← К списку университетов
        </Link>
      </main>
    )
  }

  const topRanking = university.rankings?.[0]
  const location = [university.city?.name, university.country?.name].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative h-[55vh] min-h-[400px] max-h-[640px] overflow-hidden">

        {university.photo_url ? (
          <Image
            src={university.photo_url}
            alt={university.name}
            fill
            priority
            className="object-cover scale-[1.02]"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#0a0a12] to-[var(--bg-base)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/60 via-transparent to-[var(--bg-base)]/20" />

        {/* Back — aligned to the same left edge as content */}
        <div className="absolute top-6 inset-x-0">
          <div className="max-w-6xl mx-auto px-6">
            <Link
              href="/universities"
              className="inline-flex items-center gap-1.5 card-glass px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              Назад
            </Link>
          </div>
        </div>

        {/* Rank badge */}
        {topRanking && (
          <div className="absolute top-6 right-6 card-glass px-3.5 py-2">
            <span className="t-label text-[var(--text-primary)]">
              #{topRanking.position} {topRanking.source?.name ?? 'QS'}
            </span>
          </div>
        )}
      </div>

      {/* ── Content — strict max-w-6xl grid ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">

        {/* Identity — overlaps hero */}
        <div className="-mt-24 relative z-10 mb-16">
          <h1 className="t-hero mb-8">{university.name}</h1>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-x-12 gap-y-5">
            {topRanking && (
              <div>
                <p className="t-headline text-[var(--text-primary)] leading-none">#{topRanking.position}</p>
                <p className="t-label mt-1.5">{topRanking.source?.name ?? 'QS'} {topRanking.year}</p>
              </div>
            )}
            {location && (
              <div>
                <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-none flex items-center gap-2">
                  {university.country?.flag_icon}
                  {university.city?.name ?? university.country?.name}
                </p>
                <p className="t-label mt-1.5 flex items-center gap-1">
                  <MapPin size={10} strokeWidth={1.5} />
                  {location}
                </p>
              </div>
            )}
            {university.type && (
              <div>
                <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-none">
                  {typeLabel[university.type] ?? university.type}
                </p>
                <p className="t-label mt-1.5">Тип учреждения</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main content grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 pb-32">

          {/* Left column */}
          <div className="flex flex-col gap-8">

            {/* Description */}
            {university.description_full && (
              <div className="card p-10">
                <p className="t-body leading-loose">{university.description_full}</p>

                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-[var(--border)]">
                  {university.has_dormitory && (
                    <span className="btn-secondary text-xs px-4 py-2 h-auto cursor-default">
                      🏠 Общежитие
                    </span>
                  )}
                  {university.has_campus && (
                    <span className="btn-secondary text-xs px-4 py-2 h-auto cursor-default">
                      🏛️ Кампус
                    </span>
                  )}
                  {university.campuses && university.campuses.length > 1 && (
                    <span className="btn-secondary text-xs px-4 py-2 h-auto cursor-default">
                      🌍 {university.campuses.length} кампуса
                    </span>
                  )}
                  {university.website_url && (
                    <a
                      href={university.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-4 py-2 h-auto flex items-center gap-1.5"
                    >
                      <Globe size={12} strokeWidth={1.5} />
                      Официальный сайт
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Rankings */}
            {university.rankings && university.rankings.length > 0 && (
              <div className="card p-10">
                <div className="flex items-center gap-2 mb-8">
                  <Trophy size={15} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
                  <span className="t-label">Мировые рейтинги</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {university.rankings.map(r => (
                    <div key={r.id} className="card-glass p-6 text-center rounded-[var(--radius-inner)]">
                      <p className="t-headline text-[var(--text-primary)] leading-none">#{r.position}</p>
                      <p className="t-label mt-2.5">{r.source?.name ?? 'Рейтинг'}</p>
                      {r.year && <p className="t-label mt-1 text-[var(--text-quaternary)]">{r.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Majors / Admission */}
            {university.majors && university.majors.length > 0 && (
              <div className="card p-10">
                <div className="flex items-center gap-2 mb-8">
                  <GraduationCap size={15} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
                  <span className="t-label">Требования к поступлению</span>
                </div>
                <div className="flex flex-col gap-5">
                  {university.majors.map(um => (
                    <div key={um.id} className="card-glass rounded-[var(--radius-inner)] p-6">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <h3 className="t-title">{um.major?.name}</h3>
                        {um.degree_level && (
                          <span className="btn-secondary text-xs px-3 py-1.5 h-auto cursor-default shrink-0">
                            {degreeLabel[um.degree_level] ?? um.degree_level}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {um.required_ent && (
                          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-3.5 py-1.5">
                            <span className="t-label text-amber-400 normal-case tracking-normal">ЕНТ</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{um.required_ent}+</span>
                          </div>
                        )}
                        {um.required_gpa && (
                          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-3.5 py-1.5">
                            <span className="t-label text-[var(--accent)] normal-case tracking-normal">GPA</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{um.required_gpa}+</span>
                          </div>
                        )}
                        {um.required_sat && (
                          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-3.5 py-1.5">
                            <span className="t-label text-violet-400 normal-case tracking-normal">SAT</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{um.required_sat}+</span>
                          </div>
                        )}
                        {um.budget_places && (
                          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-3.5 py-1.5">
                            <span className="t-label text-emerald-400 normal-case tracking-normal">Грант</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{um.budget_places} мест</span>
                          </div>
                        )}
                        {um.paid_places && (
                          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-3.5 py-1.5">
                            <span className="t-label text-[var(--text-tertiary)] normal-case tracking-normal">Платно</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{um.paid_places} мест</span>
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
              <div className="card p-10">
                <div className="flex items-center gap-2 mb-8">
                  <Building2 size={15} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
                  <span className="t-label">Кампусы</span>
                </div>
                <div className="flex flex-col gap-3">
                  {university.campuses.map(campus => (
                    <div key={campus.id} className="card-glass rounded-[var(--radius-inner)] flex items-center gap-4 p-5">
                      <span className="text-2xl leading-none">{campus.country?.flag_icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="t-title text-base">{campus.country?.name}</p>
                        {campus.address && (
                          <p className="t-body text-sm mt-0.5 truncate">{campus.address}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {campus.is_main && (
                          <span className="btn-secondary text-xs px-3 py-1.5 h-auto cursor-default">
                            Главный
                          </span>
                        )}
                        {campus.has_dormitory && (
                          <span className="btn-secondary text-xs px-3 py-1.5 h-auto cursor-default">
                            Общежитие
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right column — sticky CTA */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="card p-8 flex flex-col gap-5">

              {location && (
                <div className="flex items-start gap-3">
                  <MapPin size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="t-label mb-1">Местоположение</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{location}</p>
                  </div>
                </div>
              )}

              {topRanking && (
                <div className="flex items-start gap-3">
                  <Trophy size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="t-label mb-1">{topRanking.source?.name ?? 'QS'} {topRanking.year}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">#{topRanking.position} в мире</p>
                  </div>
                </div>
              )}

              {university.type && (
                <div className="flex items-start gap-3">
                  <GraduationCap size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="t-label mb-1">Тип</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{typeLabel[university.type] ?? university.type}</p>
                  </div>
                </div>
              )}

              <div className="divider" />

              <SaveUniversityButton universityId={university.id} universityName={university.name} />

              {university.website_url && (
                <a
                  href={university.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Globe size={14} strokeWidth={1.5} />
                  Официальный сайт
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
