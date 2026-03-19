'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSavedUniversities, unsaveUniversity } from '@/services/universityService'
import { SavedUniversity } from '@/types/university'

export default function SavedUniversities({ userId }: { userId: string }) {
  const [saved, setSaved] = useState<SavedUniversity[]>([])

  useEffect(() => {
    getSavedUniversities(userId).then(setSaved)
  }, [userId])

  async function handleRemove(universityId: string) {
    await unsaveUniversity(userId, universityId)
    setSaved(prev => prev.filter(s => s.university_id !== universityId))
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🏛️ Сохранённые университеты</h2>

      {saved.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">Нет сохранённых университетов</p>
          <Link href="/universities" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
            Найти университеты →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <Link
                  href={`/universities/${item.university_id}`}
                  className="font-medium text-gray-800 hover:text-blue-600"
                >
                  {item.university?.name}
                </Link>
                {item.university?.country && (
                  <p className="text-gray-400 text-xs">
                    {item.university.country.flag_icon} {item.university.country.name}
                  </p>
                )}
                {item.university?.rankings?.[0] && (
                  <p className="text-blue-500 text-xs">
                    #{item.university.rankings[0].position} QS
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemove(item.university_id)}
                className="text-gray-300 hover:text-red-500 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}