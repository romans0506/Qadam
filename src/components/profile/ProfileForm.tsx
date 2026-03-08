'use client'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  saved: boolean
  onEdit: () => void
  onSave: () => void
  onChange: (profile: Partial<UserProfile>) => void
}

export default function ProfileForm({ profile, editing, saved, onEdit, onSave, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Личная информация</h2>
        <button onClick={onEdit} className="text-blue-600 font-medium hover:underline">
          {editing ? 'Отмена' : '✏️ Изменить'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-500 text-sm mb-1">Полное имя</label>
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            value={profile.full_name || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, full_name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">Никнейм</label>
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="например: aibek_kz"
            value={profile.nickname || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, nickname: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">Город</label>
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="Алматы"
            value={profile.city || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, city: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">Школа</label>
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="НИШ Алматы"
            value={profile.school || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, school: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">Класс</label>
          <select
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            value={profile.grade || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, grade: parseInt(e.target.value)})}
          >
            <option value="">Выбери класс</option>
            {[8,9,10,11].map(g => <option key={g} value={g}>{g} класс</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">О себе</label>
          <textarea
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50 h-24"
            placeholder="Расскажи о себе..."
            value={profile.bio || ''}
            disabled={!editing}
            onChange={e => onChange({...profile, bio: e.target.value})}
          />
        </div>
      </div>

      {editing && (
        <button
          onClick={onSave}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mt-6"
        >
          Сохранить
        </button>
      )}

      {saved && (
        <p className="text-green-500 text-center mt-4 font-medium">✅ Сохранено!</p>
      )}
    </div>
  )
}