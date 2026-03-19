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
  INTJ: { title: 'Стратег', color: 'bg-indigo-50 text-indigo-700' },
  INTP: { title: 'Логик', color: 'bg-indigo-50 text-indigo-700' },
  ENTJ: { title: 'Командир', color: 'bg-purple-50 text-purple-700' },
  ENTP: { title: 'Полемист', color: 'bg-purple-50 text-purple-700' },
  INFJ: { title: 'Активист', color: 'bg-green-50 text-green-700' },
  INFP: { title: 'Посредник', color: 'bg-green-50 text-green-700' },
  ENFJ: { title: 'Протагонист', color: 'bg-teal-50 text-teal-700' },
  ENFP: { title: 'Борец', color: 'bg-teal-50 text-teal-700' },
  ISTJ: { title: 'Администратор', color: 'bg-blue-50 text-blue-700' },
  ISFJ: { title: 'Защитник', color: 'bg-blue-50 text-blue-700' },
  ESTJ: { title: 'Менеджер', color: 'bg-cyan-50 text-cyan-700' },
  ESFJ: { title: 'Консул', color: 'bg-cyan-50 text-cyan-700' },
  ISTP: { title: 'Виртуоз', color: 'bg-orange-50 text-orange-700' },
  ISFP: { title: 'Артист', color: 'bg-orange-50 text-orange-700' },
  ESTP: { title: 'Делец', color: 'bg-red-50 text-red-700' },
  ESFP: { title: 'Развлекатель', color: 'bg-red-50 text-red-700' },
}

const interestDescriptions: Record<string, { title: string; color: string }> = {
  analytical: { title: 'Аналитик 🔬', color: 'bg-blue-50 text-blue-700' },
  social: { title: 'Помощник 🤝', color: 'bg-green-50 text-green-700' },
  creative: { title: 'Творец 🎨', color: 'bg-purple-50 text-purple-700' },
  managerial: { title: 'Организатор 📋', color: 'bg-orange-50 text-orange-700' },
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
    if (mbtiDescriptions[code]) {
      return {
        label: `${code} — ${mbtiDescriptions[code].title}`,
        color: mbtiDescriptions[code].color
      }
    }
    if (interestDescriptions[code]) {
      return {
        label: interestDescriptions[code].title,
        color: interestDescriptions[code].color
      }
    }
    if (code === 'strong') return { label: '💪 Сильный профиль', color: 'bg-green-50 text-green-700' }
    if (code === 'average') return { label: '📈 Средний уровень', color: 'bg-yellow-50 text-yellow-700' }
    if (code === 'needs_improvement') return { label: '📚 Нужна практика', color: 'bg-red-50 text-red-700' }
    return { label: code, color: 'bg-gray-50 text-gray-700' }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">🧠 Результаты тестов</h2>
        <Link href="/tests" className="text-blue-600 text-sm hover:underline">
          К тестам →
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">Тесты ещё не пройдены</p>
          <Link href="/tests" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
            Пройти тесты →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(result => {
            const display = getResultDisplay(result)
            return (
              <div key={result.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <p className="font-medium text-gray-700 text-sm">{result.test?.title}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(result.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${display.color}`}>
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