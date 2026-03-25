'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GraduationCap, BarChart3, Brain, CalendarDays, Sparkles, Target,
} from 'lucide-react'

const features = [
  {
    Icon: Sparkles,
    title: 'AI Помощник',
    desc: 'Персональный навигатор анализирует твой профиль и даёт конкретные советы — куда поступать, что улучшить, какие шансы.',
    href: '/assistant',
    accent: 'text-[var(--accent)]',
  },
  {
    Icon: GraduationCap,
    title: 'База университетов',
    desc: 'Тысячи вузов Казахстана и мира с фильтрами по специальностям, стране, рейтингу и условиям поступления.',
    href: '/universities',
    accent: 'text-blue-400',
  },
  {
    Icon: BarChart3,
    title: 'Мировые рейтинги',
    desc: 'QS, THE, ARWU и национальные рейтинги в одном месте. Сравнивай и анализируй позиции вузов.',
    href: '/rankings',
    accent: 'text-violet-400',
  },
  {
    Icon: Brain,
    title: 'Тесты и профиль',
    desc: 'Психологические и профориентационные тесты помогут определить подходящие специальности и карьерный путь.',
    href: '/tests',
    accent: 'text-cyan-400',
  },
  {
    Icon: CalendarDays,
    title: 'Умный календарь',
    desc: 'Дедлайны и экзамены подгружаются автоматически из твоего профиля и сохранённых университетов.',
    href: '/calendar',
    accent: 'text-amber-400',
  },
  {
    Icon: Target,
    title: 'Мой профиль',
    desc: 'Заполни академические данные — GPA, ЕНТ, SAT, IELTS — и получи персональный анализ шансов поступления.',
    href: '/profile',
    accent: 'text-emerald-400',
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] overflow-hidden">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full bg-[var(--accent)]/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/[0.05] blur-[140px]" />
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-vignette bg-dot-grid">
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-32 flex flex-col items-center text-center">

          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 border border-[var(--border-strong)] bg-white/[0.04] px-4 py-2 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="t-label normal-case tracking-normal text-[var(--text-secondary)]">
              Твой путь к университету мечты
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="t-hero text-center max-w-3xl mb-6"
          >
            Поступи{' '}
            <span className="gradient-text">умнее</span>
            <br />с Qadam
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="t-body text-center max-w-lg mb-12 leading-loose"
          >
            Персональный AI-навигатор по университетам Казахстана и мира.
            Анализ шансов, дедлайны и советы — всё в одном месте.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/profile" className="btn-primary px-8">
              Начать бесплатно
            </Link>
            <Link href="/universities" className="btn-secondary px-8">
              Университеты
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map(({ Icon, title, desc, href, accent }) => (
            <motion.div key={href} variants={cardItem}>
              <Link href={href} className="group block h-full">
                <div className="card-glass h-full p-8 flex flex-col gap-5 hover:border-[var(--border-strong)] transition-all duration-300 hover:-translate-y-0.5">
                  <Icon
                    size={22}
                    strokeWidth={1.2}
                    className={`${accent} transition-transform duration-300 group-hover:scale-110`}
                  />
                  <div className="flex flex-col gap-2 flex-1">
                    <h3 className="t-title group-hover:text-white transition-colors">{title}</h3>
                    <p className="t-body leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-t border-[var(--border)] pt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { value: '1000+', label: 'Университетов' },
            { value: '50+', label: 'Стран мира' },
            { value: 'AI', label: 'Персональный советник' },
          ].map(s => (
            <div key={s.label}>
              <p className="t-headline text-[var(--text-primary)]">{s.value}</p>
              <p className="t-label mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

    </main>
  )
}
