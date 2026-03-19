'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { getProfile, saveProfile, getPortfolio, addPortfolioItem, deletePortfolioItem } from '@/services/profileService'
import { UserProfile, PortfolioItem } from '@/types/student'
import ProfileForm from '@/components/profile/ProfileForm'
import AcademicStats from '@/components/profile/AcademicStats'
import GoalsSection from '@/components/profile/GoalsSection'
import Portfolio from '@/components/profile/Portfolio'

export default function Profile() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) {
        router.push('/login')
        return
      }
      setUserId(u.id)
      setUserEmail(u.email ?? null)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return

    async function loadData() {
      const [profileData, portfolioData] = await Promise.all([
        getProfile(userId!),
        getPortfolio(userId!)
      ])

      if (profileData) {
        setProfile(profileData)
      } else {
        setProfile({ user_id: userId!, full_name: '', avatar_url: '' })
        setEditing(true)
      }

      setPortfolio(portfolioData)
    }

    loadData()
  }, [userId])

  async function handleSave() {
  if (!userId) return
  await saveProfile({ ...profile, user_id: userId })

  // Автоматически генерируем события в календаре
  const { generateCalendarFromProfile } = await import('@/services/calendarService')
  await generateCalendarFromProfile(userId)

  setSaved(true)
  setEditing(false)
  setTimeout(() => setSaved(false), 3000)
}

  async function handleAddPortfolio(item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>) {
    const newItem = await addPortfolioItem(item)
    if (newItem) setPortfolio(prev => [...prev, newItem])
  }

  async function handleDeletePortfolio(id: string) {
    await deletePortfolioItem(id)
    setPortfolio(prev => prev.filter(item => item.id !== id))
  }

  if (!userId) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
      <p className="text-white text-xl">Загрузка...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center text-white mb-8">
          <Image
            src={profile.avatar_url || '/avatar.png'}
            alt="avatar"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white object-cover"
          />
          <h1 className="text-3xl font-bold">{profile.full_name || userEmail || 'Профиль'}</h1>
          <p className="text-blue-200">@{profile.nickname || 'nickname'}</p>
          {profile.school && (
            <p className="text-blue-300 text-sm mt-1">{profile.school} • {profile.grade} класс</p>
          )}
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

        <GoalsSection
          profile={profile}
          editing={editing}
          onChange={setProfile}
        />

        <Portfolio
          items={portfolio}
          userId={userId}
          onAdd={handleAddPortfolio}
          onDelete={handleDeletePortfolio}
        />

        <div className="text-center mt-8 flex justify-center gap-6">
          <Link href="/" className="text-blue-200 hover:text-white underline">Главная</Link>
          <Link href="/dashboard" className="text-blue-200 hover:text-white underline">Мои шансы</Link>
        </div>

      </div>
    </main>
  )
}