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
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) return
      setUserId(data.session?.user.id)
      checkIfSaved(data.session?.user.id)
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
      className={`w-full disabled:opacity-50 ${
        saved
          ? 'btn-secondary hover:border-red-500/40 hover:text-red-400'
          : 'btn-primary'
      }`}
    >
      {loading ? 'Загрузка...' :
       saved ? '✓ Сохранено — убрать' :
       'Сохранить университет'}
    </button>
  )
}
