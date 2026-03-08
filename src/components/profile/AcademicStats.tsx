'use client'
import { UserProfile } from '@/types/student'

interface Props {
  profile: Partial<UserProfile>
  editing: boolean
  onChange: (profile: Partial<UserProfile>) => void
}

export default function AcademicStats({ profile, editing, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Академические показатели</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">{profile.gpa || '—'}</p>
          <p className="text-gray-500 text-sm">GPA</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{profile.ent_score || '—'}</p>
          <p className="text-gray-500 text-sm">ЕНТ</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <p className="text-2xl font-bold text-purple-600">{profile.ielts_score || '—'}</p>
          <p className="text-gray-500 text-sm">IELTS</p>
        </div>
      </div>

      {editing && (
        <div className="space-y-3 mt-4 border-t pt-4">
          <p className="text-gray-500 text-sm font-medium">Редактировать показатели:</p>
          
          <div className="flex items-center gap-3">
            <label className="w-20 text-gray-600 text-sm">GPA</label>
            <input
              type="number" min="1" max="5" step="0.1"
              className="flex-1 border rounded-lg p-2 text-gray-800"
              placeholder="например: 4.5"
              value={profile.gpa || ''}
              onChange={e => onChange({...profile, gpa: parseFloat(e.target.value)})}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-20 text-gray-600 text-sm">ЕНТ</label>
            <input
              type="number" min="0" max="140"
              className="flex-1 border rounded-lg p-2 text-gray-800"
              placeholder="например: 110"
              value={profile.ent_score || ''}
              onChange={e => onChange({...profile, ent_score: parseInt(e.target.value)})}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-20 text-gray-600 text-sm">IELTS</label>
            <input
              type="number" min="0" max="9" step="0.5"
              className="flex-1 border rounded-lg p-2 text-gray-800"
              placeholder="например: 7.0"
              value={profile.ielts_score || ''}
              onChange={e => onChange({...profile, ielts_score: parseFloat(e.target.value)})}
            />
          </div>
        </div>
      )}
    </div>
  )
}