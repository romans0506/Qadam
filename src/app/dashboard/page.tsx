'use client'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { getProfile } from '@/services/profileService'
import { calculateChances, getSmartAnalysis, Result } from '@/services/calculatorService'
import { UserProfile } from '@/types/student'
import ScoreCard from '@/components/dashboard/ScoreCard'

export default function Dashboard() {
  const { user } = useUser()
  const [results, setResults] = useState<Result[]>([])
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      const data = await getProfile(user.id)
      if (data) {
        setProfile(data)
        const calculated = calculateChances(data)
        setResults(calculated)
        setAnalysis(getSmartAnalysis(data, calculated))
      }
      setLoading(false)
    }

    fetchData()
  }, [user])

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  if (!profile?.gpa) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <h1 className="text-3xl font-bold mb-4">Сначала заполни профиль! 📝</h1>
        <p className="text-blue-200 mb-6">Нам нужны твои данные чтобы рассчитать шансы</p>
        <Link
          href="/profile"
          className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-blue-100 transition"
        >
          Заполнить профиль →
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Твои шансы 🎯</h1>
          <p className="text-blue-200">
            {profile.grade} класс • ГПА: {profile.gpa} • {profile.city}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="font-bold text-gray-800 text-xl mb-3">📊 Персональный анализ</h2>
          <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
        </div>

        <div className="space-y-4">
          {results.map((result, i) => (
            <ScoreCard key={i} result={result} />
          ))}
        </div>

        <div className="text-center mt-8 flex justify-center gap-6">
          <Link href="/" className="text-blue-200 hover:text-white underline">Главная</Link>
          <Link href="/profile" className="text-blue-200 hover:text-white underline">Профиль</Link>
        </div>

      </div>
    </main>
  )
}