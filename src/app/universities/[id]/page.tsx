import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Trophy, GraduationCap, Building2, Globe, ArrowLeft,
  CalendarDays, DollarSign, BookOpen, CheckCircle2, Instagram,
  Youtube, Linkedin, Facebook, Twitter, Percent, Languages,
  Clock, FileText, Star, FlaskConical, Dumbbell, Users, Briefcase,
  Home, LayoutGrid, ChevronRight,
} from 'lucide-react'
import { getUniversityById } from '@/services/universityService'
import SaveUniversityButton from '@/components/universities/SaveUniversityButton'
import DeadlineCalendarButton from '@/components/universities/DeadlineCalendarButton'

type PageProps = { params: Promise<{ id: string }> }

/* ─── Design tokens helpers ─────────────────────────────────── */
const TYPE_LABEL: Record<string, string> = {
  national: 'Public University',
  technical: 'Technical University',
  private: 'Private University',
}
const DEGREE_LABEL: Record<string, string> = {
  bachelor: 'Бакалавриат',
  master: 'Магистратура',
  phd: 'Докторантура',
}

/* ─── Mock data (TODO: migrate to DB columns) ───────────────── */
const MOCK_INFRASTRUCTURE = [
  { icon: LayoutGrid,   label: 'Тип кампуса',             value: 'Urban Research Campus' },
  { icon: Users,        label: 'Студенческие организации', value: '500+ клубов и обществ' },
  { icon: Home,         label: 'Жильё',                   value: 'Гарантировано для первокурсников' },
  { icon: Briefcase,    label: 'Карьерный центр',          value: 'Выход на Fortune 500 компании' },
  { icon: FlaskConical, label: 'Исследования',             value: '17 лабораторий мирового уровня' },
  { icon: Dumbbell,     label: 'Спорт и досуг',            value: '30+ спортивных команд' },
]

const MOCK_DOCUMENTS = [
  'Транскрипты (аттестат / диплом)',
  '2–3 рекомендательных письма',
  'Common App Essay (650 слов)',
  'SAT / ACT результаты',
  'IELTS / TOEFL сертификат',
  'Портфолио (для творческих направлений)',
]

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/** Generate a real search link for a social platform when no URL is stored */
function socialFallbackUrl(platform: string, name: string): string {
  const q = encodeURIComponent(name)
  switch (platform) {
    case 'instagram': return `https://www.instagram.com/explore/search/keyword/?q=${q}`
    case 'youtube':   return `https://www.youtube.com/results?search_query=${q}`
    case 'linkedin':  return `https://www.linkedin.com/search/results/all/?keywords=${q}`
    case 'facebook':  return `https://www.facebook.com/search/top/?q=${q}`
    case 'x':         return `https://x.com/search?q=${q}`
    default:          return '#'
  }
}

/* ─── Shared UI atoms ───────────────────────────────────────── */
function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <Icon size={14} strokeWidth={1.5} className="text-[var(--text-quaternary)]" />
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)]">{label}</span>
    </div>
  )
}

