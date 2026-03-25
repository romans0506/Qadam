'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

interface TestResult {
  id: string
  result_code: string
  result_data: Record<string, unknown>
  created_at: string
  test: { title: string; code: string }
}

const mbtiDescriptions: Record<string, { title: string; color: string }> = {
  INTJ: { title: 'Стратег', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  INTP: { title: 'Логик', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  ENTJ: { title: 'Командир', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
  ENTP: { title: 'Полемист', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
  INFJ: { title: 'Активист', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  INFP: { title: 'Посредник', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  ENFJ: { title: 'Протагонист', color: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
  ENFP: { title: 'Борец', color: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
  ISTJ: { title: 'Администратор', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  ISFJ: { title: 'Защитник', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  ESTJ: { title: 'Менеджер', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  ESFJ: { title: 'Консул', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  ISTP: { title: 'Виртуоз', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ISFP: { title: 'Артист', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ESTP: { title: 'Делец', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  ESFP: { title: 'Развлекатель', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
}

const interestDescriptions: Record<string, { title: string; color: string }> = {
  analytical: { title: 'Аналитик', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  social: { title: 'Помощник', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  creative: { title: 'Творец', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
  managerial: { title: 'Организатор', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
}

export default function TestResults({ userId }: { userId: string }) {
  const [results, setResults] = useState<TestResult[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('user_test_results')
        .select('*, test:tests(title, code)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setResults(data ?? [])
    }
    load()
  }, [userId])

  function getResultDisplay(result: TestResult) {
    const code = result.result_code
    if (mbtiDescriptions[code]) return { label: `${code} — ${mbtiDescriptions[code].title}`, color: mbtiDescriptions[code].color }
    if (interestDescriptions[code]) return { label: interestDescriptions[code].title, color: interestDescriptions[code].color }
    if (code === 'strong') return { label: 'Сильный профиль', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
    if (code === 'average') return { label: 'Средний уровень', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
    if (code === 'needs_improvement') return { label: 'Нужна практика', color: 'bg-red-500/10 border-red-500/20 text-red-400' }
    return { label: code, color: 'bg-white/5 border-white/10 text-slate-400' }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Результаты тестов</h2>
        <Link href="/tests" className="text-xs text-slate-500 hover:text-indigo-400 transition">
          К тестам →
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-slate-600 text-sm mb-2">Тесты ещё не пройдены</p>
          <Link href="/tests" className="text-indigo-400 hover:text-indigo-300 text-xs transition">
            Пройти тесты →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map(result => {
            const display = getResultDisplay(result)
            return (
              <div key={result.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{result.test?.title}</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {new Date(result.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${display.color}`}>
                  {display.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
