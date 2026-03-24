import Link from 'next/link'

const features = [
  { icon: '🎓', title: 'База университетов', desc: 'Казахстан и весь мир с фильтрами и рейтингами' },
  { icon: '📊', title: 'Анализ шансов', desc: 'Рассчитай вероятность поступления по GPA и ЕНТ' },
  { icon: '🧠', title: 'Тесты', desc: 'Определи тип личности и подходящую специальность' },
  { icon: '📅', title: 'Умный календарь', desc: 'Дедлайны и напоминания автоматически' },
  { icon: '🤖', title: 'AI Помощник', desc: 'Персональные рекомендации на основе твоего профиля' },
  { icon: '💼', title: 'Портфолио', desc: 'Фиксируй достижения, олимпиады и сертификаты' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-blue-500/30">
          Платформа для поступления в университеты
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
          Твой путь к<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            университету мечты
          </span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-xl leading-relaxed">
          Qadam помогает казахстанским школьникам правильно выбрать университет,
          подготовиться к экзаменам и не пропустить дедлайны
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/profile"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition shadow-lg shadow-blue-900/50"
          >
            Начать бесплатно →
          </Link>
          <Link
            href="/universities"
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-2xl text-lg transition border border-white/20"
          >
            Смотреть университеты
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-blue-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}
