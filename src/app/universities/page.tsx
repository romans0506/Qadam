'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUniversities } from '@/services/universityService'
import type { University } from '@/types/university'
export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const data = await getUniversities()
      setUniversities(data)
      setLoading(false)
    }
    fetchData()
  }, [])
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Загрузка...</p>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Университеты</h1>
        <ul className="space-y-4">
          {universities.map((uni) => (
            <li key={uni.id}>
              <Link
                href={`/universities/${uni.id}`}
                className="block bg-white rounded-xl p-4 text-blue-900 hover:bg-blue-50 transition"
              >
                <h2 className="font-bold text-lg">{uni.name}</h2>
                <p className="text-gray-600 text-sm">
                  {uni.city}, {uni.country}
                </p>
                {uni.ranking_position && (
                  <p className="text-blue-600 text-sm mt-1">
                    Рейтинг: #{uni.ranking_position} {uni.ranking_source && `(${uni.ranking_source})`}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href="/" className="text-blue-200 hover:text-white underline">
            ← Главная
          </Link>
        </div>
      </div>
    </main>
  )
}