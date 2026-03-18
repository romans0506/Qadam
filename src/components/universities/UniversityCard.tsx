import Link from 'next/link'
import { University } from '@/types/university'

export default function UniversityCard({ university }: { university: University }) {
  const topRanking = university.rankings?.[0]

  return (
    <Link href={`/universities/${university.id}`}>
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{university.name}</h3>
            <p className="text-gray-500 text-sm mt-1">
              {university.country?.flag_icon} {university.city?.name}, {university.country?.name}
            </p>
          </div>
          {topRanking && (
            <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-sm ml-3 whitespace-nowrap">
              #{topRanking.position}
            </div>
          )}
        </div>

        {university.description_short && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {university.description_short}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {university.type && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {university.type === 'national' ? 'Национальный' :
               university.type === 'technical' ? 'Технический' :
               university.type === 'private' ? 'Частный' : university.type}
            </span>
          )}
          {university.has_dormitory && (
            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
              🏠 Общежитие
            </span>
          )}
          {university.campuses && university.campuses.length > 1 && (
            <div className="flex gap-1">
              {university.campuses.map(campus => (
                <span key={campus.id} className="text-sm">{campus.country?.flag_icon}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}