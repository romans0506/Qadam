'use client'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

const INTERESTS = ['IT', 'Медицина', 'Право', 'Бизнес', 'Инженерия', 'Педагогика', 'Архитектура', 'Психология']
const LANGUAGES = ['Английский', 'Русский', 'Казахский', 'Немецкий', 'Французский', 'Китайский', 'Испанский']

export default function GoalsSection({ profile, editing, onChange }: Props) {
  const toggleItem = (field: 'interests' | 'languages', value: string) => {
    const current = (profile[field] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value]
    onChange({ ...profile, [field]: updated })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Цели и интересы</h2>

      {/* Цели поступления */}
      <div className="mb-4">
        <p className="text-gray-600 font-medium mb-2">Цель поступления</p>
        <div className="space-y-2">
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="Страна (например: Казахстан, США)"
            value={profile.target_country || ''}
            disabled={!editing}
            onChange={e => onChange({ ...profile, target_country: e.target.value })}
          />
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="Университет (например: НУ, MIT)"
            value={profile.target_university || ''}
            disabled={!editing}
            onChange={e => onChange({ ...profile, target_university: e.target.value })}
          />
          <input
            className="w-full border rounded-lg p-3 text-gray-800 disabled:bg-gray-50"
            placeholder="Специальность (например: Computer Science)"
            value={profile.target_specialty || ''}
            disabled={!editing}
            onChange={e => onChange({ ...profile, target_specialty: e.target.value })}
          />
        </div>
      </div>

      {/* Интересы */}
      <div className="mb-4">
        <p className="text-gray-600 font-medium mb-2">Направления</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <button
              key={interest}
              disabled={!editing}
              onClick={() => toggleItem('interests', interest)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                (profile.interests || []).includes(interest)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:cursor-default`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Языки */}
      <div>
        <p className="text-gray-600 font-medium mb-2">Языки</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              disabled={!editing}
              onClick={() => toggleItem('languages', lang)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                (profile.languages || []).includes(lang)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:cursor-default`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}