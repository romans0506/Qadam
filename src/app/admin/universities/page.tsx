'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react'

interface University {
  id: string; name: string; name_ru: string | null; type: string | null; website_url: string | null
  description_short: string | null; description_full: string | null
  photo_url: string | null; main_country_id: string | null
  has_dormitory: boolean; has_campus: boolean; aliases: string | null
}
interface Country { id: string; name: string }

const EMPTY = {
  name: '', name_ru: '', type: 'national', website_url: '', description_short: '',
  description_full: '', photo_url: '', main_country_id: '', has_dormitory: false, has_campus: false, aliases: '',
}

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [countries,    setCountries]    = useState<Country[]>([])
  const [open,       setOpen]       = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [form,       setForm]       = useState({ ...EMPTY })
  const [saving,     setSaving]     = useState(false)
  const [search,     setSearch]     = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: u, error: uErr }, { data: c }] = await Promise.all([
      supabase.from('universities').select('id, name, name_ru, type, website_url, description_short, description_full, photo_url, main_country_id, has_dormitory, has_campus, aliases').order('name'),
      supabase.from('countries').select('id, name').order('name'),
    ])
    if (uErr) console.error('Admin universities load error:', uErr)
    setUniversities(u ?? [])
    setCountries(c ?? [])
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }

  function openEdit(u: University) {
    setEditingId(u.id)
    setForm({
      name:              u.name,
      type:              u.type ?? 'national',
      website_url:       u.website_url ?? '',
      description_short: u.description_short ?? '',
      description_full:  u.description_full ?? '',
      photo_url:         u.photo_url ?? '',
      main_country_id:   u.main_country_id ?? '',
      has_dormitory:     u.has_dormitory,
      has_campus:        u.has_campus,
      name_ru:           u.name_ru ?? '',
      aliases:           u.aliases ?? '',
    })
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY })
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name:              form.name.trim(),
      type:              form.type || null,
      website_url:       form.website_url || null,
      description_short: form.description_short || null,
      description_full:  form.description_full  || null,
      photo_url:         form.photo_url || null,
      main_country_id:   form.main_country_id || null,
      has_dormitory:     form.has_dormitory,
      has_campus:        form.has_campus,
      aliases:           form.aliases || null,
    }
    if (editingId) {
      await supabase.from('universities').update(payload).eq('id', editingId)
    } else {
      await supabase.from('universities').insert(payload)
    }
    setSaving(false)
    closeModal()
    load()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить «${name}»?`)) return
    await supabase.from('universities').delete().eq('id', id)
    load()
  }

  const filtered = universities.filter(u => {
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      (u.aliases?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Университеты</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{universities.length} записей</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} strokeWidth={2} /> Добавить
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по названию..."
        className="inp w-full max-w-sm mb-4"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 t-label font-medium">Название</th>
              <th className="text-left p-4 t-label font-medium">Тип</th>
              <th className="text-left p-4 t-label font-medium">Сайт</th>
              <th className="p-4 w-20" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                <td className="p-4 text-[var(--text-primary)] font-medium">{u.name}</td>
                <td className="p-4 text-[var(--text-tertiary)]">{u.type ?? '—'}</td>
                <td className="p-4 text-[var(--text-tertiary)] truncate max-w-[200px]">
                  {u.website_url
                    ? <a href={u.website_url} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition">{u.website_url}</a>
                    : '—'}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => openEdit(u)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDelete(u.id, u.name)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center t-label">Ничего не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Редактировать университет' : 'Новый университет'}
              </h2>
              <button onClick={closeModal} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Название *</span>
                <input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="MIT" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="admin-label">Тип</span>
                  <select className="inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="national">Национальный</option>
                    <option value="technical">Технический</option>
                    <option value="private">Частный</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="admin-label">Страна</span>
                  <select className="inp" value={form.main_country_id} onChange={e => setForm(f => ({ ...f, main_country_id: e.target.value }))}>
                    <option value="">— выбрать —</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Сайт</span>
                <input className="inp" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://mit.edu" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Фото (URL)</span>
                <input className="inp" value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Краткое описание</span>
                <input className="inp" value={form.description_short} onChange={e => setForm(f => ({ ...f, description_short: e.target.value }))} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Полное описание</span>
                <textarea className="inp resize-none h-28" value={form.description_full} onChange={e => setForm(f => ({ ...f, description_full: e.target.value }))} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="admin-label">Псевдонимы для поиска</span>
                <input className="inp" value={form.aliases} onChange={e => setForm(f => ({ ...f, aliases: e.target.value }))} placeholder="МИТ, MIT, Массачусетс" />
                <span className="text-xs text-[var(--text-quaternary)]">Через запятую — любые названия, по которым можно найти этот университет</span>
              </label>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.has_dormitory} onChange={e => setForm(f => ({ ...f, has_dormitory: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                  <span className="text-sm text-[var(--text-secondary)]">Общежитие</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.has_campus} onChange={e => setForm(f => ({ ...f, has_campus: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                  <span className="text-sm text-[var(--text-secondary)]">Кампус</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary flex-1">Отмена</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
