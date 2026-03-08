'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '@/services/profileService'
import { UserProfile } from '@/types/student'
import ProfileForm from '@/components/profile/ProfileForm'
import AcademicStats from '@/components/profile/AcademicStats'
export default function Profile() {
  const { user } = useUser()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  async function loadProfile() {
    if (!user) return
    const data = await getProfile(user.id)
    if (data) {
      setProfile(data)
    } else {
      setProfile({
        clerk_id: user.id,
        full_name: user.fullName || '',
        avatar_url: user.imageUrl || '',
      })
      setEditing(true)
    }
  }

  async function handleSave() {
    if (!user) return
    await saveProfile({ ...profile, clerk_id: user.id })
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!user) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white">Загрузка...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <img
            src={user.imageUrl}
            alt="avatar"
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white"
          />
          <h1 className="text-3xl font-bold">{profile.full_name || user.fullName}</h1>
          <p className="text-blue-200">@{profile.nickname || 'nickname'}</p>
        </div>

        <ProfileForm
          profile={profile}
          editing={editing}
          saved={saved}
          onEdit={() => setEditing(!editing)}
          onSave={handleSave}
          onChange={setProfile}
        />

        <AcademicStats
  profile={profile}
  editing={editing}
  onChange={setProfile}
/>

        <div className="text-center mt-8 flex justify-center gap-6">
          <a href="/" className="text-blue-200 hover:text-white underline">Главная</a>
          <a href="/dashboard" className="text-blue-200 hover:text-white underline">Мои шансы</a>
        </div>

      </div>
    </main>
  )
}