function Pill({ color = 'default', children }: { color?: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    default: 'bg-white/[0.06] text-[var(--text-secondary)]',
    amber:   'bg-amber-400/10   text-amber-400',
    violet:  'bg-violet-400/10  text-violet-400',
    emerald: 'bg-emerald-400/10 text-emerald-400',
    accent:  'bg-[var(--accent)]/10 text-[var(--accent)]',
    red:     'bg-red-400/10     text-red-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cls[color] ?? cls.default}`}>
      {children}
    </span>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default async function UniversityDetailPage({ params }: PageProps) {
  const { id }    = await params
  const university = await getUniversityById(id)

  if (!university) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 gap-4">
        <p className="t-title text-[var(--text-secondary)]">Университет не найден</p>
        <Link href="/universities" className="btn-secondary text-sm">← К списку</Link>
      </main>
    )
  }

  /* ── Derived values ───────────────────────────────────────── */
  const topRanking = university.rankings?.[0]
  const location   = [university.city?.name, university.country?.name].filter(Boolean).join(', ')

  // Fallback to mock if DB field is empty  (TODO: fill via admin panel)
  const infrastructure   = (university.infrastructure?.length   ? university.infrastructure.map(v => ({ label: v, value: '' })) : null)
  const tuition          = university.tuition_usd     ?? null
  const tuitionMax       = university.tuition_usd_max ?? null
  const housing          = university.housing_usd     ?? null
  const housingMax       = university.housing_usd_max ?? null
  const acceptanceRate   = university.acceptance_rate ?? null        // TODO: DB
  const ieltsMin         = university.ielts_min     ?? null
  const toeflMin         = university.toefl_min     ?? null
  const satMin           = university.sat_min       ?? null
  const actMin           = university.act_min       ?? null
  const entMin           = university.ent_min       ?? null
  const gpaMin           = university.gpa_min       ?? null
  const documents        = university.documents_required ?? null     // TODO: DB
  const selectionCriteria= university.selection_criteria ?? null     // TODO: DB
  const degreeLanguage   = university.degree_language ?? null        // TODO: DB
  const degreeDuration   = university.degree_duration ?? null        // TODO: DB
  const keyFeatures      = university.key_features ?? null           // TODO: DB
  const hasSocials       = university.social_instagram || university.social_youtube ||
                           university.social_linkedin  || university.social_facebook || university.social_x

  // Deadline split
  const earlyDeadline   = university.deadlines?.find(d => d.type.toLowerCase().includes('early'))
  const regularDeadline = university.deadlines?.find(d => d.type.toLowerCase().includes('regular'))
  const otherDeadlines  = university.deadlines?.filter(
    d => !d.type.toLowerCase().includes('early') && !d.type.toLowerCase().includes('regular')
  ) ?? []

  // Use mock infra if no DB data
  const infraItems = infrastructure ?? MOCK_INFRASTRUCTURE.map(item => ({ icon: item.icon, label: item.label, value: item.value }))
  const useMockInfra = !infrastructure
  const docsToShow   = documents ?? MOCK_DOCUMENTS

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <div className="relative h-[60vh] min-h-[420px] max-h-[680px] overflow-hidden">

        {university.photo_url ? (
          <Image
            src={university.photo_url} alt={university.name}
            fill priority quality={90}
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c18] via-[#080810] to-[var(--bg-base)]" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/70 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-0 right-0">
          <div className="max-w-6xl mx-auto px-6">
            <Link
              href="/universities"
              className="inline-flex items-center gap-1.5 card-glass px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft size={12} strokeWidth={2} /> Назад
            </Link>
          </div>
        </div>

        {/* Rank badge */}
        {topRanking && (
          <div className="absolute top-6 right-6 card-glass px-4 py-2 flex items-center gap-2">
            <Trophy size={11} strokeWidth={1.5} className="text-amber-400" />
            <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wide">
              #{topRanking.position} {topRanking.source?.name ?? 'QS'}
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          CONTENT GRID
      ══════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6">

        {/* ── IDENTITY ─────────────────────────────────────────── */}
        <div className="-mt-28 relative z-10 mb-20">

          {/* Title */}
          <div className="mb-10">
            <h1 className="t-hero leading-none mb-2">{university.name}</h1>
            {university.name_ru && (
              <p className="text-sm text-[var(--text-tertiary)] font-medium mt-3">{university.name_ru}</p>
            )}
          </div>

          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-3">
            {location && (
              <div className="flex items-center gap-2 card-glass px-4 py-2 rounded-full">
                {university.country?.flag_icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://flagcdn.com/w40/${university.country.flag_icon.toLowerCase()}.png`}
                    width={18} height={14} alt="" className="rounded-[2px] shrink-0"
                  />
                )}
                <span className="text-xs font-medium text-[var(--text-secondary)]">{location}</span>
              </div>
            )}
            {university.type && (
              <div className="flex items-center gap-1.5 card-glass px-4 py-2 rounded-full">
                <GraduationCap size={11} strokeWidth={1.5} className="text-[var(--text-quaternary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{TYPE_LABEL[university.type] ?? university.type}</span>
              </div>
            )}
            {university.campus_format && (
              <div className="flex items-center gap-1.5 card-glass px-4 py-2 rounded-full">
                <Building2 size={11} strokeWidth={1.5} className="text-[var(--text-quaternary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{university.campus_format}</span>
              </div>
            )}
            {acceptanceRate != null && (
              <div className="flex items-center gap-1.5 card-glass px-4 py-2 rounded-full">
                <Percent size={11} strokeWidth={1.5} className="text-[var(--text-quaternary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Acceptance: {acceptanceRate}%</span>
              </div>
            )}
            {university.website_url && (
              <a
                href={university.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 card-glass px-4 py-2 rounded-full hover:border-[var(--accent)]/40 transition-colors group"
              >
                <Globe size={11} strokeWidth={1.5} className="text-[var(--text-quaternary)] group-hover:text-[var(--accent)] transition-colors" />
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">Official Website</span>
                <ChevronRight size={10} strokeWidth={2} className="text-[var(--text-quaternary)] group-hover:text-[var(--accent)] transition-colors" />
              </a>
            )}
          </div>
        </div>

        {/* ── MAIN + SIDEBAR ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8 pb-32">

          {/* ════ LEFT COLUMN ════════════════════════════════════ */}
          <div className="flex flex-col gap-6">

            {/* ── 1. ABOUT ──────────────────────────────────────── */}
            {(university.description_full || keyFeatures) && (
              <section className="card p-10">
                <SectionHeading icon={BookOpen} label="Об университете" />
                {university.description_full && (
                  <p className="text-[15px] text-[var(--text-secondary)] leading-[1.8] mb-6">
                    {university.description_full}
                  </p>
                )}
                {keyFeatures && (
                  <div className="flex items-start gap-3 p-5 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.06]">
                    <Star size={13} strokeWidth={1.5} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{keyFeatures}</p>
                  </div>
                )}
              </section>
            )}

            {/* ── 2. INFRASTRUCTURE (Bento 2×3) ─────────────────── */}
            <section className="card p-10">
              <SectionHeading icon={Building2} label="Инфраструктура" />
              {useMockInfra && (
                <p className="text-[10px] text-amber-400/60 mb-5 font-mono">
                  {/* TODO: fill via Admin → Университеты → Детали */}
                  ⚠ Демо-данные · заполни через панель администратора
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOCK_INFRASTRUCTURE.map(({ icon: Icon, label, value }, i) => {
                  const realValue = university.infrastructure?.[i] ?? null
                  return (
                    <div
                      key={i}
                      className="group flex flex-col gap-3 p-5 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.05] transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                        <Icon size={15} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--text-quaternary)] font-medium uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                          {realValue ?? value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── 3. ACADEMICS (Bachelor's) ─────────────────────── */}
            {university.majors && university.majors.length > 0 && (
              <section className="card p-10">
                <SectionHeading icon={GraduationCap} label="Академические программы" />

                {/* Params row */}
                {(degreeDuration || degreeLanguage) && (
                  <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-[var(--border)]">
                    <Pill><Clock size={11} strokeWidth={1.5} /> {degreeDuration ?? 4} года</Pill>
                    <Pill><Languages size={11} strokeWidth={1.5} /> {degreeLanguage ?? 'English'}</Pill>
                    <Pill><GraduationCap size={11} strokeWidth={1.5} /> Bachelor of Science / Arts</Pill>
                  </div>
                )}

                {/* Faculties list */}
                <div className="flex flex-col gap-3">
                  {university.majors.map(um => (
                      <div
                        key={um.id}
                        className="flex items-start justify-between gap-4 p-5 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.09] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{um.major?.name}</p>
                        </div>
                        {um.degree_level && (
                          <span className="text-[11px] font-medium text-[var(--text-quaternary)] shrink-0 mt-0.5">
                            {DEGREE_LABEL[um.degree_level] ?? um.degree_level}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ── 4. TUITION & COSTS ────────────────────────────── */}
            <section className="card p-10">
              <SectionHeading icon={DollarSign} label="Стоимость обучения · 2024–25" />
              {!tuition && !housing && (
                <p className="text-[10px] text-amber-400/60 mb-5 font-mono">
                  ⚠ Демо-данные · заполни через панель администратора
                </p>
              )}
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  const t = tuition ?? 57_986
                  const tMax = tuitionMax
                  const h = housing ?? 17_960
                  const hMax = housingMax
                  const totalMin = t + h
                  const totalMax = tMax != null || hMax != null ? (tMax ?? t) + (hMax ?? h) : null
                  const fmtRange = (min: number, max: number | null) =>
                    max != null && max !== min
                      ? `${formatUSD(min)} – ${formatUSD(max)}`
                      : formatUSD(min)
                  return [
                    { label: 'Обучение / год',  value: fmtRange(t, tMax),          note: 'Tuition & Fees'   },
                    { label: 'Проживание / год', value: fmtRange(h, hMax),          note: 'Room & Board'     },
                    { label: 'Итого / год',      value: fmtRange(totalMin, totalMax), note: 'Estimated Total', highlight: true },
                  ]
                })().map(({ label, value, note, highlight }) => (
                  <div
                    key={label}
                    className={`p-6 rounded-[var(--radius-inner)] flex flex-col gap-1.5 border ${
                      highlight
                        ? 'bg-[var(--accent)]/8 border-[var(--accent)]/25'
                        : 'bg-white/[0.03] border-white/[0.05]'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text-quaternary)]'}`}>{label}</p>
                    <p className={`text-lg font-bold leading-tight ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{value}</p>
                    <p className="text-[11px] text-[var(--text-quaternary)]">{note}</p>
                  </div>
                ))}
              </div>
              {university.total_cost_note && (
                <p className="text-xs text-[var(--text-quaternary)] mt-5 pt-5 border-t border-[var(--border)]">
                  {university.total_cost_note}
                </p>
              )}
            </section>

            {/* ── 5. ADMISSIONS & REQUIREMENTS ─────────────────── */}
            <section className="card p-10">
              <SectionHeading icon={FileText} label="Требования к поступлению" />
              {/* Score badges — only show what's filled */}
              {(gpaMin || satMin || actMin || entMin || ieltsMin || toeflMin) && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    gpaMin   && { label: 'GPA',   value: `${gpaMin}+`,   cls: 'text-[var(--accent)]' },
                    satMin   && { label: 'SAT',   value: `${satMin}+`,   cls: 'text-violet-400'      },
                    actMin   && { label: 'ACT',   value: `${actMin}+`,   cls: 'text-violet-400'      },
                    entMin   && { label: 'ЕНТ',   value: `${entMin}+`,   cls: 'text-amber-400'       },
                    ieltsMin && { label: 'IELTS',  value: `${ieltsMin}+`, cls: 'text-emerald-400'     },
                    toeflMin && { label: 'TOEFL',  value: `${toeflMin}+`, cls: 'text-amber-400'       },
                  ].filter(Boolean).map((item) => {
                    const { label, value, cls } = item as { label: string; value: string; cls: string }
                    return (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1 px-6 py-4 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05] min-w-[80px]"
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>
                        <span className="text-lg font-bold text-[var(--text-primary)]">{value}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Document checklist */}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mb-4">
                  Список документов
                </p>
                <ul className="flex flex-col gap-2.5">
                  {docsToShow.map((doc, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-[var(--text-quaternary)] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── 6. DEADLINES & SELECTIVITY ───────────────────── */}
            <section className="card p-10">
              <SectionHeading icon={CalendarDays} label="Дедлайны и конкурентность" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { d: earlyDeadline,   tag: '⚡ Early Decision',   tagColor: 'text-amber-400',        border: 'border-amber-400/20'       },
                  { d: regularDeadline, tag: '📅 Regular Decision', tagColor: 'text-[var(--accent)]', border: 'border-[var(--accent)]/20' },
                ].map(({ d, tag, tagColor, border }) => {
                  if (!d) return null
                  const date    = new Date(d.date)
                  const dateEnd = d.date_end ? new Date(d.date_end) : null
                  const refDate = dateEnd ?? date
                  const days    = Math.ceil((refDate.getTime() - Date.now()) / 86_400_000)
                  const passed  = days < 0
                  return (
                    <div key={d.id} className={`p-6 rounded-[var(--radius-inner)] bg-white/[0.03] border ${passed ? 'border-white/[0.05]' : border}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${passed ? 'text-[var(--text-quaternary)]' : tagColor}`}>
                        {tag}
                      </p>
                      {dateEnd ? (
                        <p className={`text-base font-bold mb-1 leading-snug ${passed ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {dateEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      ) : (
                        <p className={`text-xl font-bold mb-1 leading-none ${passed ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      <p className={`text-xs mb-4 ${passed ? 'text-[var(--text-quaternary)]' : days <= 30 ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
                        {passed ? 'Срок истёк' : `Осталось ${days} дн.`}
                      </p>
                      {!passed && (
                        <DeadlineCalendarButton
                          universityName={university.name}
                          deadlineType={d.type}
                          deadlineDate={d.date}
                          description={d.description}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Other deadlines */}
              {otherDeadlines.length > 0 && (
                <div className="flex flex-col divide-y divide-[var(--border)] mb-6">
                  {otherDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => {
                    const date    = new Date(d.date)
                    const dateEnd = d.date_end ? new Date(d.date_end) : null
                    const refDate = dateEnd ?? date
                    const days    = Math.ceil((refDate.getTime() - Date.now()) / 86_400_000)
                    const passed  = days < 0
                    return (
                      <div key={d.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                        <p className={`text-sm font-medium ${passed ? 'text-[var(--text-quaternary)] line-through' : 'text-[var(--text-primary)]'}`}>{d.type}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-sm font-semibold ${passed ? 'text-[var(--text-quaternary)]' : 'text-[var(--text-primary)]'}`}>
                            {dateEnd
                              ? `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} – ${dateEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                              : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </span>
                          {!passed && (
                            <DeadlineCalendarButton
                              universityName={university.name}
                              deadlineType={d.type}
                              deadlineDate={d.date}
                              description={d.description}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Acceptance Rate */}
              <div className="pt-6 border-t border-[var(--border)]">
                <p className="text-[11px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mb-5">Конкурентность</p>
                <div className="flex items-center gap-6 mb-5">
                  {/* Donut */}
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke="var(--accent)" strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(acceptanceRate ?? 3.9) * 0.88} ${88 - (acceptanceRate ?? 3.9) * 0.88}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-[var(--text-primary)] leading-none">{acceptanceRate ?? 3.9}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Acceptance Rate</p>
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed max-w-[220px]">
                      {(acceptanceRate ?? 3.9) < 10
                        ? 'Очень высокая конкурентность — поступают единицы из сотни'
                        : (acceptanceRate ?? 3.9) < 25
                        ? 'Высокая конкурентность — нужен сильный профайл'
                        : (acceptanceRate ?? 3.9) < 50
                        ? 'Умеренная конкурентность'
                        : 'Широкий набор, доступный университет'}
                    </p>
                  </div>
                </div>
                {selectionCriteria && (
                  <div className="p-4 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{selectionCriteria}</p>
                  </div>
                )}
              </div>
            </section>

            {/* ── 7. RANKINGS ──────────────────────────────────── */}
            {university.rankings && university.rankings.length > 0 && (
              <section className="card p-10">
                <SectionHeading icon={Trophy} label="Мировые рейтинги" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {university.rankings.map(r => (
                    <div key={r.id} className="p-6 text-center rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-3xl font-black text-[var(--text-primary)] leading-none mb-2">#{r.position}</p>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)]">{r.source?.name ?? 'Ranking'}</p>
                      {r.year && <p className="text-[11px] text-[var(--text-quaternary)] mt-1">{r.year}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 8. CAMPUSES ──────────────────────────────────── */}
            {university.campuses && university.campuses.length > 0 && (
              <section className="card p-10">
                <SectionHeading icon={Building2} label="Кампусы" />
                <div className="flex flex-col gap-3">
                  {university.campuses.map(campus => (
                    <div key={campus.id} className="flex items-center gap-4 p-5 rounded-[var(--radius-inner)] bg-white/[0.03] border border-white/[0.05]">
                      {campus.country?.flag_icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://flagcdn.com/w40/${campus.country.flag_icon.toLowerCase()}.png`}
                          width={28} height={20} alt="" className="rounded-[3px] shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{campus.country?.name}</p>
                        {campus.address && <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{campus.address}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {campus.is_main      && <Pill>Главный</Pill>}
                        {campus.has_dormitory && <Pill color="emerald">Общежитие</Pill>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 9. SOCIAL ECOSYSTEM ──────────────────────────── */}
            <section className="card p-10">
              <SectionHeading icon={Globe} label="Социальные сети" />
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'instagram', url: university.social_instagram, icon: Instagram, label: 'Instagram', color: 'text-pink-400  border-pink-400/25  bg-pink-400/8  hover:bg-pink-400/15'  },
                  { key: 'youtube',   url: university.social_youtube,   icon: Youtube,   label: 'YouTube',   color: 'text-red-400   border-red-400/25   bg-red-400/8   hover:bg-red-400/15'   },
                  { key: 'linkedin',  url: university.social_linkedin,  icon: Linkedin,  label: 'LinkedIn',  color: 'text-blue-400  border-blue-400/25  bg-blue-400/8  hover:bg-blue-400/15'  },
                  { key: 'facebook',  url: university.social_facebook,  icon: Facebook,  label: 'Facebook',  color: 'text-blue-500  border-blue-500/25  bg-blue-500/8  hover:bg-blue-500/15'  },
                  { key: 'x',         url: university.social_x,         icon: Twitter,   label: 'X',         color: 'text-white     border-white/20     bg-white/[0.06] hover:bg-white/[0.12]' },
                ].map(({ key, url, icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href={url || socialFallbackUrl(key, university.name)}
                    target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-full border transition-all text-sm font-medium ${color}`}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {label}
                  </a>
                ))}
              </div>
            </section>

          </div>

          {/* ════ RIGHT SIDEBAR ══════════════════════════════════ */}
          <div className="lg:sticky lg:top-24 h-fit flex flex-col gap-4">

            {/* Quick stats card */}
            <div className="card p-7 flex flex-col gap-5">

              {location && (
                <div className="flex items-start gap-3">
                  <MapPin size={13} strokeWidth={1.5} className="text-[var(--text-quaternary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-1">Местоположение</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{location}</p>
                  </div>
                </div>
              )}

              {topRanking && (
                <div className="flex items-start gap-3">
                  <Trophy size={13} strokeWidth={1.5} className="text-[var(--text-quaternary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-1">
                      {topRanking.source?.name ?? 'QS'} {topRanking.year}
                    </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">#{topRanking.position} в мире</p>
                  </div>
                </div>
              )}

              {acceptanceRate != null && (
                <div className="flex items-start gap-3">
                  <Percent size={13} strokeWidth={1.5} className="text-[var(--text-quaternary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-1">Acceptance Rate</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{acceptanceRate}%</p>
                  </div>
                </div>
              )}

              {(tuition || housing) && (
                <div className="flex items-start gap-3">
                  <DollarSign size={13} strokeWidth={1.5} className="text-[var(--text-quaternary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-1.5">Стоимость / год</p>
                    {tuition && <p className="text-xs text-[var(--text-tertiary)]">Обучение: {tuitionMax && tuitionMax !== tuition ? `${formatUSD(tuition)} – ${formatUSD(tuitionMax)}` : formatUSD(tuition)}</p>}
                    {housing && <p className="text-xs text-[var(--text-tertiary)]">Проживание: {housingMax && housingMax !== housing ? `${formatUSD(housing)} – ${formatUSD(housingMax)}` : formatUSD(housing)}</p>}
                    {tuition && housing && (
                      <p className="text-sm font-bold text-[var(--accent)] mt-1.5">
                        {(tuitionMax ?? 0) > 0 || (housingMax ?? 0) > 0
                          ? `${formatUSD(tuition + housing)} – ${formatUSD((tuitionMax ?? tuition) + (housingMax ?? housing))}`
                          : formatUSD(tuition + housing)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-[var(--border)]" />

              <SaveUniversityButton universityId={university.id} universityName={university.name} />

              {university.website_url && (
                <a
                  href={university.website_url} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Globe size={13} strokeWidth={1.5} />
                  Официальный сайт
                </a>
              )}
            </div>

            {/* Social icons mini card */}
            <div className="card p-5">
              <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-4">Соцсети</p>
              <div className="flex items-center gap-4">
                {[
                  { key: 'instagram', url: university.social_instagram, icon: Instagram, color: 'text-pink-400 hover:text-pink-300' },
                  { key: 'youtube',   url: university.social_youtube,   icon: Youtube,   color: 'text-red-400  hover:text-red-300'  },
                  { key: 'linkedin',  url: university.social_linkedin,  icon: Linkedin,  color: 'text-blue-400 hover:text-blue-300' },
                  { key: 'facebook',  url: university.social_facebook,  icon: Facebook,  color: 'text-blue-500 hover:text-blue-400' },
                  { key: 'x',         url: university.social_x,         icon: Twitter,   color: 'text-white/70 hover:text-white'    },
                ].map(({ key, url, icon: Icon, color }) => (
                  <a
                    key={key}
                    href={url || socialFallbackUrl(key, university.name)}
                    target="_blank" rel="noopener noreferrer"
                    className={`${color} transition-colors`}
                  >
                    <Icon size={17} strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>

            {/* Deadlines mini */}
            {(earlyDeadline || regularDeadline) && (
              <div className="card p-5">
                <p className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider font-semibold mb-4">Ближайшие дедлайны</p>
                <div className="flex flex-col gap-3">
                  {[earlyDeadline, regularDeadline].filter(Boolean).map(d => {
                    const date   = new Date(d!.date)
                    const days   = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
                    const passed = days < 0
                    return (
                      <div key={d!.id}>
                        <p className="text-[10px] text-[var(--text-quaternary)] mb-0.5">{d!.type}</p>
                        <p className={`text-sm font-bold ${passed ? 'text-[var(--text-quaternary)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {!passed && (
                          <p className={`text-[11px] mt-0.5 ${days <= 30 ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
                            {days} дн. осталось
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
          {/* ════════════════════════════════════════════════════ */}

        </div>
      </div>
    </main>
  )
}
