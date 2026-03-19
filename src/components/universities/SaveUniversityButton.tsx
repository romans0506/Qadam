'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { saveUniversity, unsaveUniversity } from '@/services/universityService'
import { generateCalendarFromUniversity } from '@/services/calendarService'

interface Props {
  universityId: string
  universityName: string
}

export default function SaveUniversityButton({ universityId, universityName }: Props) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      checkIfSaved(data.user.id)
    })
  }, [])

  async function checkIfSaved(uid: string) {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase
    .from('user_saved_universities')
    .select('id')
    .eq('user_id', uid)
    .eq('university_id', universityId)
    .limit(1)
  setSaved(data !== null && data.length > 0)
}

  async function handleSave() {
    if (!userId) { router.push('/login'); return }
    setLoading(true)

    if (saved) {
      await unsaveUniversity(userId, universityId)
      setSaved(false)
    } else {
      await saveUniversity(userId, universityId)
      await generateCalendarFromUniversity(userId, universityId)
      setSaved(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`w-full font-bold py-3 rounded-xl transition ${
        saved
          ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? 'Загрузка...' :
       saved ? '✅ Сохранено — нажми чтобы убрать' :
       '🔖 Сохранить и добавить дедлайны в календарь'}
    </button>
  )
}