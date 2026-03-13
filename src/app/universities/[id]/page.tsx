import Link from 'next/link'
import {getUniversityById} from '@/services/universityService'
import type { University } from '@/types/university'

type PageProps = {
    params: Promise<{id : string}>
}

export default async function UniversitiesPage({params}: PageProps) {
    const {id} = await params
    const university = await getUniversityById(id)
    
    if(!university){
        return (
         <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Университет не найден</h1>
        <Link href="/universities" className="text-blue-200 hover:text-white underline">
          ← К списку университетов
        </Link>
      </main>
      )     
    }
     return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-blue-900">
          <h1 className="text-2xl font-bold">{university.name}</h1>
          <p className="text-gray-600">{university.city}, {university.country}</p>
          {/* сюда добавь рейтинг, описание, тип, кампус, общежитие */}
        </div>
        <div className="mt-6">
          <Link href="/universities" className="text-blue-200 hover:text-white underline">
            ← К списку университетов
          </Link>
        </div>
      </div>
    </main>
  )
}




