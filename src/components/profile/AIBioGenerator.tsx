'use client'
import { useState } from 'react'
import { UserProfile } from '@/types/student'

interface Props {
  userId: string
  profile: Partial<UserProfile>
  onGenerated: (bio: string) => void
}

export default function AIBioGenerator({ profile, onGenerated }: Props) {
  const [loading, setLoading] = useState(false)

  async function generateBio() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })
      const data = await res.json()
      if (data.bio) onGenerated(data.bio)
    } catch (e) {
      console.error('Ошибка генерации:', e)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={generateBio}
      disabled={loading}
      className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
    >
      {loading ? '⏳ Генерирую...' : '🤖 Сгенерировать с AI'}
    </button>
  )
}