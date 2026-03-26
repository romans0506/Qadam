'use client'
import { UserProfile } from '@/types/student'
import CustomSelect from '@/components/ui/CustomSelect'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  saved: boolean
  saving?: boolean
  onEdit: () => void
  onSave: () => void
  onChange: (profile: Partial<UserProfile>) => void
}

export default function ProfileForm({ profile, editing, saved, saving, onEdit, onSave, onChange }: Props) {
  return (
    <div className="card p-6 mt-4">
      <div className="flex justify-between items-center mb-5">
        <h2 className="t-label">Личная информация</h2>
        <button onClick={onEdit} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition font-medium">
          {editing ? 'Отмена' : 'Изменить'}
        </button>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="form-label">Полное имя</label>
          <input className="inp" value={profile.full_name || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, full_name: e.target.value })} />
        </div>

        <div>
          <label className="form-label">Никнейм</label>
          <input className="inp" placeholder="например: aibek_kz" value={profile.nickname || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, nickname: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Город</label>
            <input className="inp" placeholder="Алматы" value={profile.city || ''} disabled={!editing}
              onChange={e => onChange({ ...profile, city: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Класс</label>
            <CustomSelect
              value={profile.grade ? String(profile.grade) : ''}
              disabled={!editing}
              placeholder="— класс"
              onChange={v => onChange({ ...profile, grade: parseInt(v) })}
              options={[8, 9, 10, 11].map(g => ({ value: String(g), label: `${g} класс` }))}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Школа</label>
          <input className="inp" placeholder="НИШ Алматы" value={profile.school || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, school: e.target.value })} />
        </div>

        <div>
          <label className="form-label">О себе</label>
          <textarea className="inp" placeholder="Расскажи о себе..." value={profile.bio || ''} disabled={!editing}
            onChange={e => onChange({ ...profile, bio: e.target.value })} />
        </div>
      </div>

      {editing && (
        <button onClick={onSave} disabled={saving} className="btn-primary w-full mt-5">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      )}
      {saved && <p className="text-emerald-400 text-center text-xs mt-3">Сохранено</p>}
    </div>
  )
}
