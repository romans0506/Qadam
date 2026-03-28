'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil, GraduationCap, Link2 } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────── */
interface Major { id: string; name: string; code: string | null; description: string | null }
interface University { id: string; name: string }
interface UniversityMajor {
  id: string
  university_id: string
  major_id: string
  degree_level: string | null
  required_ent: number | null
  required_sat: number | null
  required_gpa: number | null
  budget_places: number | null
  paid_places: number | null
  university?: University
  major?: Major
}

type View = 'catalog' | 'links'

const DEGREE_OPTIONS = [
  { value: 'bachelor', label: 'Бакалавриат' },
  { value: 'master',   label: 'Магистратура' },
  { value: 'phd',      label: 'Докторантура' },
]

const EMPTY_MAJOR = { name: '', code: '', description: '' }
const EMPTY_LINK  = {
  university_id: '', major_id: '', degree_level: 'bachelor',
  required_ent: '', required_sat: '', required_gpa: '',
  budget_places: '', paid_places: '',
}

export default function AdminMajors() {
  const supabase = createSupabaseBrowserClient()

  const [view, setView] = useState<View>('catalog')

  /* ── Catalog state ────────────────────────────────────────── */
  const [majors,     setMajors]     = useState<Major[]>([])
  const [majorOpen,  setMajorOpen]  = useState(false)
  const [majorEdit,  setMajorEdit]  = useState<string | null>(null)
  const [majorForm,  setMajorForm]  = useState({ ...EMPTY_MAJOR })
  const [majorSearch, setMajorSearch] = useState('')

  /* ── Links state ──────────────────────────────────────────── */
  const [links,        setLinks]        = useState<UniversityMajor[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [linkOpen,     setLinkOpen]     = useState(false)
  const [linkEdit,     setLinkEdit]     = useState<string | null>(null)
  const [linkForm,     setLinkForm]     = useState({ ...EMPTY_LINK })
  const [linkFilter,   setLinkFilter]   = useState({ university_id: '', major_id: '' })

  const [saving, setSaving] = useState(false)

  /* ── Load data ────────────────────────────────────────────── */
  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: m }, { data: u }, { data: l }] = await Promise.all([
      supabase.from('majors').select('*').order('name'),
      supabase.from('universities').select('id, name').order('name'),
      supabase.from('university_majors').select(`
        *,
        university:universities(id, name),
        major:majors(id, name, code)
      `).order('major_id'),
    ])
    setMajors(m ?? [])
    setUniversities(u ?? [])
    setLinks(l ?? [])
  }

  /* ── MAJOR CRUD ───────────────────────────────────────────── */
  function openAddMajor() {
    setMajorEdit(null); setMajorForm({ ...EMPTY_MAJOR }); setMajorOpen(true)
  }
  function openEditMajor(m: Major) {
    setMajorEdit(m.id)
    setMajorForm({ name: m.name, code: m.code ?? '', description: m.description ?? '' })
    setMajorOpen(true)
  }

  async function saveMajor() {
    if (!majorForm.name.trim()) return
    setSaving(true)
    const payload = {
      name: majorForm.name.trim(),
      code: majorForm.code.trim() || null,
      description: majorForm.description.trim() || null,
    }
    if (majorEdit) {
      await supabase.from('majors').update(payload).eq('id', majorEdit)
    } else {
      await supabase.from('majors').insert(payload)
    }
    setSaving(false); setMajorOpen(false); loadAll()
  }

  async function deleteMajor(id: string) {
    if (!confirm('Удалить специальность? Все привязки к университетам тоже удалятся.')) return
    await supabase.from('university_majors').delete().eq('major_id', id)
    await supabase.from('majors').delete().eq('id', id)
    loadAll()
  }

  /* ── LINK CRUD ────────────────────────────────────────────── */
  function openAddLink() {
    setLinkEdit(null); setLinkForm({ ...EMPTY_LINK }); setLinkOpen(true)
  }
  function openEditLink(l: UniversityMajor) {
    setLinkEdit(l.id)
    setLinkForm({
      university_id: l.university_id,
      major_id: l.major_id,
      degree_level: l.degree_level ?? 'bachelor',
      required_ent:  l.required_ent != null  ? String(l.required_ent)  : '',
      required_sat:  l.required_sat != null  ? String(l.required_sat)  : '',
      required_gpa:  l.required_gpa != null  ? String(l.required_gpa)  : '',
      budget_places: l.budget_places != null ? String(l.budget_places) : '',
      paid_places:   l.paid_places != null   ? String(l.paid_places)   : '',
    })
    setLinkOpen(true)
  }

  async function saveLink() {
    if (!linkForm.university_id || !linkForm.major_id) return
    setSaving(true)
    const payload = {
      university_id: linkForm.university_id,
      major_id:      linkForm.major_id,
      degree_level:  linkForm.degree_level || null,
      required_ent:  linkForm.required_ent  ? parseInt(linkForm.required_ent)  : null,
      required_sat:  linkForm.required_sat  ? parseInt(linkForm.required_sat)  : null,
      required_gpa:  linkForm.required_gpa  ? parseFloat(linkForm.required_gpa) : null,
      budget_places: linkForm.budget_places ? parseInt(linkForm.budget_places) : null,
      paid_places:   linkForm.paid_places   ? parseInt(linkForm.paid_places)   : null,
    }
    if (linkEdit) {
      await supabase.from('university_majors').update(payload).eq('id', linkEdit)
    } else {
      await supabase.from('university_majors').insert(payload)
    }
    setSaving(false); setLinkOpen(false); loadAll()
  }

  async function deleteLink(id: string) {
    if (!confirm('Удалить привязку?')) return
    await supabase.from('university_majors').delete().eq('id', id)
    loadAll()
  }

  /* ── Filtered data ────────────────────────────────────────── */
  const filteredMajors = majors.filter(m =>
    m.name.toLowerCase().includes(majorSearch.toLowerCase()) ||
    (m.code ?? '').toLowerCase().includes(majorSearch.toLowerCase())
  )

  const filteredLinks = links.filter(l => {
    if (linkFilter.university_id && l.university_id !== linkFilter.university_id) return false
    if (linkFilter.major_id && l.major_id !== linkFilter.major_id) return false
    return true
  })

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Специальности</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-6">Справочник и привязки к университетам</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('catalog')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            view === 'catalog'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <GraduationCap size={14} strokeWidth={1.5} />
          Справочник ({majors.length})
        </button>
        <button
          onClick={() => setView('links')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            view === 'links'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Link2 size={14} strokeWidth={1.5} />
          Привязки ({links.length})
        </button>
      </div>

      {/* ══════════════ CATALOG TAB ══════════════ */}
      {view === 'catalog' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <input
              className="inp flex-1"
              placeholder="Поиск специальности..."
              value={majorSearch}
              onChange={e => setMajorSearch(e.target.value)}
            />
            <button onClick={openAddMajor} className="btn-primary flex items-center gap-1.5 text-sm shrink-0">
              <Plus size={14} strokeWidth={2} /> Добавить
            </button>
          </div>

          <div className="space-y-2">
            {filteredMajors.map(m => (
              <div key={m.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
                  <p className="text-xs text-[var(--text-quaternary)] mt-0.5">
                    {m.code && <span className="mr-3">Код: {m.code}</span>}
                    {m.description && <span>{m.description}</span>}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-quaternary)] shrink-0">
                  {links.filter(l => l.major_id === m.id).length} универов
                </span>
                <button onClick={() => openEditMajor(m)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button onClick={() => deleteMajor(m.id)} className="text-[var(--text-tertiary)] hover:text-red-400 transition">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {filteredMajors.length === 0 && (
              <p className="text-center text-sm text-[var(--text-quaternary)] py-12">
                {majorSearch ? 'Ничего не найдено' : 'Специальностей пока нет'}
              </p>
            )}
          </div>

          {/* Major modal */}
          {majorOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {majorEdit ? 'Редактировать' : 'Новая специальность'}
                  </h2>
                  <button onClick={() => setMajorOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="form-label">Название *</label>
                  <input className="inp" placeholder="Компьютерные науки" value={majorForm.name}
                    onChange={e => setMajorForm({ ...majorForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Код</label>
                  <input className="inp" placeholder="6B06101" value={majorForm.code}
                    onChange={e => setMajorForm({ ...majorForm, code: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Описание</label>
                  <textarea className="inp h-20 resize-none" placeholder="Краткое описание специальности..."
                    value={majorForm.description}
                    onChange={e => setMajorForm({ ...majorForm, description: e.target.value })} />
                </div>

                <button onClick={saveMajor} disabled={saving || !majorForm.name.trim()}
                  className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Сохранение...</> : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════ LINKS TAB ══════════════ */}
      {view === 'links' && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select className="inp flex-1 min-w-[200px]" value={linkFilter.university_id}
              onChange={e => setLinkFilter({ ...linkFilter, university_id: e.target.value })}>
              <option value="">Все университеты</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select className="inp flex-1 min-w-[200px]" value={linkFilter.major_id}
              onChange={e => setLinkFilter({ ...linkFilter, major_id: e.target.value })}>
              <option value="">Все специальности</option>
              {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={openAddLink} className="btn-primary flex items-center gap-1.5 text-sm shrink-0">
              <Plus size={14} strokeWidth={2} /> Привязать
            </button>
          </div>

          <div className="space-y-2">
            {filteredLinks.map(l => (
              <div key={l.id} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {l.major?.name ?? '?'}
                  </p>
                  <p className="text-xs text-[var(--accent)] mt-0.5">{l.university?.name ?? '?'}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {l.degree_level && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                        {DEGREE_OPTIONS.find(d => d.value === l.degree_level)?.label ?? l.degree_level}
                      </span>
                    )}
                    {l.required_gpa != null && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
                        GPA {l.required_gpa}+
                      </span>
                    )}
                    {l.required_ent != null && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                        ЕНТ {l.required_ent}+
                      </span>
                    )}
                    {l.required_sat != null && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                        SAT {l.required_sat}+
                      </span>
                    )}
                    {l.budget_places != null && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                        Грант · {l.budget_places}
                      </span>
                    )}
                    {l.paid_places != null && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-tertiary)] text-[10px] font-medium">
                        Платно · {l.paid_places}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => openEditLink(l)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition mt-1">
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button onClick={() => deleteLink(l.id)} className="text-[var(--text-tertiary)] hover:text-red-400 transition mt-1">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {filteredLinks.length === 0 && (
              <p className="text-center text-sm text-[var(--text-quaternary)] py-12">
                {linkFilter.university_id || linkFilter.major_id ? 'Ничего не найдено' : 'Привязок пока нет'}
              </p>
            )}
          </div>

          {/* Link modal */}
          {linkOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {linkEdit ? 'Редактировать привязку' : 'Привязать специальность'}
                  </h2>
                  <button onClick={() => setLinkOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="form-label">Университет *</label>
                  <select className="inp" value={linkForm.university_id}
                    onChange={e => setLinkForm({ ...linkForm, university_id: e.target.value })}>
                    <option value="">Выбрать...</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Специальность *</label>
                  <select className="inp" value={linkForm.major_id}
                    onChange={e => setLinkForm({ ...linkForm, major_id: e.target.value })}>
                    <option value="">Выбрать...</option>
                    {majors.map(m => <option key={m.id} value={m.id}>{m.name}{m.code ? ` (${m.code})` : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Уровень</label>
                  <select className="inp" value={linkForm.degree_level}
                    onChange={e => setLinkForm({ ...linkForm, degree_level: e.target.value })}>
                    {DEGREE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">GPA мин.</label>
                    <input className="inp" type="number" step="0.1" min="0" max="4" placeholder="3.5"
                      value={linkForm.required_gpa}
                      onChange={e => setLinkForm({ ...linkForm, required_gpa: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">ЕНТ мин.</label>
                    <input className="inp" type="number" min="0" max="140" placeholder="80"
                      value={linkForm.required_ent}
                      onChange={e => setLinkForm({ ...linkForm, required_ent: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">SAT мин.</label>
                    <input className="inp" type="number" min="400" max="1600" placeholder="1200"
                      value={linkForm.required_sat}
                      onChange={e => setLinkForm({ ...linkForm, required_sat: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Грант (мест)</label>
                    <input className="inp" type="number" min="0" placeholder="25"
                      value={linkForm.budget_places}
                      onChange={e => setLinkForm({ ...linkForm, budget_places: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Платно (мест)</label>
                    <input className="inp" type="number" min="0" placeholder="50"
                      value={linkForm.paid_places}
                      onChange={e => setLinkForm({ ...linkForm, paid_places: e.target.value })} />
                  </div>
                </div>

                <button onClick={saveLink}
                  disabled={saving || !linkForm.university_id || !linkForm.major_id}
                  className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Сохранение...</> : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
