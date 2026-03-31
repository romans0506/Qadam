'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil, ChevronRight } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────── */
interface Major {
  id: string
  name: string
  code: string | null
  description: string | null
  parent_id: string | null
}

const EMPTY_MAJOR = { name: '', code: '', description: '', parent_id: '' }

export default function AdminMajors() {
  const supabase = createSupabaseBrowserClient()

  const [majors,      setMajors]      = useState<Major[]>([])
  const [open,        setOpen]        = useState(false)
  const [editId,      setEditId]      = useState<string | null>(null)
  const [form,        setForm]        = useState({ ...EMPTY_MAJOR })
  const [search,      setSearch]      = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('majors').select('*').order('name')
    setMajors(data ?? [])
  }

  function openAdd(parentId?: string) {
    setEditId(null)
    setForm({ ...EMPTY_MAJOR, parent_id: parentId ?? '' })
    setOpen(true)
  }

  function openEdit(m: Major) {
    setEditId(m.id)
    setForm({ name: m.name, code: m.code ?? '', description: m.description ?? '', parent_id: m.parent_id ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      parent_id: form.parent_id || null,
    }
    if (editId) {
      await supabase.from('majors').update(payload).eq('id', editId)
    } else {
      await supabase.from('majors').insert(payload)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить специальность? Все привязки к университетам и подспециальности тоже удалятся.')) return
    // Delete children first
    await supabase.from('university_majors').delete().eq('major_id', id)
    const children = majors.filter(m => m.parent_id === id)
    for (const child of children) {
      await supabase.from('university_majors').delete().eq('major_id', child.id)
      await supabase.from('majors').delete().eq('id', child.id)
    }
    await supabase.from('majors').delete().eq('id', id)
    load()
  }

  // Build tree: top-level (no parent) + children
  const topLevel = majors.filter(m => !m.parent_id)
  const childrenOf = (parentId: string) => majors.filter(m => m.parent_id === parentId)

  const filteredTop = topLevel.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.code ?? '').toLowerCase().includes(search.toLowerCase()) ||
    childrenOf(m.id).some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  )

  // For parent select: only show top-level majors (no nested nesting)
  const parentOptions = majors.filter(m => !m.parent_id && m.id !== editId)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Специальности</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-6">Справочник направлений и подспециальностей</p>

      <div className="flex items-center gap-3 mb-4">
        <input
          className="inp flex-1"
          placeholder="Поиск специальности..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-1.5 text-sm shrink-0">
          <Plus size={14} strokeWidth={2} /> Добавить
        </button>
      </div>

      <div className="space-y-2">
        {filteredTop.map(m => {
          const children = childrenOf(m.id)
          return (
            <div key={m.id} className="card overflow-hidden">
              {/* Parent row */}
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
                  <p className="text-xs text-[var(--text-quaternary)] mt-0.5">
                    {m.code && <span className="mr-3">Код: {m.code}</span>}
                    {m.description && <span>{m.description}</span>}
                  </p>
                </div>
                <button onClick={() => openAdd(m.id)} className="text-xs text-[var(--accent)] hover:underline shrink-0">
                  + Под
                </button>
                <button onClick={() => openEdit(m)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="text-[var(--text-tertiary)] hover:text-red-400 transition">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Children */}
              {children.length > 0 && (
                <div className="border-t border-[var(--border)] bg-white/[0.02]">
                  {children.map(c => (
                    <div key={c.id} className="px-4 py-3 flex items-center gap-4 border-b border-[var(--border)] last:border-0">
                      <ChevronRight size={12} className="text-[var(--text-quaternary)] shrink-0 ml-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)]">{c.name}</p>
                        {c.code && <span className="text-xs text-[var(--text-quaternary)]">Код: {c.code}</span>}
                      </div>
                      <button onClick={() => openEdit(c)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-[var(--text-tertiary)] hover:text-red-400 transition">
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filteredTop.length === 0 && (
          <p className="text-center text-sm text-[var(--text-quaternary)] py-12">
            {search ? 'Ничего не найдено' : 'Специальностей пока нет'}
          </p>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editId ? 'Редактировать' : form.parent_id ? 'Новая подспециальность' : 'Новая специальность'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="form-label">Родительская специальность</label>
              <select className="inp" value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">— Нет (верхний уровень)</option>
                {parentOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Название *</label>
              <input className="inp" placeholder={form.parent_id ? 'Cybersecurity' : 'Информационные технологии'} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Код</label>
              <input className="inp" placeholder="6B06101" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Описание</label>
              <textarea className="inp h-20 resize-none" placeholder="Краткое описание..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Сохранение...</> : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
