'use client'
import { useEffect, useState } from 'react'
import { getUniversities } from '@/services/universityService'
import { University } from '@/types/university'
import UniversityCard from '@/components/universities/UniversityCard'
import UniversityFilters from '@/components/universities/UniversityFilters'

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    region: '' as '' | 'kazakhstan' | 'abroad',
    type: '',
    has_dormitory: false,
    has_campus: false,
  })

  useEffect(() => {
  async function loadData() {
    setLoading(true)
    const data = await getUniversities({
      region: filters.region || undefined,
      type: filters.type || undefined,
      has_dormitory: filters.has_dormitory || undefined,
      has_campus: filters.has_campus || undefined,
    })
    setUniversities(data)
    setLoading(false)
  }
  loadData()
}, [filters])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Университеты 🎓</h1>
          <p className="text-blue-200">Найди свой университет мечты</p>
        </div>

        <UniversityFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center text-white py-12">
            <p className="text-xl">Загрузка...</p>
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center text-white py-12">
            <p className="text-xl">Университеты не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {universities.map(uni => (
              <UniversityCard key={uni.id} university={uni} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}