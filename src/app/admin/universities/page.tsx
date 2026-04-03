'use client'
import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react'

interface University {
  id: string; name: string; name_ru: string | null; type: string | null; website_url: string | null
  description_short: string | null; description_full: string | null; key_features: string | null
  photo_url: string | null; logo_url: string | null; main_country_id: string | null
  has_dormitory: boolean; has_campus: boolean; aliases: string | null
  campus_format: string | null
  infrastructure: string[] | null
  tuition_usd: number | null; tuition_usd_max: number | null
  housing_usd: number | null; housing_usd_max: number | null; total_cost_note: string | null
  gpa_min: number | null; sat_min: number | null; act_min: number | null; ent_min: number | null
  ielts_min: number | null; toefl_min: number | null
  documents_required: string[] | null
  degree_language: string | null; degree_duration: number | null
  acceptance_rate: number | null; selection_criteria: string | null
  social_instagram: string | null; social_youtube: string | null; social_linkedin: string | null
  social_facebook: string | null; social_x: string | null
}
interface Country { id: string; name: string }
interface RankingSource { id: string; name: string }
interface Ranking { id: string; ranking_source_id: string; year: number; position: number; score: number | null; source?: { name: string } | null }
interface Deadline { id: string; type: string; date: string; date_end: string | null; description: string | null }
interface Major { id: string; name: string; code: string | null }
interface UniversityMajor {
  id: string; major_id: string; degree_level: string | null
  major?: Major
}

const DEGREE_OPTIONS = [
  { value: 'bachelor', label: 'Бакалавриат' },
  { value: 'master',   label: 'Магистратура' },
  { value: 'phd',      label: 'Докторантура' },
]

const DEADLINE_TYPES = [
  'Early Action', 'Early Decision I', 'Early Decision II', 'Regular Decision',
  'Restrictive Early Action', 'UCAS Deadline', 'Основной дедлайн',
  'Стипендиальный дедлайн', 'Ранняя подача', 'Подача документов (ЕНТ)',
  'Зимний семестр', 'Летний семестр', 'Application Deadline',
]

const INFRA_FIELDS = [
  { key: 'infra_0', label: '🏛 Тип кампуса',             placeholder: 'Urban Research Campus' },
  { key: 'infra_1', label: '👥 Студенческие организации', placeholder: '500+ клубов и обществ' },
  { key: 'infra_2', label: '🏠 Жильё',                   placeholder: 'Гарантировано для первокурсников' },
  { key: 'infra_3', label: '💼 Карьерный центр',          placeholder: 'Выход на Fortune 500 компании' },
  { key: 'infra_4', label: '🔬 Исследования',             placeholder: '17 лабораторий мирового уровня' },
  { key: 'infra_5', label: '🏋️ Спорт и досуг',            placeholder: '30+ спортивных команд' },
]

const EMPTY = {
  name: '', name_ru: '', type: 'national', website_url: '', description_short: '',
  description_full: '', key_features: '', photo_url: '', logo_url: '', main_country_id: '',
  has_dormitory: false, has_campus: false, aliases: '', campus_format: '',
  infra_0: '', infra_1: '', infra_2: '', infra_3: '', infra_4: '', infra_5: '',
  tuition_usd: '', tuition_usd_max: '', housing_usd: '', housing_usd_max: '', total_cost_note: '',
  gpa_min: '', sat_min: '', act_min: '', ent_min: '', ielts_min: '', toefl_min: '',
  documents_required: '',
  degree_language: '', degree_duration: '',
  acceptance_rate: '', selection_criteria: '',
  social_instagram: '', social_youtube: '', social_linkedin: '', social_facebook: '', social_x: '',
}

const EMPTY_RANKING  = { ranking_source_id: '', year: new Date().getFullYear().toString(), position: '', score: '' }
const EMPTY_DEADLINE = { type: '', custom_type: '', date: '', date_end: '', description: '' }
const EMPTY_UMAJOR   = { major_id: '', degree_level: 'bachelor' }

