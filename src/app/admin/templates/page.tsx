'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'

interface Template {
  id: string
  title: string
  description: string | null
  source_type: string
  month: number
  day: number
  condition_field: string | null
  condition_op: string | null
  condition_value: string | null
  condition2_field: string | null
  condition2_op: string | null
  condition2_value: string | null
  is_active: boolean
  sort_order: number
}

const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

const CONDITION_FIELDS = [
  { value: '', label: '— нет —' },
  { value: 'ent_score', label: 'ЕНТ' },
  { value: 'ielts_score', label: 'IELTS' },
  { value: 'sat_score', label: 'SAT' },
  { value: 'target_university', label: 'Целевой университет' },
  { value: 'target_country', label: 'Целевая страна' },
]

const CONDITION_OPS = [
  { value: 'missing',    label: 'не заполнено' },
  { value: 'present',    label: 'заполнено' },
  { value: 'equals',     label: '=' },
  { value: 'not_equals', label: '≠' },
]

const EMPTY_FORM = {
  title: '', description: '', source_type: 'profile_goal',
  month: 1, day: 1,
  condition_field: '', condition_op: 'missing', condition_value: '',
  condition2_field: '', condition2_op: 'missing', condition2_value: '',
  is_active: true, sort_order: 0,
}

export default function TemplatesAdminPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from('event_templates')
      .select('*')
      .order('sort_order', { ascending: true })
    setTemplates(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(t: Template) {
    setEditId(t.id)
    setForm({
      title: t.title,
      description: t.description ?? '',
      source_type: t.source_type,
      month: t.month,
      day: t.day,
      condition_field: t.condition_field ?? '',
      condition_op: t.condition_op ?? 'missing',
      condition_value: t.condition_value ?? '',
      condition2_field: t.condition2_field ?? '',
      condition2_op: t.condition2_op ?? 'missing',
      condition2_value: t.condition2_value ?? '',
      is_active: t.is_active,
      sort_order: t.sort_order,
    })
    setShowForm(true)
  }

  function startAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  async function save() {
    if (!form.title || !form.month || !form.day) return
    const supabase = createSupabaseBrowserClient()
    const payload = {
      title: form.title,
      description: form.description || null,
      source_type: form.source_type,
      month: form.month,
      day: form.day,
      condition_field: form.condition_field || null,
      condition_op: form.condition_field ? form.condition_op : null,
      condition_value: form.condition_value || null,
      condition2_field: form.condition2_field || null,
      condition2_op: form.condition2_field ? form.condition2_op : null,
      condition2_value: form.condition2_value || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
      type: form.source_type,
    }
    if (editId) {
      await supabase.from('event_templates').update(payload).eq('id', editId)
    } else {
      await supabase.from('event_templates').insert(payload)
    }
    setShowForm(false)
    setEditId(null)
    load()
  }

  async function remove(id: string) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('event_templates').delete().eq('id', id)
    setTemplates(t => t.filter(x => x.id !== id))
  }

  async function toggleActive(t: Template) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from('event_templates').update({ is_active: !t.is_active }).eq('id', t.id)
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
  }

  const f = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Шаблоны событий</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Управление автоматическими событиями календаря</p>
        </div>
        <button onClick={startAdd} className="btn-primary flex items-center gap-2">
          <Plus size={14} strokeWidth={1.5} /> Добавить
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="t-label">{editId ? 'Редактировать шаблон' : 'Новый шаблон'}</p>
            <button onClick={() => setShowForm(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="t-label mb-1 block">Название <span className="text-red-400">*</span></label>
              <input className="inp" placeholder="📝 Зарегистрироваться на ЕНТ" value={form.title} onChange={e => f('title', e.target.value)} />
              <p className="text-xs text-[var(--text-quaternary)] mt-1">Используй {'{{target_university}}'} для подстановки данных профиля</p>
            </div>

            <div className="md:col-span-2">
              <label className="t-label mb-1 block">Описание</label>
              <input className="inp" placeholder="Описание события" value={form.description} onChange={e => f('description', e.target.value)} />
            </div>

            <div>
              <label className="t-label mb-1 block">Месяц <span className="text-red-400">*</span></label>
              <select className="inp" value={form.month} onChange={e => f('month', +e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="t-label mb-1 block">День <span className="text-red-400">*</span></label>
              <input type="number" min={1} max={31} className="inp" value={form.day} onChange={e => f('day', +e.target.value)} />
            </div>

            {/* Condition 1 */}
            <div className="md:col-span-2 border-t border-[var(--border)] pt-3 mt-1">
              <p className="t-label mb-2">Условие показа (если...)</p>
              <div className="grid grid-cols-3 gap-2">
                <select className="inp" value={form.condition_field} onChange={e => f('condition_field', e.target.value)}>
                  {CONDITION_FIELDS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="inp" value={form.condition_op} onChange={e => f('condition_op', e.target.value)} disabled={!form.condition_field}>
                  {CONDITION_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input className="inp" placeholder="Значение (для = и ≠)" value={form.condition_value} onChange={e => f('condition_value', e.target.value)}
                  disabled={!form.condition_field || ['missing','present'].includes(form.condition_op)} />
              </div>
            </div>

            {/* Condition 2 */}
            <div className="md:col-span-2">
              <p className="t-label mb-2">И ещё условие (необязательно)</p>
              <div className="grid grid-cols-3 gap-2">
                <select className="inp" value={form.condition2_field} onChange={e => f('condition2_field', e.target.value)}>
                  {CONDITION_FIELDS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="inp" value={form.condition2_op} onChange={e => f('condition2_op', e.target.value)} disabled={!form.condition2_field}>
                  {CONDITION_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input className="inp" placeholder="Значение (для = и ≠)" value={form.condition2_value} onChange={e => f('condition2_value', e.target.value)}
                  disabled={!form.condition2_field || ['missing','present'].includes(form.condition2_op)} />
              </div>
            </div>

            <div>
              <label className="t-label mb-1 block">Порядок сортировки</label>
              <input type="number" className="inp" value={form.sort_order} onChange={e => f('sort_order', +e.target.value)} />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="is_active" className="t-body text-sm">Активен</label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary flex items-center gap-2">
              <Check size={14} /> Сохранить
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="t-body">Загрузка...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-4 t-label">Название</th>
                <th className="text-left p-4 t-label">Дата</th>
                <th className="text-left p-4 t-label">Условие</th>
                <th className="text-left p-4 t-label">Статус</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4 text-[var(--text-primary)] max-w-xs">
                    <p className="truncate">{t.title}</p>
                    {t.description && <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{t.description}</p>}
                  </td>
                  <td className="p-4 text-[var(--text-secondary)] whitespace-nowrap">
                    {t.day} {MONTHS[(t.month ?? 1) - 1]}
                  </td>
                  <td className="p-4 text-[var(--text-tertiary)] text-xs">
                    {t.condition_field ? (
                      <span>{t.condition_field} {t.condition_op}{t.condition_value ? ` ${t.condition_value}` : ''}</span>
                    ) : <span className="text-[var(--text-quaternary)]">всегда</span>}
                    {t.condition2_field && (
                      <span className="block mt-0.5">+ {t.condition2_field} {t.condition2_op}{t.condition2_value ? ` ${t.condition2_value}` : ''}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${t.is_active ? 'text-emerald-400 border-emerald-500/30' : 'text-[var(--text-quaternary)] border-[var(--border)]'}`}>
                      {t.is_active ? 'Активен' : 'Выкл'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => startEdit(t)} className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(t.id)} className="text-[var(--text-quaternary)] hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
