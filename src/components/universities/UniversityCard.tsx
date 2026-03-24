import Link from 'next/link'
import Image from 'next/image'
import { University } from '@/types/university'

export default function UniversityCard({ university }: { university: University }) {
  const topRanking = university.rankings?.[0]
  const extraCampusFlags = university.campuses
    ?.filter(c => c.country?.flag_icon && c.country.flag_icon !== university.country?.flag_icon)
    .map(c => c.country?.flag_icon)
    .filter(Boolean) ?? []

  return (
    <Link href={`/universities/${university.id}`}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer h-full overflow-hidden flex flex-col">

        {/* Фото */}
        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-indigo-100 shrink-0">
          {university.photo_url ? (
            <Image
              src={university.photo_url}
              alt={university.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-20">🎓</span>
            </div>
          )}
          {topRanking && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full text-xs shadow">
              #{topRanking.position}
              {topRanking.source?.name && (
                <span className="font-normal opacity-80 ml-1">{topRanking.source.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-800 text-base leading-tight line-clamp-2">{university.name}</h3>
          </div>

          <p className="text-gray-500 text-xs flex items-center gap-1">
            <span>{university.country?.flag_icon}</span>
            <span>{university.city?.name && `${university.city.name}, `}{university.country?.name}</span>
            {extraCampusFlags.length > 0 && (
              <span className="ml-1 flex gap-0.5">{extraCampusFlags.map((f, i) => <span key={i}>{f}</span>)}</span>
            )}
          </p>

          {university.description_short && (
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {university.description_short}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {university.type && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {university.type === 'national' ? 'Национальный' :
                 university.type === 'technical' ? 'Технический' :
                 university.type === 'private' ? 'Частный' : university.type}
              </span>
            )}
            {university.has_dormitory && (
              <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">Общежитие</span>
            )}
            {university.has_campus && (
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">Кампус</span>
            )}
          </div>
        </div>

      </div>
    </Link>
  )
}
