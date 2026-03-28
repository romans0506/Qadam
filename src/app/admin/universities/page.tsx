'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react'

interface University {
  id: string; name: string; name_ru: string | null; type: string | null; website_url: string | null
  description_short: string | null; description_full: string | null; key_features: string | null
  photo_url: string | null; logo_url: string | null; main_country_id: string | null
  has_dormitory: boolean; has_campus: boolean; aliases: string | null
  campus_format: string | null
  infrastructure: string[] | null
  tuition_usd: number | null; housing_usd: number | null; total_cost_note: string | null
  gpa_min: number | null; sat_min: number | null; act_min: number | null; ent_min: number | null
  ielts_min: number | null; toefl_min: number | null
  documents_required: string[] | null
  degree_language: string | null; degree_duration: number | null
  acceptance_rate: number | null; selection_criteria: string | null
  social_instagram: string | null; social_youtube: string | null; social_linkedin: string | null
  social_facebook: string | null; social_x: string | null
}
interface Country { id: string; name: string }

const EMPTY = {
  name: '', name_ru: '', type: 'national', website_url: '', description_short: '',
  description_full: '', key_features: '', photo_url: '', logo_url: '', main_country_id: '',
  has_dormitory: false, has_campus: false, aliases: '', campus_format: '',
  infrastructure: '',
  tuition_usd: '', housing_usd: '', total_cost_note: '',
  gpa_min: '', sat_min: '', act_min: '', ent_min: '', ielts_min: '', toefl_min: '',
  documents_required: '',
  degree_language: '', degree_duration: '',
  acceptance_rate: '', selection_criteria: '',
  social_instagram: '', social_youtube: '', social_linkedin: '', social_facebook: '', social_x: '',
}

type Tab = 'basic' | 'details' | 'costs' | 'requirements' | 'social'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic',        label: 'Основное'        },
  { id: 'details',      label: 'Детали'          },
  { id: 'costs',        label: 'Стоимость'       },
  { id: 'requirements', label: 'Требования'      },
  { id: 'social',       label: 'Соцсети'         },
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

  const supabase = createSupabaseBrowserClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: u, error: uErr }, { data: c }] = await Promise.all([
      supabase.from('universities').select('*').order('name'),
      supabase.from('countries').select('id, name').order('name'),
    ])
    if (uErr) console.error('Admin universities load error:', uErr)
    setUniversities((u ?? []) as University[])
    setCountries(c ?? [])
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY })
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
      infrastructure:     (u.infrastructure ?? []).join('\n'),
      tuition_usd:        u.tuition_usd?.toString() ?? '',
      housing_usd:        u.housing_usd?.toString() ?? '',
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
    setTab('basic')
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY })
  }

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
      infrastructure:     parseLines(form.infrastructure),
      tuition_usd:        form.tuition_usd     ? parseInt(form.tuition_usd)     : null,
      housing_usd:        form.housing_usd     ? parseInt(form.housing_usd)     : null,
      total_cost_note:    form.total_cost_note || null,
      gpa_min:            form.gpa_min         ? clamp(parseFloat(form.gpa_min),  0, 4)     : null,
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

  const f = (key: keyof typeof EMPTY) => form[key] as string
  const set = (key: keyof typeof EMPTY, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }))

  const filtered = universities.filter(u => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || (u.aliases?.toLowerCase().includes(q) ?? false)
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
                  className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
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
                    <span className="admin-label">Фото (URL — героя страницы)</span>
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
                  <label className="flex flex-col gap-1.5">
                    <span className="admin-label">Инфраструктура (каждый пункт с новой строки)</span>
                    <textarea
                      className="inp resize-none h-36"
                      value={f('infrastructure')}
                      onChange={e => set('infrastructure', e.target.value)}
                      placeholder={"Кампус городского типа\nБолее 500 студенческих организаций\nОбщежития для всех первокурсников\nКарьерный центр с выходом на Fortune 500\nМировая лаборатория и исследовательская база"}
                    />
                    <span className="text-xs text-[var(--text-quaternary)]">5-6 пунктов, каждый с новой строки</span>
                  </label>
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
                  <p className="text-xs text-[var(--text-tertiary)]">Актуальные данные на учебный год. Сумма в долларах США (USD).</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Tuition / год ($)</span>
                      <input type="number" className="inp" value={f('tuition_usd')} onChange={e => set('tuition_usd', e.target.value)} placeholder="55000" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="admin-label">Проживание / год ($)</span>
                      <input type="number" className="inp" value={f('housing_usd')} onChange={e => set('housing_usd', e.target.value)} placeholder="18000" />
                    </label>
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

                  {/* Standardized tests */}
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

                  {/* Documents */}
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

                  {/* Competitiveness */}
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
                    { key: 'social_instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'social_youtube',   label: '▶️ YouTube',   placeholder: 'https://youtube.com/@...' },
                    { key: 'social_linkedin',  label: '💼 LinkedIn',  placeholder: 'https://linkedin.com/school/...' },
                    { key: 'social_facebook',  label: '📘 Facebook',  placeholder: 'https://facebook.com/...' },
                    { key: 'social_x',         label: '🐦 X (Twitter)', placeholder: 'https://x.com/...' },
                  ].map(({ key, label, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1.5">
                      <span className="admin-label">{label}</span>
                      <input className="inp" value={f(key as keyof typeof EMPTY)} onChange={e => set(key as keyof typeof EMPTY, e.target.value)} placeholder={placeholder} />
                    </label>
                  ))}
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
