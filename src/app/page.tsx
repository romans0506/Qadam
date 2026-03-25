'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '🎓',
    title: 'Университеты',
    desc: 'База из тысяч вузов Казахстана и мира с фильтрами по специальностям',
    href: '/universities',
    color: 'from-indigo-500/20 to-blue-500/10',
    border: 'border-indigo-500/20',
  },
  {
    icon: '📊',
    title: 'Рейтинги',
    desc: 'QS, THE и другие мировые рейтинги прямо в одном месте',
    href: '/rankings',
    color: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: '🧠',
    title: 'Тесты',
    desc: 'Психологические и профориентационные тесты для выбора пути',
    href: '/tests',
    color: 'from-cyan-500/20 to-teal-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: '📅',
    title: 'Календарь',
    desc: 'Дедлайны, экзамены и события автоматически из твоего профиля',
    href: '/calendar',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: '✨',
    title: 'AI Помощник',
    desc: 'Персональный навигатор, который анализирует твои шансы',
    href: '/assistant',
    color: 'from-fuchsia-500/20 to-pink-500/10',
    border: 'border-fuchsia-500/20',
  },
  {
    icon: '🎯',
    title: 'Мои шансы',
    desc: 'Точный анализ вероятности поступления в выбранные вузы',
    href: '/dashboard',
    color: 'from-emerald-500/20 to-green-500/10',
    border: 'border-emerald-500/20',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030712] overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 bg-dot-grid">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm px-4 py-1.5 rounded-full mb-6 font-medium"
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Твой путь к университету мечты
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
              <span className="text-white">Поступи </span>
              <span className="gradient-text">умнее</span>
              <br />
              <span className="text-white">с Qadam</span>
            </h1>

            <p className="text-slate-400 text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              Персональный AI-навигатор по университетам Казахстана и мира.
              Анализ шансов, дедлайны и советы — всё в одном месте.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-7 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] text-sm"
              >
                Начать бесплатно →
              </Link>
              <Link
                href="/universities"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3 rounded-xl transition text-sm"
              >
                Смотреть университеты
              </Link>
            </div>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map(f => (
              <motion.div key={f.href} variants={cardVariants}>
                <Link href={f.href} className="group block h-full">
                  <div className={`h-full bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]`}>
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-20 border-t border-white/[0.06] pt-12 grid grid-cols-3 gap-6 text-center"
          >
            {[
              { value: '1000+', label: 'Университетов' },
              { value: '50+', label: 'Стран' },
              { value: 'AI', label: 'Персональный советник' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-slate-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </main>
  )
}
