'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X } from 'lucide-react'

interface Ranking       { id: string; position: number; year: number; score: number | null; university: { name: string } | null; source: { name: string } | null }
interface University    { id: string; name: string }
interface RankingSource { id: string; name: string }

const EMPTY = { university_id: '', ranking_source_id: '', year: new Date().getFullYear().toString(), position: '', score: '' }

export default function AdminRankings() {
  const [rankings,  setRankings]  = useState<Ranking[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [sources,   setSources]   = useState<RankingSource[]>([])
  const [open,      setOpen]      = useState(false)
  const [newSource, setNewSource] = useState('')
  const [addSource, setAddSource] = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: r }, { data: u }, { data: s }] = await Promise.all([
      supabase.from('university_rankings')
        .select('id, position, year, score, university:universities(name), source:ranking_sources(name)')
        .order('position'),
      supabase.from('universities').select('id, name').order('name'),
      supabase.from('ranking_sources').select('id, name').order('name'),
    ])
    setRankings(r ?? [])
    setUniversities(u ?? [])
    setSources(s ?? [])
  }

  async function handleAddSource() {
    if (!newSource.trim()) return
    const { data } = await supabase.from('ranking_sources').insert({ name: newSource.trim() }).select().single()
    if (data) setSources(prev => [...prev, data])
    setNewSource('')
    setAddSource(false)
  }

  async function handleSave() {
    if (!form.university_id || !form.ranking_source_id || !form.year || !form.position) return
    setSaving(true)
    await supabase.from('university_rankings').insert({
      university_id:     form.university_id,
      ranking_source_id: form.ranking_source_id,
      year:              parseInt(form.year),
      position:          parseInt(form.position),
      score:             form.score ? parseFloat(form.score) : null,
    })
    setSaving(false)
    setOpen(false)
    setForm({ ...EMPTY })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить рейтинг?')) return
    await supabase.from('university_rankings').delete().eq('id', id)
    load()
  }

  const filtered = rankings.filter(r =>
    r.university?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.source?.name.toLowerCase().includes(search.toLowerCase())
  )

  const canSave = !!form.university_id && !!form.ranking_source_id && !!form.year && !!form.position

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Рейтинги</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{rankings.length} записей</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} strokeWidth={2} /> Добавить
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по университету или рейтингу..."
        className="inp w-full max-w-sm mb-4"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 t-label font-medium">Университет</th>
              <th className="text-left p-4 t-label font-medium">Рейтинг</th>
              <th className="text-left p-4 t-label font-medium">Год</th>
              <th className="text-left p-4 t-label font-medium">Позиция</th>
              <th className="text-left p-4 t-label font-medium">Балл</th>
              <th className="p-4 w-12" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                <td className="p-4 text-[var(--text-primary)] font-medium">{r.university?.name ?? '—'}</td>
                <td className="p-4 text-[var(--text-secondary)]">{r.source?.name ?? '—'}</td>
                <td className="p-4 text-[var(--text-tertiary)]">{r.year}</td>
                <td className="p-4 text-violet-400 font-bold">#{r.position}</td>
                <td className="p-4 text-[var(--text-tertiary)]">{r.score ?? '—'}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(r.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center t-label">Ничего не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Новый рейтинг</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Университет *</span>
                <select className="inp" value={form.university_id} onChange={e => setForm(f => ({ ...f, university_id: e.target.value }))}>
                  <option value="">— выбрать —</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="admin-label">Источник рейтинга *</span>
                  <button onClick={() => setAddSource(v => !v)} className="text-xs text-[var(--accent)] hover:underline">
                    + Новый источник
                  </button>
                </div>
                {addSource && (
                  <div className="flex gap-2 mb-2">
                    <input className="inp flex-1" placeholder="Название (QS, THE...)" value={newSource} onChange={e => setNewSource(e.target.value)} />
                    <button onClick={handleAddSource} className="btn-primary text-sm px-3">Добавить</button>
                  </div>
                )}
                <select className="inp w-full" value={form.ranking_source_id} onChange={e => setForm(f => ({ ...f, ranking_source_id: e.target.value }))}>
                  <option value="">— выбрать —</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="admin-label">Год *</span>
                  <input type="number" className="inp" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2025" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="admin-label">Позиция *</span>
                  <input type="number" className="inp" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="1" min="1" />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Балл (необязательно)</span>
                <input type="number" className="inp" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="95.2" step="0.1" />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Отмена</button>
              <button onClick={handleSave} disabled={saving || !canSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