type Tab = 'basic' | 'details' | 'costs' | 'requirements' | 'social' | 'rankings' | 'deadlines' | 'majors'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic',        label: 'Основное'       },
  { id: 'details',      label: 'Детали'         },
  { id: 'costs',        label: 'Стоимость'      },
  { id: 'requirements', label: 'Требования'     },
  { id: 'majors',       label: 'Специальности'  },
  { id: 'social',       label: 'Соцсети'    },
  { id: 'rankings',     label: 'Рейтинги'   },
  { id: 'deadlines',    label: 'Дедлайны'   },
]

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [countries,    setCountries]    = useState<Country[]>([])
  const [open,       setOpen]       = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [form,       setForm]       = useState({ ...EMPTY })
  const [saving,     setSaving]     = useState(false)
  const [search,     setSearch]     = useState('')
  const [tab,        setTab]        = useState<Tab>('basic')

  // Rankings state
  const [rankings,       setRankings]       = useState<Ranking[]>([])
  const [rankSources,    setRankSources]    = useState<RankingSource[]>([])
  const [rankForm,       setRankForm]       = useState({ ...EMPTY_RANKING })
  const [rankEditId,     setRankEditId]     = useState<string | null>(null)
  const [rankSaving,     setRankSaving]     = useState(false)
  const [addSource,      setAddSource]      = useState(false)
  const [newSourceName,  setNewSourceName]  = useState('')

  // Deadlines state
  const [deadlines,      setDeadlines]      = useState<Deadline[]>([])
  const [dlForm,         setDlForm]         = useState({ ...EMPTY_DEADLINE })
  const [dlEditId,       setDlEditId]       = useState<string | null>(null)
  const [dlSaving,       setDlSaving]       = useState(false)

  // Majors state
  const [allMajors,      setAllMajors]      = useState<Major[]>([])
  const [uniMajors,      setUniMajors]      = useState<UniversityMajor[]>([])
  const [umForm,         setUmForm]         = useState({ ...EMPTY_UMAJOR })
  const [umEditId,       setUmEditId]       = useState<string | null>(null)
  const [umSaving,       setUmSaving]       = useState(false)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: u, error: uErr }, { data: c }, { data: s }, { data: m }] = await Promise.all([
      supabase.from('universities').select('*').order('name'),
      supabase.from('countries').select('id, name').order('name'),
      supabase.from('ranking_sources').select('id, name').order('name'),
      supabase.from('majors').select('id, name, code').order('name'),
    ])
    if (uErr) console.error('Admin universities load error:', uErr)
    setUniversities((u ?? []) as University[])
    setCountries(c ?? [])
    setRankSources(s ?? [])
    setAllMajors(m ?? [])
  }

  const loadRankings = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('university_rankings')
      .select('id, ranking_source_id, year, position, score, source:ranking_sources(name)')
      .eq('university_id', uid)
      .order('year', { ascending: false })
    setRankings((data ?? []) as unknown as Ranking[])
  }, [supabase])

  const loadDeadlines = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('university_deadlines')
      .select('id, type, date, date_end, description')
      .eq('university_id', uid)
      .order('date')
    setDeadlines((data ?? []) as Deadline[])
  }, [supabase])

  const loadUniMajors = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('university_majors')
      .select('id, major_id, degree_level, major:majors(id, name, code)')
      .eq('university_id', uid)
      .order('major_id')
    if (error) console.error('Load university_majors error:', error.message, error.code)
    console.log('Loaded university_majors:', data)
    setUniMajors((data ?? []) as unknown as UniversityMajor[])
  }, [supabase])

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setRankings([])
    setDeadlines([])
    setUniMajors([])
    setTab('basic')
    setOpen(true)
  }

  function openEdit(u: University) {
    setEditingId(u.id)
    setForm({
      name:               u.name,
      name_ru:            u.name_ru ?? '',
      type:               u.type ?? 'national',
      website_url:        u.website_url ?? '',
      description_short:  u.description_short ?? '',
      description_full:   u.description_full  ?? '',
      key_features:       u.key_features ?? '',
      photo_url:          u.photo_url ?? '',
      logo_url:           u.logo_url ?? '',
      main_country_id:    u.main_country_id ?? '',
      has_dormitory:      u.has_dormitory,
      has_campus:         u.has_campus,
      aliases:            u.aliases ?? '',
      campus_format:      u.campus_format ?? '',
      infra_0:            u.infrastructure?.[0] ?? '',
      infra_1:            u.infrastructure?.[1] ?? '',
      infra_2:            u.infrastructure?.[2] ?? '',
      infra_3:            u.infrastructure?.[3] ?? '',
      infra_4:            u.infrastructure?.[4] ?? '',
      infra_5:            u.infrastructure?.[5] ?? '',
      tuition_usd:        u.tuition_usd?.toString() ?? '',
      tuition_usd_max:    u.tuition_usd_max?.toString() ?? '',
      housing_usd:        u.housing_usd?.toString() ?? '',
      housing_usd_max:    u.housing_usd_max?.toString() ?? '',
      total_cost_note:    u.total_cost_note ?? '',
      gpa_min:            u.gpa_min?.toString() ?? '',
      sat_min:            (u as any).sat_min?.toString() ?? '',
      act_min:            u.act_min?.toString() ?? '',
      ent_min:            (u as any).ent_min?.toString() ?? '',
      ielts_min:          u.ielts_min?.toString() ?? '',
      toefl_min:          u.toefl_min?.toString() ?? '',
      documents_required: (u.documents_required ?? []).join('\n'),
      degree_language:    u.degree_language ?? '',
      degree_duration:    u.degree_duration?.toString() ?? '',
      acceptance_rate:    u.acceptance_rate?.toString() ?? '',
      selection_criteria: u.selection_criteria ?? '',
      social_instagram:   u.social_instagram ?? '',
      social_youtube:     u.social_youtube ?? '',
      social_linkedin:    u.social_linkedin ?? '',
      social_facebook:    u.social_facebook ?? '',
      social_x:           u.social_x ?? '',
    })
    loadRankings(u.id)
    loadDeadlines(u.id)
    loadUniMajors(u.id)
    setTab('basic')
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY })
    setRankings([])
    setDeadlines([])
    setUniMajors([])
    resetRankForm()
    resetDlForm()
    resetUmForm()
  }

  function resetRankForm() { setRankForm({ ...EMPTY_RANKING }); setRankEditId(null) }
  function resetDlForm()   { setDlForm({ ...EMPTY_DEADLINE });  setDlEditId(null) }
  function resetUmForm()   { setUmForm({ ...EMPTY_UMAJOR });    setUmEditId(null) }

  function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
  }

  function parseLines(str: string): string[] | null {
    const arr = str.split('\n').map(s => s.trim()).filter(Boolean)
    return arr.length ? arr : null
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name:               form.name.trim(),
      name_ru:            form.name_ru || null,
      type:               form.type || null,
      website_url:        form.website_url || null,
      description_short:  form.description_short || null,
      description_full:   form.description_full  || null,
      key_features:       form.key_features || null,
      photo_url:          form.photo_url || null,
      logo_url:           form.logo_url || null,
      main_country_id:    form.main_country_id || null,
      has_dormitory:      form.has_dormitory,
      has_campus:         form.has_campus,
      aliases:            form.aliases || null,
      campus_format:      form.campus_format || null,
      infrastructure:     [form.infra_0, form.infra_1, form.infra_2, form.infra_3, form.infra_4, form.infra_5].map(s => s.trim()).filter(Boolean).length
                          ? [form.infra_0, form.infra_1, form.infra_2, form.infra_3, form.infra_4, form.infra_5].map(s => s.trim())
                          : null,
      tuition_usd:        form.tuition_usd     ? parseInt(form.tuition_usd)     : null,
      tuition_usd_max:    form.tuition_usd_max ? parseInt(form.tuition_usd_max) : null,
      housing_usd:        form.housing_usd     ? parseInt(form.housing_usd)     : null,
      housing_usd_max:    form.housing_usd_max ? parseInt(form.housing_usd_max) : null,
      total_cost_note:    form.total_cost_note || null,
      gpa_min:            form.gpa_min         ? clamp(parseFloat(form.gpa_min), 0, 4) : null,
      sat_min:            form.sat_min         ? clamp(parseInt(form.sat_min),    400, 1600) : null,
      act_min:            form.act_min         ? clamp(parseInt(form.act_min),    1, 36)     : null,
      ent_min:            form.ent_min         ? clamp(parseInt(form.ent_min),    0, 140)    : null,
      ielts_min:          form.ielts_min       ? clamp(parseFloat(form.ielts_min),0, 9)      : null,
      toefl_min:          form.toefl_min       ? clamp(parseInt(form.toefl_min),  0, 120)    : null,
      documents_required: parseLines(form.documents_required),
      degree_language:    form.degree_language || null,
      degree_duration:    form.degree_duration ? parseInt(form.degree_duration) : null,
      acceptance_rate:    form.acceptance_rate ? clamp(parseFloat(form.acceptance_rate), 0, 100) : null,
      selection_criteria: form.selection_criteria || null,
      social_instagram:   form.social_instagram || null,
      social_youtube:     form.social_youtube   || null,
      social_linkedin:    form.social_linkedin  || null,
      social_facebook:    form.social_facebook  || null,
      social_x:           form.social_x         || null,
    }
    if (editingId) {
      await supabase.from('universities').update(payload).eq('id', editingId)
    } else {
      const { data } = await supabase.from('universities').insert(payload).select('id').single()
      if (data) setEditingId(data.id)
    }
    setSaving(false)
    load()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить «${name}»?`)) return
    await supabase.from('universities').delete().eq('id', id)
    load()
  }

  /* ── Rankings CRUD ────────────────────────────────── */
  async function handleAddSource() {
    if (!newSourceName.trim()) return
    const { data } = await supabase.from('ranking_sources').insert({ name: newSourceName.trim() }).select().single()
    if (data) setRankSources(prev => [...prev, data])
    setNewSourceName('')
    setAddSource(false)
  }

  async function handleSaveRanking() {
    if (!editingId || !rankForm.ranking_source_id || !rankForm.year || !rankForm.position) return
    setRankSaving(true)
    const payload = {
      university_id:     editingId,
      ranking_source_id: rankForm.ranking_source_id,
      year:              parseInt(rankForm.year),
      position:          parseInt(rankForm.position),
      score:             rankForm.score ? parseFloat(rankForm.score) : null,
    }
    if (rankEditId) {
      await supabase.from('university_rankings').update(payload).eq('id', rankEditId)
    } else {
      await supabase.from('university_rankings').insert(payload)
    }
    setRankSaving(false)
    resetRankForm()
    loadRankings(editingId)
  }

  async function handleDeleteRanking(id: string) {
    if (!editingId) return
    await supabase.from('university_rankings').delete().eq('id', id)
    loadRankings(editingId)
  }

  function editRanking(r: Ranking) {
    setRankEditId(r.id)
    setRankForm({
      ranking_source_id: r.ranking_source_id,
      year:              r.year.toString(),
      position:          r.position.toString(),
      score:             r.score?.toString() ?? '',
    })
  }

  /* ── Deadlines CRUD ───────────────────────────────── */
  async function handleSaveDeadline() {
    const type = dlForm.type === '__custom__' ? dlForm.custom_type.trim() : dlForm.type
    if (!editingId || !type || !dlForm.date) return
    setDlSaving(true)
    const payload = {
      university_id: editingId,
      type,
      date:        dlForm.date,
      date_end:    dlForm.date_end || null,
      description: dlForm.description || null,
    }
    if (dlEditId) {
      await supabase.from('university_deadlines').update(payload).eq('id', dlEditId)
    } else {
      await supabase.from('university_deadlines').insert(payload)
    }
    setDlSaving(false)
    resetDlForm()
    loadDeadlines(editingId)
  }

  async function handleDeleteDeadline(id: string) {
    if (!editingId) return
    await supabase.from('university_deadlines').delete().eq('id', id)
    loadDeadlines(editingId)
  }

  function editDeadline(d: Deadline) {
    setDlEditId(d.id)
    const isKnown = DEADLINE_TYPES.includes(d.type)
    setDlForm({
      type:        isKnown ? d.type : '__custom__',
      custom_type: isKnown ? '' : d.type,
      date:        d.date.slice(0, 10),
      date_end:    d.date_end ? d.date_end.slice(0, 10) : '',
      description: d.description ?? '',
    })
  }

  /* ── University Majors CRUD ──────────────────────── */
  async function handleSaveUmajor() {
    if (!editingId || !umForm.major_id) return
    setUmSaving(true)
    const payload = {
      university_id: editingId,
      major_id:      umForm.major_id,
      degree_level:  umForm.degree_level || null,
    }
    if (umEditId) {
      const { error } = await supabase.from('university_majors').update(payload).eq('id', umEditId)
      if (error) console.error('Update university_major error:', error)
    } else {
      const { error } = await supabase.from('university_majors').insert(payload)
      if (error) console.error('Insert university_major error:', error.message, error.code, error.details, error.hint)
    }
    setUmSaving(false)
    resetUmForm()
    loadUniMajors(editingId)
  }

  async function handleDeleteUmajor(id: string) {
    if (!editingId) return
    await supabase.from('university_majors').delete().eq('id', id)
    loadUniMajors(editingId)
  }

  function editUmajor(um: UniversityMajor) {
    setUmEditId(um.id)
    setUmForm({
      major_id:      um.major_id,
      degree_level:  um.degree_level ?? 'bachelor'
    })
  }

  const f = (key: keyof typeof EMPTY) => form[key] as string
  const set = (key: keyof typeof EMPTY, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }))

  const filtered = universities.filter(u => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || (u.aliases?.toLowerCase().includes(q) ?? false)
  })

  const canSaveRank = !!rankForm.ranking_source_id && !!rankForm.year && !!rankForm.position
  const canSaveDl   = !!(dlForm.type === '__custom__' ? dlForm.custom_type.trim() : dlForm.type) && !!dlForm.date
  const canSaveUm   = !!umForm.major_id

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
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Редактировать университет' : 'Новый университет'}
              </h2>
              <button onClick={closeModal} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pb-2 shrink-0 border-b border-[var(--border)] overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                    tab === t.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">

              {/* ── TAB: Basic ── */}
              {tab === 'basic' && (
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Название *</span>
                    <input className="inp" value={f('name')} onChange={e => set('name', e.target.value)} placeholder="MIT" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Название (рус.)</span>
                    <input className="inp" value={f('name_ru')} onChange={e => set('name_ru', e.target.value)} placeholder="МИТ" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Тип</span>
                      <select className="inp" value={f('type')} onChange={e => set('type', e.target.value)}>
                        <option value="national">Национальный</option>
                        <option value="technical">Технический</option>
                        <option value="private">Частный</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Страна</span>
                      <select className="inp" value={f('main_country_id')} onChange={e => set('main_country_id', e.target.value)}>
                        <option value="">— выбрать —</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Формат кампуса</span>
                      <input className="inp" value={f('campus_format')} onChange={e => set('campus_format', e.target.value)} placeholder="Urban, Suburban, Rural..." />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Сайт</span>
                      <input className="inp" value={f('website_url')} onChange={e => set('website_url', e.target.value)} placeholder="https://mit.edu" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Фото (URL)</span>
                    <input className="inp" value={f('photo_url')} onChange={e => set('photo_url', e.target.value)} placeholder="https://..." />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Логотип (URL)</span>
                    <input className="inp" value={f('logo_url')} onChange={e => set('logo_url', e.target.value)} placeholder="https://...logo.png" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Псевдонимы для поиска</span>
                    <input className="inp" value={f('aliases')} onChange={e => set('aliases', e.target.value)} placeholder="МИТ, MIT, Массачусетс" />
                    <span className="text-xs text-[var(--text-quaternary)]">Через запятую</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.has_dormitory} onChange={e => set('has_dormitory', e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                      <span className="text-sm text-[var(--text-secondary)]">Общежитие</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.has_campus} onChange={e => set('has_campus', e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                      <span className="text-sm text-[var(--text-secondary)]">Кампус</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── TAB: Details ── */}
              {tab === 'details' && (
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Краткое описание</span>
                    <input className="inp" value={f('description_short')} onChange={e => set('description_short', e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Полное описание (3-4 предложения)</span>
                    <textarea className="inp resize-none h-28" value={f('description_full')} onChange={e => set('description_full', e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Ключевые особенности и репутация</span>
                    <textarea className="inp resize-none h-20" value={f('key_features')} onChange={e => set('key_features', e.target.value)} placeholder="Что делает этот университет особенным..." />
                  </label>
                  <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mt-2">Инфраструктура (6 ячеек на странице)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {INFRA_FIELDS.map(({ key, label, placeholder }) => (
                      <label key={key} className="flex flex-col gap-1">
                        <span className="admin-label">{label}</span>
                        <input
                          className="inp"
                          value={f(key as keyof typeof EMPTY)}
                          onChange={e => set(key as keyof typeof EMPTY, e.target.value)}
                          placeholder={placeholder}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Язык обучения</span>
                      <input className="inp" value={f('degree_language')} onChange={e => set('degree_language', e.target.value)} placeholder="English" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Длительность бакалавриата (лет)</span>
                      <input type="number" className="inp" value={f('degree_duration')} onChange={e => set('degree_duration', e.target.value)} placeholder="4" min="1" max="6" />
                    </label>
                  </div>
                </div>
              )}

              {/* ── TAB: Costs ── */}
              {tab === 'costs' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-[var(--text-tertiary)]">Актуальные данные на учебный год. Сумма в долларах США (USD). Если стоимость фиксирована — заполни только минимум.</p>
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">Tuition / год ($)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="admin-label">От</span>
                        <input type="number" className="inp" value={f('tuition_usd')} onChange={e => set('tuition_usd', e.target.value)} placeholder="40000" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="admin-label">До (необязательно)</span>
                        <input type="number" className="inp" value={f('tuition_usd_max')} onChange={e => set('tuition_usd_max', e.target.value)} placeholder="60000" />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">Проживание / год ($)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="admin-label">От</span>
                        <input type="number" className="inp" value={f('housing_usd')} onChange={e => set('housing_usd', e.target.value)} placeholder="10000" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="admin-label">До (необязательно)</span>
                        <input type="number" className="inp" value={f('housing_usd_max')} onChange={e => set('housing_usd_max', e.target.value)} placeholder="20000" />
                      </label>
                    </div>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Примечание к стоимости</span>
                    <input className="inp" value={f('total_cost_note')} onChange={e => set('total_cost_note', e.target.value)} placeholder="Включает питание и базовые сборы. Данные за 2024-25 уч. год." />
                  </label>
                </div>
              )}

              {/* ── TAB: Requirements ── */}
              {tab === 'requirements' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-[var(--text-tertiary)]">Минимальные требования для поступления на бакалавриат.</p>
                  <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mt-2">Тесты и баллы</p>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">GPA</span>
                      <input type="number" step="0.1" className="inp" value={f('gpa_min')} onChange={e => set('gpa_min', e.target.value)} placeholder="3.8" min="0" max="4" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">0.0 – 4.0</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">SAT</span>
                      <input type="number" className="inp" value={f('sat_min')} onChange={e => set('sat_min', e.target.value)} placeholder="1400" min="400" max="1600" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">400 – 1600</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">ACT</span>
                      <input type="number" className="inp" value={f('act_min')} onChange={e => set('act_min', e.target.value)} placeholder="34" min="1" max="36" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">1 – 36</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">ЕНТ</span>
                      <input type="number" className="inp" value={f('ent_min')} onChange={e => set('ent_min', e.target.value)} placeholder="120" min="0" max="140" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">0 – 140</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">IELTS</span>
                      <input type="number" step="0.5" className="inp" value={f('ielts_min')} onChange={e => set('ielts_min', e.target.value)} placeholder="7.0" min="0" max="9" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">0.0 – 9.0</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">TOEFL</span>
                      <input type="number" className="inp" value={f('toefl_min')} onChange={e => set('toefl_min', e.target.value)} placeholder="100" min="0" max="120" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">0 – 120</span>
                    </label>
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mt-4">Документы</p>
                  <label className="flex flex-col gap-1.5">
                    <textarea
                      className="inp resize-none h-36"
                      value={f('documents_required')}
                      onChange={e => set('documents_required', e.target.value)}
                      placeholder={"Транскрипты (аттестат / диплом)\nРекомендательные письма (2-3)\nМотивационное эссе (Common App Essay)\nSAT/ACT результаты\nПортфолио (для творческих направлений)\nСертификат IELTS/TOEFL"}
                    />
                    <span className="text-xs text-[var(--text-quaternary)]">Каждый документ с новой строки</span>
                  </label>
                  <p className="text-[10px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider mt-4">Конкурентность</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="admin-label">Acceptance Rate (%)</span>
                      <input type="number" step="0.1" className="inp" value={f('acceptance_rate')} onChange={e => set('acceptance_rate', e.target.value)} placeholder="4.7" min="0" max="100" />
                      <span className="text-[10px] text-[var(--text-quaternary)]">0 – 100%</span>
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">На что смотрят при отборе</span>
                    <textarea className="inp resize-none h-24" value={f('selection_criteria')} onChange={e => set('selection_criteria', e.target.value)} placeholder="Академические достижения, лидерство, внеклассная активность, оригинальность эссе..." />
                  </label>
                </div>
              )}

              {/* ── TAB: Social ── */}
              {tab === 'social' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-[var(--text-tertiary)]">Ссылки на официальные аккаунты университета.</p>
                  {[
                    { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'social_youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@...' },
                    { key: 'social_linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/school/...' },
                    { key: 'social_facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
                    { key: 'social_x',         label: 'X (Twitter)', placeholder: 'https://x.com/...' },
                  ].map(({ key, label, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1.5">
                      <span className="admin-label">{label}</span>
                      <input className="inp" value={f(key as keyof typeof EMPTY)} onChange={e => set(key as keyof typeof EMPTY, e.target.value)} placeholder={placeholder} />
                    </label>
                  ))}
                </div>
              )}

              {/* ── TAB: Majors ── */}
              {tab === 'majors' && (
                <div className="flex flex-col gap-4">
                  {!editingId ? (
                    <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">Сначала сохраните университет, затем добавляйте специальности.</p>
                  ) : (
                    <>
                      {/* Add/Edit form */}
                      <div className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">
                          {umEditId ? 'Редактировать' : 'Добавить специальность'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Специальность *</span>
                            <select className="inp" value={umForm.major_id} onChange={e => setUmForm(f => ({ ...f, major_id: e.target.value }))}>
                              <option value="">— выбрать —</option>
                              {allMajors.map(m => <option key={m.id} value={m.id}>{m.name}{m.code ? ` (${m.code})` : ''}</option>)}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Уровень</span>
                            <select className="inp" value={umForm.degree_level} onChange={e => setUmForm(f => ({ ...f, degree_level: e.target.value }))}>
                              {DEGREE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          {umEditId && (
                            <button onClick={resetUmForm} className="btn-secondary text-xs flex-1">Отмена</button>
                          )}
                          <button onClick={handleSaveUmajor} disabled={umSaving || !canSaveUm} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5">
                            {umSaving && <Loader2 size={12} className="animate-spin" />}
                            {umEditId ? 'Сохранить' : 'Добавить'}
                          </button>
                        </div>
                      </div>

                      {/* List */}
                      {uniMajors.length > 0 ? (
                        <div className="space-y-2">
                          {uniMajors.map(um => (
                            <div key={um.id} className="border border-[var(--border)] rounded-xl p-3 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)]">{um.major?.name ?? '?'}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {um.degree_level && (
                                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                                      {DEGREE_OPTIONS.find(d => d.value === um.degree_level)?.label ?? um.degree_level}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button onClick={() => editUmajor(um)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition mt-1">
                                <Pencil size={13} strokeWidth={1.5} />
                              </button>
                              <button onClick={() => handleDeleteUmajor(um.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition mt-1">
                                <Trash2 size={13} strokeWidth={1.5} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-quaternary)] text-center py-4">Специальностей пока нет</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: Rankings ── */}
              {tab === 'rankings' && (
                <div className="flex flex-col gap-4">
                  {!editingId ? (
                    <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">Сначала сохраните университет, затем добавляйте рейтинги.</p>
                  ) : (
                    <>
                      {/* Add/Edit ranking form */}
                      <div className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">
                          {rankEditId ? 'Редактировать рейтинг' : 'Добавить рейтинг'}
                        </p>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="admin-label">Источник *</span>
                            <button onClick={() => setAddSource(v => !v)} className="text-xs text-[var(--accent)] hover:underline">+ Новый</button>
                          </div>
                          {addSource && (
                            <div className="flex gap-2 mb-2">
                              <input className="inp flex-1" placeholder="QS, THE..." value={newSourceName} onChange={e => setNewSourceName(e.target.value)} />
                              <button onClick={handleAddSource} className="btn-primary text-xs px-3">OK</button>
                            </div>
                          )}
                          <select className="inp w-full" value={rankForm.ranking_source_id} onChange={e => setRankForm(f => ({ ...f, ranking_source_id: e.target.value }))}>
                            <option value="">— выбрать —</option>
                            {rankSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Год *</span>
                            <input type="number" className="inp" value={rankForm.year} onChange={e => setRankForm(f => ({ ...f, year: e.target.value }))} placeholder="2025" />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Позиция *</span>
                            <input type="number" className="inp" value={rankForm.position} onChange={e => setRankForm(f => ({ ...f, position: e.target.value }))} placeholder="1" min="1" />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Балл</span>
                            <input type="number" step="0.1" className="inp" value={rankForm.score} onChange={e => setRankForm(f => ({ ...f, score: e.target.value }))} placeholder="95.2" />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          {rankEditId && (
                            <button onClick={resetRankForm} className="btn-secondary text-xs flex-1">Отмена</button>
                          )}
                          <button onClick={handleSaveRanking} disabled={rankSaving || !canSaveRank} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5">
                            {rankSaving && <Loader2 size={12} className="animate-spin" />}
                            {rankEditId ? 'Сохранить' : 'Добавить'}
                          </button>
                        </div>
                      </div>

                      {/* Rankings list */}
                      {rankings.length > 0 ? (
                        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="text-left p-3 t-label font-medium text-xs">Рейтинг</th>
                                <th className="text-left p-3 t-label font-medium text-xs">Год</th>
                                <th className="text-left p-3 t-label font-medium text-xs">Позиция</th>
                                <th className="text-left p-3 t-label font-medium text-xs">Балл</th>
                                <th className="p-3 w-16" />
                              </tr>
                            </thead>
                            <tbody>
                              {rankings.map(r => (
                                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                                  <td className="p-3 text-[var(--text-secondary)]">{r.source?.name ?? '—'}</td>
                                  <td className="p-3 text-[var(--text-tertiary)]">{r.year}</td>
                                  <td className="p-3 text-violet-400 font-bold">#{r.position}</td>
                                  <td className="p-3 text-[var(--text-tertiary)]">{r.score ?? '—'}</td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2 justify-end">
                                      <button onClick={() => editRanking(r)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                                        <Pencil size={13} strokeWidth={1.5} />
                                      </button>
                                      <button onClick={() => handleDeleteRanking(r.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                                        <Trash2 size={13} strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-quaternary)] text-center py-4">Рейтингов пока нет</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: Deadlines ── */}
              {tab === 'deadlines' && (
                <div className="flex flex-col gap-4">
                  {!editingId ? (
                    <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">Сначала сохраните университет, затем добавляйте дедлайны.</p>
                  ) : (
                    <>
                      {/* Add/Edit deadline form */}
                      <div className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">
                          {dlEditId ? 'Редактировать дедлайн' : 'Добавить дедлайн'}
                        </p>
                        <label className="flex flex-col gap-1">
                          <span className="admin-label">Тип *</span>
                          <select className="inp" value={dlForm.type} onChange={e => setDlForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="">— выбрать —</option>
                            {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="__custom__">Другой (ввести вручную)</option>
                          </select>
                        </label>
                        {dlForm.type === '__custom__' && (
                          <input className="inp" placeholder="Введите тип дедлайна" value={dlForm.custom_type} onChange={e => setDlForm(f => ({ ...f, custom_type: e.target.value }))} />
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Дата начала *</span>
                            <input type="date" className="inp" value={dlForm.date} onChange={e => setDlForm(f => ({ ...f, date: e.target.value }))} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="admin-label">Дата окончания</span>
                            <input type="date" className="inp" value={dlForm.date_end} onChange={e => setDlForm(f => ({ ...f, date_end: e.target.value }))} />
                          </label>
                        </div>
                        <label className="flex flex-col gap-1">
                          <span className="admin-label">Описание</span>
                          <input className="inp" value={dlForm.description} onChange={e => setDlForm(f => ({ ...f, description: e.target.value }))} placeholder="Необязательно" />
                        </label>
                        <div className="flex gap-2">
                          {dlEditId && (
                            <button onClick={resetDlForm} className="btn-secondary text-xs flex-1">Отмена</button>
                          )}
                          <button onClick={handleSaveDeadline} disabled={dlSaving || !canSaveDl} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5">
                            {dlSaving && <Loader2 size={12} className="animate-spin" />}
                            {dlEditId ? 'Сохранить' : 'Добавить'}
                          </button>
                        </div>
                      </div>

                      {/* Deadlines list */}
                      {deadlines.length > 0 ? (
                        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="text-left p-3 t-label font-medium text-xs">Тип</th>
                                <th className="text-left p-3 t-label font-medium text-xs">Дата</th>
                                <th className="text-left p-3 t-label font-medium text-xs">Описание</th>
                                <th className="p-3 w-16" />
                              </tr>
                            </thead>
                            <tbody>
                              {deadlines.map(d => (
                                  <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                                    <td className="p-3 text-[var(--text-secondary)]">{d.type}</td>
                                    <td className="p-3 font-medium text-amber-400">
                                      {d.date}
                                      {d.date_end && (
                                        <span className="text-[var(--text-quaternary)] font-normal"> → {d.date_end}</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-[var(--text-tertiary)] max-w-[140px] truncate">{d.description ?? '—'}</td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2 justify-end">
                                        <button onClick={() => editDeadline(d)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                                          <Pencil size={13} strokeWidth={1.5} />
                                        </button>
                                        <button onClick={() => handleDeleteDeadline(d.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                                          <Trash2 size={13} strokeWidth={1.5} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-quaternary)] text-center py-4">Дедлайнов пока нет</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)] shrink-0">
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
