import Link from 'next/link'

export default function Home(){
  return(
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <h1 className = "text-5xl font-bold mb-4">EduPath KZ 🎓</h1>
        <p className = "text-xl text-blue-200 mb-8">
          Узнай свои шансы на поступление и куда лучше подать документы
        </p>
        <Link
          href="/dashboard"
          className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-blue-100 transition"
          >
            Начать анализ →
          </Link>
      </div>
    </main>
  )
}
