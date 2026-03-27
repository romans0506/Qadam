'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react'

interface Deadline   { id: string; type: string; date: string; description: string | null; university_id: string; university: { name: string } | null }
interface University { id: string; name: string }

const DEADLINE_TYPES = [
  'Early Action', 'Early Decision I', 'Early Decision II', 'Regular Decision',
  'Restrictive Early Action', 'UCAS Deadline', 'Основной дедлайн',
  'Стипендиальный дедлайн', 'Ранняя подача', 'Подача документов (ЕНТ)',
  'Зимний семестр', 'Летний семестр', 'Application Deadline',
]

const EMPTY = { university_id: '', type: '', custom_type: '', date: '', description: '' }

export default function AdminDeadlines() {
  const [deadlines,    setDeadlines]    = useState<Deadline[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [open,      setOpen]      = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: u }] = await Promise.all([
      supabase.from('university_deadlines')
        .select('id, type, date, description, university_id, university:universities(name)')
        .order('date'),
      supabase.from('universities').select('id, name').order('name'),
    ])
    setDeadlines((d ?? []) as Deadline[])
    setUniversities(u ?? [])
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }

  function openEdit(d: Deadline) {
    setEditingId(d.id)
    const isKnownType = DEADLINE_TYPES.includes(d.type)
    setForm({
      university_id: d.university_id,
      type:          isKnownType ? d.type : '__custom__',
      custom_type:   isKnownType ? '' : d.type,
      date:          d.date.slice(0, 10),
      description:   d.description ?? '',
    })
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY })
  }

  async function handleSave() {
    const type = form.type === '__custom__' ? form.custom_type.trim() : form.type
    if (!form.university_id || !type || !form.date) return
    setSaving(true)
    const payload = {
      university_id: form.university_id,
      type,
      date:        form.date,
      description: form.description || null,
    }
    if (editingId) {
      await supabase.from('university_deadlines').update(payload).eq('id', editingId)
    } else {
      await supabase.from('university_deadlines').insert(payload)
    }
    setSaving(false)
    closeModal()
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить дедлайн?')) return
    await supabase.from('university_deadlines').delete().eq('id', id)
    load()
  }

  const filtered = deadlines.filter(d =>
    d.university?.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  )

  const canSave = !!form.university_id && !!(form.type === '__custom__' ? form.custom_type.trim() : form.type) && !!form.date

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Дедлайны</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{deadlines.length} записей</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} strokeWidth={2} /> Добавить
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по университету или типу..."
        className="inp w-full max-w-sm mb-4"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 t-label font-medium">Университет</th>
              <th className="text-left p-4 t-label font-medium">Тип</th>
              <th className="text-left p-4 t-label font-medium">Дата</th>
              <th className="text-left p-4 t-label font-medium">Описание</th>
              <th className="p-4 w-20" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const date = new Date(d.date)
              const past = date < new Date()
              return (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4 text-[var(--text-primary)] font-medium">{d.university?.name ?? '—'}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{d.type}</td>
                  <td className={`p-4 font-medium ${past ? 'text-[var(--text-quaternary)]' : 'text-amber-400'}`}>
                    {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-[var(--text-tertiary)] max-w-[180px] truncate">{d.description ?? '—'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => openEdit(d)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center t-label">Ничего не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Редактировать дедлайн' : 'Новый дедлайн'}
              </h2>
              <button onClick={closeModal} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
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

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Тип дедлайна *</span>
                <select className="inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="">— выбрать —</option>
                  {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">Другой (ввести вручную)</option>
                </select>
              </label>

              {form.type === '__custom__' && (
                <input
                  className="inp"
                  placeholder="Введите тип дедлайна"
                  value={form.custom_type}
                  onChange={e => setForm(f => ({ ...f, custom_type: e.target.value }))}
                />
              )}

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Дата *</span>
                <input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Описание</span>
                <input className="inp" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Необязательно" />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary flex-1">Отмена</button>
              <button onClick={handleSave} disabled={saving || !canSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
                {editingId ? 'Сохранить изменения' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
