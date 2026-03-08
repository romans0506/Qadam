'use client'
import { useState } from 'react'
import { PortfolioItem } from '@/types/student'

interface Props {
  items: PortfolioItem[]
  clerkId: string
  onAdd: (item: Omit<PortfolioItem, 'id' | 'created_at'>) => void
  onDelete: (id: string) => void
}

const TYPES = [
  { value: 'olympiad', label: '🏆 Олимпиада' },
  { value: 'certificate', label: '📜 Сертификат' },
  { value: 'volunteer', label: '🤝 Волонтёрство' },
  { value: 'leadership', label: '👑 Лидерство' },
  { value: 'extracurricular', label: '⭐ Внеурочная' },
]

export default function Portfolio({ items, clerkId, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    type: 'olympiad' as PortfolioItem['type'],
    title: '',
    description: '',
    year: new Date().getFullYear(),
  })

  function handleAdd() {
    if (!form.title) return
    onAdd({ ...form, clerk_id: clerkId })
    setForm({ type: 'olympiad', title: '', description: '', year: new Date().getFullYear() })
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">🎖️ Портфолио</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-blue-600 font-medium hover:underline"
        >
          {adding ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {/* Форма добавления */}
      {adding && (
        <div className="border rounded-xl p-4 mb-4 space-y-3 bg-blue-50">
          <select
            className="w-full border rounded-lg p-2 text-gray-800"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as PortfolioItem['type'] })}
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            className="w-full border rounded-lg p-2 text-gray-800"
            placeholder="Название"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="w-full border rounded-lg p-2 text-gray-800"
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="number"
            className="w-full border rounded-lg p-2 text-gray-800"
            placeholder="Год"
            min={2000} max={2030}
            value={form.year}
            onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
          />
          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
          >
            Добавить
          </button>
        </div>
      )}

      {/* Список */}
      {items.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Пока ничего нет — добавь свои достижения!</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-start justify-between p-3 border rounded-xl">
              <div>
                <p className="font-medium text-gray-800">
                  {TYPES.find(t => t.value === item.type)?.label} — {item.title}
                </p>
                {item.description && <p className="text-gray-500 text-sm">{item.description}</p>}
                <p className="text-gray-400 text-xs">{item.year}</p>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-400 hover:text-red-600 text-sm"
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