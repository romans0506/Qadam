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
import SavedUniversities from '@/components/profile/SavedUniversities'
import TestResults from '@/components/profile/TestResults'

export default function Profile() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [memberSince, setMemberSince] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) { router.push('/login'); return }
      setUserId(u.id)
      setUserEmail(u.email ?? null)
      if (u.created_at) {
        setMemberSince(new Date(u.created_at).toLocaleDateString('ru-RU', {
          month: 'long', year: 'numeric'
        }))
      }
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

  const statusConfig: Record<string, { label: string; color: string }> = {
    free: { label: 'Базовый', color: 'bg-gray-100 text-gray-600' },
    premium: { label: '⭐ Premium', color: 'bg-yellow-100 text-yellow-700' },
    pro: { label: '🚀 Pro', color: 'bg-purple-100 text-purple-700' },
  }

  const status = statusConfig[profile.status ?? 'free'] ?? statusConfig.free

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Шапка профиля */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 text-center">
          <div className="relative inline-block mb-4">
            <Image
              src={profile.avatar_url || '/avatar.png'}
              alt="avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover"
            />
            <span className={`absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            {profile.full_name || userEmail || 'Профиль'}
          </h1>

          {profile.nickname && (
            <p className="text-blue-500 font-medium">@{profile.nickname}</p>
          )}

          {(profile.school || profile.city || profile.study_country) && (
            <p className="text-gray-500 text-sm mt-1">
              {[profile.school, profile.city, profile.study_country].filter(Boolean).join(' • ')}
            </p>
          )}

          {profile.personality_type && (
            <span className="inline-block mt-2 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
              🧠 {profile.personality_type}
            </span>
          )}

          {memberSince && (
            <p className="text-gray-400 text-xs mt-2">В Qadam с {memberSince}</p>
          )}

          <button
            onClick={() => setEditing(!editing)}
            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
          >
            {editing ? 'Отмена' : '✏️ Редактировать профиль'}
          </button>
        </div>

        {/* Биография */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">📝 О себе</h2>
          {editing ? (
            <textarea
              className="w-full border rounded-lg p-3 text-gray-800 h-24 resize-none"
              placeholder="Расскажи о себе, своих целях и интересах..."
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
            />
          ) : (
            <p className="text-gray-600 leading-relaxed">
              {profile.bio || 'Биография не заполнена'}
            </p>
          )}
        </div>

        {/* Личная информация */}
        <ProfileForm
          profile={profile}
          editing={editing}
          saved={saved}
          onEdit={() => setEditing(!editing)}
          onSave={handleSave}
          onChange={setProfile}
        />

        {/* Цели поступления */}
        <GoalsSection
          profile={profile}
          editing={editing}
          onChange={setProfile}
        />

        {/* Академические показатели */}
        <AcademicStats
          profile={profile}
          editing={editing}
          onChange={setProfile}
        />

        {/* Сохранённые университеты */}
        {userId && <SavedUniversities userId={userId} />}
        {userId && <TestResults userId={userId} />}

        {/* Портфолио */}
        <Portfolio
          items={portfolio}
          userId={userId}
          onAdd={handleAddPortfolio}
          onDelete={handleDeletePortfolio}
        />

        {editing && (
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition mt-4"
          >
            Сохранить профиль ✓
          </button>
        )}

        {saved && (
          <p className="text-center text-green-400 font-medium mt-2">✅ Профиль сохранён!</p>
        )}

        <div className="text-center mt-8 flex justify-center gap-6">
          <Link href="/" className="text-blue-200 hover:text-white underline">Главная</Link>
          <Link href="/dashboard" className="text-blue-200 hover:text-white underline">Мои шансы</Link>
          <Link href="/calendar" className="text-blue-200 hover:text-white underline">Календарь</Link>
        </div>

      </div>
    </main>
  )
}