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
  const [saving, setSaving] = useState(false)
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
    setSaving(true)
    await saveProfile({ ...profile, user_id: userId })
    const { generateCalendarFromProfile } = await import('@/services/calendarService')
    await generateCalendarFromProfile(userId)
    setSaving(false)
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
    <main className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Загрузка...</p>
      </div>
    </main>
  )

  const statusConfig: Record<string, { label: string; color: string }> = {
    free: { label: 'Базовый', color: 'bg-slate-500/10 border border-slate-500/20 text-slate-400' },
    premium: { label: 'Premium', color: 'bg-amber-500/10 border border-amber-500/20 text-amber-400' },
    pro: { label: 'Pro', color: 'bg-violet-500/10 border border-violet-500/20 text-violet-400' },
  }

  const status = statusConfig[profile.status ?? 'free'] ?? statusConfig.free

  const inputClass = 'w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition'
  const sectionClass = 'bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4'

  return (
    <main className="min-h-screen bg-[#030712] p-6">
      <div className="max-w-2xl mx-auto">

        {/* Profile header card */}
        <div className={`${sectionClass} mb-4`}>
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <Image
                src={profile.avatar_url || '/avatar.png'}
                alt="avatar"
                width={72}
                height={72}
                className="w-18 h-18 rounded-2xl object-cover border border-white/10"
                style={{ width: 72, height: 72 }}
              />
              <span className={`absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-lg font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">
                {profile.full_name || userEmail || 'Профиль'}
              </h1>
              {profile.nickname && (
                <p className="text-indigo-400 text-sm font-medium">@{profile.nickname}</p>
              )}
              {(profile.school || profile.city || profile.study_country) && (
                <p className="text-slate-500 text-xs mt-1">
                  {[profile.school, profile.city, profile.study_country].filter(Boolean).join(' · ')}
                </p>
              )}
              {profile.personality_type && (
                <span className="inline-block mt-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-lg">
                  {profile.personality_type}
                </span>
              )}
              {memberSince && (
                <p className="text-slate-600 text-xs mt-2">В Qadam с {memberSince}</p>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="shrink-0 text-xs text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition"
            >
              {editing ? 'Отмена' : 'Изменить'}
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className={sectionClass}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">О себе</h2>
          {editing ? (
            <textarea
              className={`${inputClass} h-24 resize-none`}
              placeholder="Расскажи о себе, своих целях и интересах..."
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
            />
          ) : (
            <p className="text-slate-400 text-sm leading-relaxed">
              {profile.bio || <span className="text-slate-600">Биография не заполнена</span>}
            </p>
          )}
        </div>

        {/* Личная информация */}
        <ProfileForm
          profile={profile}
          editing={editing}
          saved={saved}
          saving={saving}
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
            disabled={saving}
            className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition mt-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            {saving ? 'Сохранение...' : 'Сохранить профиль'}
          </button>
        )}

        {saved && (
          <p className="text-center text-emerald-400 text-sm font-medium mt-3">Профиль сохранён</p>
        )}

        <div className="text-center mt-8 flex justify-center gap-6">
          <Link href="/" className="text-slate-600 hover:text-slate-300 text-sm transition">Главная</Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-300 text-sm transition">Мои шансы</Link>
          <Link href="/calendar" className="text-slate-600 hover:text-slate-300 text-sm transition">Календарь</Link>
        </div>

      </div>
    </main>
  )
}