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
      className={`w-full font-semibold py-3 rounded-xl transition text-sm ${
        saved
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
          : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
      } disabled:opacity-50`}
    >
      {loading ? 'Загрузка...' :
       saved ? 'Сохранено — нажми чтобы убрать' :
       'Сохранить и добавить дедлайны в календарь'}
    </button>
  )
}
