'use client'
import { useEffect, useState } from 'react'
import ScoreCard from '@/components/dashboard/ScoreCard'
import { calculateChances, getSmartAnalysis, Result } from '@/services/calculatorService'
import { StudentData } from '@/types/student'

export default function Dashboard() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [analysis, setAnalysis] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('studentData')
    if (saved) {
      const data = JSON.parse(saved)
      setStudent(data)
      const calculated = calculateChances(data)
      setResults(calculated)
      setAnalysis(getSmartAnalysis(data, calculated))
    }
  }, [])

  if (!student) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Твои шансы 🎯</h1>
          <p className="text-blue-200">{student.grade} класс • ГПА: {student.gpa} • {student.city}</p>
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

        <div className="text-center mt-8">
          <a href="/onboarding" className="text-blue-200 hover:text-white underline">
            ← Изменить данные
          </a>
        </div>

      </div>
    </main>
  )
}