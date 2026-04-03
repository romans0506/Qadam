'use client'
import { motion } from 'framer-motion'
import { Newspaper } from 'lucide-react'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const PLACEHOLDER_NEWS = [
  {
    id: '1',
    tag: 'Поступление',
    title: 'QS World University Rankings 2025: результаты и тенденции',
    summary: 'Новый выпуск рейтинга QS показал значительный рост азиатских университетов. MIT сохраняет лидирующую позицию шестой год подряд.',
    date: '28 марта 2025',
    readTime: '4 мин',
  },
  {
    id: '2',
    tag: 'Стипендии',
    title: 'Chevening 2025–26: открыт приём заявок',
    summary: 'Британская стипендиальная программа Chevening объявила о начале приёма заявок на 2025–2026 учебный год. Дедлайн — 5 ноября 2024.',
    date: '15 марта 2025',
    readTime: '3 мин',
  },
  {
    id: '3',
    tag: 'Казахстан',
    title: 'НУ и КБТУ вошли в топ-500 QS по инженерным наукам',
    summary: 'Два казахстанских университета впервые вошли в предметный рейтинг QS по инженерным и технологическим направлениям.',
    date: '10 марта 2025',
    readTime: '2 мин',
  },
  {
    id: '4',
    tag: 'Тесты',
    title: 'SAT 2025: новые форматы и изменения в Digital SAT',
    summary: 'College Board анонсировал изменения в структуре Digital SAT. Узнайте, что изменится в тестировании для поступающих в 2025 году.',
    date: '3 марта 2025',
    readTime: '5 мин',
  },
  {
    id: '5',
    tag: 'Визы',
    title: 'США упростили процедуру получения студенческой визы F-1',
    summary: 'Государственный департамент США объявил об обновлении процедуры подачи заявлений на студенческую визу F-1 для абитуриентов из Центральной Азии.',
    date: '25 февраля 2025',
    readTime: '3 мин',
  },
  {
    id: '6',
    tag: 'Поступление',
    title: 'Common App 2025: статистика и новые требования',
    summary: 'Платформа Common App опубликовала данные о сезоне поступлений 2024–2025. Число заявителей выросло на 7% по сравнению с прошлым годом.',
    date: '18 февраля 2025',
    readTime: '4 мин',
  },
]

const TAG_COLORS: Record<string, string> = {
  'Поступление': 'bg-indigo-500/10 text-indigo-400',
  'Стипендии':   'bg-amber-500/10 text-amber-400',
  'Казахстан':   'bg-emerald-500/10 text-emerald-400',
  'Тесты':       'bg-violet-500/10 text-violet-400',
  'Визы':        'bg-sky-500/10 text-sky-400',
}

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-6 py-18">

        {/* ── Header ── */}
        <div className="mb-12">
          <h1 className="t-headline mb-2">Новости</h1>
          <p className="t-body">Актуальные новости о поступлении, стипендиях и университетах</p>
        </div>

        {/* ── Placeholder notice ── */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] bg-white/[0.02] mb-10">
          <Newspaper size={16} strokeWidth={1.5} className="text-[var(--text-quaternary)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--text-tertiary)]">
            Раздел в разработке. Ниже — примеры материалов, которые будут появляться здесь.
          </p>
        </div>

        {/* ── News list ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4"
        >
          {PLACEHOLDER_NEWS.map(news => (
            <motion.article key={news.id} variants={item}>
              <div className="card card-hover p-6 flex flex-col gap-3 cursor-default">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TAG_COLORS[news.tag] ?? 'bg-white/5 text-[var(--text-tertiary)]'}`}>
                    {news.tag}
                  </span>
                  <span className="text-xs text-[var(--text-quaternary)]">{news.date}</span>
                  <span className="text-xs text-[var(--text-quaternary)]">· {news.readTime} чтения</span>
                </div>
                <h2 className="t-title text-base leading-snug">{news.title}</h2>
                <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">{news.summary}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>

      </div>
    </main>
  )
}
