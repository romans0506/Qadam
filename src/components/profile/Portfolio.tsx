'use client'
import { useState } from 'react'
import { PortfolioItem } from '@/types/student'

interface Props {
  items: PortfolioItem[]
  userId: string
  onAdd: (item: Omit<PortfolioItem, 'id' | 'created_at'>) => void
  onDelete: (id: string) => void
}

const TYPES = [
  { value: 'olympiad', label: 'Олимпиада', icon: '🏆' },
  { value: 'competition', label: 'Конкурс', icon: '🥇' },
  { value: 'certificate', label: 'Сертификат', icon: '📜' },
  { value: 'volunteer', label: 'Волонтёрство', icon: '🤝' },
  { value: 'leadership', label: 'Лидерство', icon: '👑' },
  { value: 'extracurricular', label: 'Внеурочная', icon: '⭐' },
]

const inp = 'w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition [&>option]:bg-[#0f1629]'

export default function Portfolio({ items, userId, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    type: 'olympiad' as PortfolioItem['type'],
    title: '',
    description: '',
    organization: '',
    year: new Date().getFullYear(),
  })

  function handleAdd() {
    if (!form.title) return
    onAdd({
      ...form,
      user_id: userId,
      organization: null,
      evidence_url: null,
      updated_at: new Date().toISOString(),
    })
    setForm({ type: 'olympiad', title: '', description: '', organization: '', year: new Date().getFullYear() })
    setAdding(false)
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Портфолио</h2>
        <button onClick={() => setAdding(!adding)}
          className="text-xs text-slate-500 hover:text-indigo-400 transition font-medium">
          {adding ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4 space-y-2.5">
          <select className={inp} value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as PortfolioItem['type'] })}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
          <input className={inp} placeholder="Название" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
          <input className={inp} placeholder="Описание (необязательно)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" className={inp} placeholder="Год" min={2000} max={2030} value={form.year}
              onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} />
            <input className={inp} placeholder="Организация" value={form.organization || ''}
              onChange={e => setForm({ ...form, organization: e.target.value })} />
          </div>
          <button onClick={handleAdd}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition text-sm">
            Добавить
          </button>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <p className="text-slate-600 text-sm text-center py-4">Добавь свои достижения!</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const t = TYPES.find(t => t.value === item.type)
            return (
              <div key={item.id} className="flex items-start justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="text-base mt-0.5">{t?.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                    {item.description && <p className="text-slate-500 text-xs mt-0.5">{item.description}</p>}
                    <p className="text-slate-600 text-xs mt-1">{t?.label} · {item.year}</p>
                  </div>
                </div>
                <button onClick={() => onDelete(item.id)}
                  className="text-slate-600 hover:text-red-400 transition text-xs ml-2 mt-0.5 shrink-0">✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
