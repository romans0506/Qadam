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
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Сохранённые университеты</h2>
        <Link href="/universities" className="text-xs text-slate-500 hover:text-indigo-400 transition">
          Найти ещё →
        </Link>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-slate-600 text-sm mb-2">Нет сохранённых университетов</p>
          <Link href="/universities" className="text-indigo-400 hover:text-indigo-300 text-xs transition">
            Перейти к каталогу →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {saved.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex-1 min-w-0">
                <Link href={`/universities/${item.university_id}`}
                  className="text-white text-sm font-medium hover:text-indigo-300 transition truncate block">
                  {item.university?.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.university?.country && (
                    <p className="text-slate-500 text-xs">
                      {item.university.country.flag_icon} {item.university.country.name}
                    </p>
                  )}
                  {item.university?.rankings?.[0] && (
                    <span className="text-xs text-indigo-500">
                      #{item.university.rankings[0].position} QS
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleRemove(item.university_id)}
                className="text-slate-600 hover:text-red-400 transition text-xs ml-3 shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
