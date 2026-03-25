'use client'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

const INTERESTS = ['IT', 'Медицина', 'Право', 'Бизнес', 'Инженерия', 'Педагогика', 'Архитектура', 'Психология']
const LANGUAGES = ['Английский', 'Русский', 'Казахский', 'Немецкий', 'Французский', 'Китайский', 'Испанский']

const inp = 'w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-40 disabled:cursor-default'

export default function GoalsSection({ profile, editing, onChange }: Props) {
  const toggleItem = (field: 'interests' | 'languages', value: string) => {
    const current = (profile[field] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value]
    onChange({ ...profile, [field]: updated })
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mt-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Цели и интересы</h2>

      {/* Target inputs */}
      <div className="space-y-3 mb-5">
        <p className="text-slate-400 text-xs font-medium">Цель поступления</p>
        <input className={inp} placeholder="Страна (например: Казахстан, США)"
          value={profile.target_country || ''} disabled={!editing}
          onChange={e => onChange({ ...profile, target_country: e.target.value })} />
        <input className={inp} placeholder="Университет (например: НУ, MIT)"
          value={profile.target_university || ''} disabled={!editing}
          onChange={e => onChange({ ...profile, target_university: e.target.value })} />
        <input className={inp} placeholder="Специальность (например: Computer Science)"
          value={profile.target_specialty || ''} disabled={!editing}
          onChange={e => onChange({ ...profile, target_specialty: e.target.value })} />
      </div>

      {/* Interests */}
      <div className="mb-5">
        <p className="text-slate-400 text-xs font-medium mb-2.5">Направления</p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map(item => {
            const active = (profile.interests || []).includes(item)
            return (
              <button key={item} disabled={!editing} onClick={() => toggleItem('interests', item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                } disabled:cursor-default`}>
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {/* Languages */}
      <div>
        <p className="text-slate-400 text-xs font-medium mb-2.5">Языки</p>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map(lang => {
            const active = (profile.languages || []).includes(lang)
            return (
              <button key={lang} disabled={!editing} onClick={() => toggleItem('languages', lang)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-emerald-500/80 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                } disabled:cursor-default`}>
                {lang}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
