import Link from 'next/link'
import { getUniversityById } from '@/services/universityService'
import SaveUniversityButton from '@/components/universities/SaveUniversityButton'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params
  const university = await getUniversityById(id)

  if (!university) {
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
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{university.name}</h1>
              <p className="text-gray-500 mt-1">
                {university.country?.flag_icon} {university.city?.name}, {university.country?.name}
              </p>
            </div>
            {university.rankings?.[0] && (
              <div className="bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-full">
                #{university.rankings[0].position} QS
              </div>
            )}
          </div>

          {university.description_full && (
            <p className="text-gray-600 leading-relaxed mb-4">{university.description_full}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {university.type && (
              <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                {university.type === 'national' ? 'Национальный' :
                 university.type === 'technical' ? 'Технический' :
                 university.type === 'private' ? 'Частный' : university.type}
              </span>
            )}
            {university.has_dormitory && (
              <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">🏠 Общежитие</span>
            )}
            {university.has_campus && (
              <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">🏛️ Кампус</span>
            )}
            {university.website_url && (
              <a
                href={university.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full hover:bg-indigo-100"
              >
                🌐 Сайт
              </a>
            )}
          </div>

          {/* Кнопка сохранить */}
          <SaveUniversityButton universityId={university.id} universityName={university.name} />
        </div>

        {/* Требования к поступлению */}
        {university.majors && university.majors.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Требования к поступлению</h2>
            <div className="space-y-4">
              {university.majors.map(um => (
                <div key={um.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{um.major?.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {um.degree_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    {um.required_ent && (
                      <div className="flex items-center gap-1">
                        <span>📝</span> ЕНТ: {um.required_ent}+
                      </div>
                    )}
                    {um.required_gpa && (
                      <div className="flex items-center gap-1">
                        <span>📊</span> GPA: {um.required_gpa}+
                      </div>
                    )}
                    {um.budget_places && (
                      <div className="flex items-center gap-1">
                        <span>🎓</span> Грант: {um.budget_places} мест
                      </div>
                    )}
                    {um.paid_places && (
                      <div className="flex items-center gap-1">
                        <span>💳</span> Платно: {um.paid_places} мест
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {um.required_exams?.map(exam => (
                      <span key={exam} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {exam}
                      </span>
                    ))}
                    {um.requires_essay && (
                      <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                        ✍️ Эссе
                      </span>
                    )}
                    {um.requires_recommendation && (
                      <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full">
                        📄 Рекомендательное письмо
                      </span>
                    )}
                  </div>

                  {um.notes && (
                    <p className="text-gray-500 text-sm mt-2 italic">{um.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кампусы */}
        {university.campuses && university.campuses.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🏛️ Кампусы</h2>
            <div className="space-y-2">
              {university.campuses.map(campus => (
                <div key={campus.id} className="flex items-center gap-3 p-3 border rounded-xl">
                  <span className="text-2xl">{campus.country?.flag_icon}</span>
                  <div>
                    <p className="font-medium text-gray-800">{campus.country?.name}</p>
                    {campus.address && <p className="text-sm text-gray-500">{campus.address}</p>}
                  </div>
                  {campus.is_main && (
                    <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      Главный
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/universities" className="text-blue-200 hover:text-white underline">
          ← К списку университетов
        </Link>

      </div>
    </main>
  )
}