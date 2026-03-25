'use client'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  saved: boolean
  saving?: boolean
  onEdit: () => void
  onSave: () => void
  onChange: (profile: Partial<UserProfile>) => void
}

const inp = 'w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-40 disabled:cursor-default [&>option]:bg-[#0f1629]'
const lbl = 'block text-slate-500 text-xs mb-1.5'

export default function ProfileForm({ profile, editing, saved, saving, onEdit, onSave, onChange }: Props) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mt-4">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Личная информация</h2>
        <button onClick={onEdit} className="text-xs text-slate-500 hover:text-indigo-400 transition font-medium">
          {editing ? 'Отмена' : 'Изменить'}
        </button>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className={lbl}>Полное имя</label>
          <input className={inp} value={profile.full_name || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, full_name: e.target.value })} />
        </div>

        <div>
          <label className={lbl}>Никнейм</label>
          <input className={inp} placeholder="например: aibek_kz" value={profile.nickname || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, nickname: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Город</label>
            <input className={inp} placeholder="Алматы" value={profile.city || ''} disabled={!editing}
              onChange={e => onChange({ ...profile, city: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Класс</label>
            <select className={inp} value={profile.grade || ''} disabled={!editing}
              onChange={e => onChange({ ...profile, grade: parseInt(e.target.value) })}>
              <option value="">— класс</option>
              {[8, 9, 10, 11].map(g => <option key={g} value={g}>{g} класс</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Школа</label>
          <input className={inp} placeholder="НИШ Алматы" value={profile.school || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, school: e.target.value })} />
        </div>

        <div>
          <label className={lbl}>О себе</label>
          <textarea className={`${inp} h-20 resize-none`} placeholder="Расскажи о себе..." value={profile.bio || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, bio: e.target.value })} />
        </div>
      </div>

      {editing && (
        <button onClick={onSave} disabled={saving}
          className="w-full mt-5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      )}
      {saved && <p className="text-emerald-400 text-center text-xs mt-3">Сохранено</p>}
    </div>
  )
}
