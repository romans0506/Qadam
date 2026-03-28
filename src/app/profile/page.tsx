'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, School, Edit3, Check, Loader2, Camera } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { getProfile, saveProfile, getPortfolio, addPortfolioItem, deletePortfolioItem, uploadAvatar } from '@/services/profileService'
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
  const [loading, setLoading] = useState(true)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (!u) { router.push('/login'); return }
      setUserId(u.id)
      setUserEmail(u.email ?? null)
      if (u.created_at) {
        setMemberSince(new Date(u.created_at).toLocaleDateString('ru-RU', {
          month: 'long', year: 'numeric',
        }))
      }
      const [profileData, portfolioData] = await Promise.all([
        getProfile(u.id),
        getPortfolio(u.id),
      ])
      if (profileData) {
        setProfile(profileData)
      } else {
        setProfile({ user_id: u.id, full_name: '', avatar_url: '' })
        setEditing(true)
      }
      setPortfolio(portfolioData)
      setLoading(false)
    })
  }, [router])

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    setAvatarError(null)
    try {
      const url = await uploadAvatar(userId, file)
      if (url) {
        const updated = { ...profile, avatar_url: url }
        setProfile(updated)
        await saveProfile({ ...updated, user_id: userId })
      }
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Ошибка загрузки')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <Loader2 size={18} strokeWidth={1.5} className="text-[var(--accent)] animate-spin" />
    </main>
  )

  const statusConfig: Record<string, { label: string; cls: string }> = {
    free:    { label: 'Базовый', cls: 'text-[var(--text-tertiary)] border-[var(--border)]' },
    premium: { label: 'Premium', cls: 'text-amber-400 border-amber-500/30' },
    pro:     { label: 'Pro',     cls: 'text-violet-400 border-violet-500/30' },
  }
  const status = statusConfig[profile.status ?? 'free'] ?? statusConfig.free

  /* Initials for default avatar */
  const initials = (() => {
    const name = profile.full_name || userEmail || ''
    if (!name) return 'Q'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })()

  /* Academic bento stats */
  const bentoStats = [
    { label: 'GPA',   value: profile.gpa != null    ? profile.gpa.toFixed(1)       : null, max: '4.0' },
    { label: 'ЕНТ',   value: profile.ent_score != null ? String(Math.round(profile.ent_score)) : null, max: '140' },
    { label: 'SAT',   value: profile.sat_score != null ? String(profile.sat_score)  : null, max: '1600' },
    { label: 'IELTS', value: profile.ielts_score != null ? profile.ielts_score.toFixed(1) : null, max: '9.0' },
    { label: 'ACT',   value: profile.act_score != null  ? String(profile.act_score) : null, max: '36' },
    { label: 'TOEFL', value: profile.toefl_score != null ? String(profile.toefl_score) : null, max: '120' },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-3xl mx-auto px-6 py-18 space-y-6">

        {/* ── HEADER CARD ─────────────────────────────────────────────── */}
        <div className="card p-8">
          <div className="flex items-start gap-6">

            {/* Avatar */}
            <div className="relative shrink-0 group">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-[88px] h-[88px] rounded-full overflow-hidden border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                title="Сменить фото"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl leading-none select-none">
                      {initials}
                    </span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  {avatarUploading
                    ? <Loader2 size={18} strokeWidth={2} className="text-white animate-spin" />
                    : <Camera size={18} strokeWidth={1.5} className="text-white" />
                  }
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarError && (
                <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-red-400">
                  {avatarError}
                </p>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="t-headline leading-none">
                  {profile.full_name || userEmail || 'Профиль'}
                </h1>
                <span className={`t-label normal-case tracking-normal border px-2.5 py-1 rounded-full ${status.cls}`}>
                  {status.label}
                </span>
              </div>

              {profile.nickname && (
                <p className="t-body text-[var(--accent)] text-sm font-medium mb-1">
                  @{profile.nickname}
                </p>
              )}

              {(profile.school || profile.city || profile.study_country) && (
                <p className="t-body text-sm flex items-center gap-1.5 mt-1">
                  {profile.city || profile.study_country
                    ? <MapPin size={12} strokeWidth={1.2} className="text-[var(--text-tertiary)] shrink-0" />
                    : <School size={12} strokeWidth={1.2} className="text-[var(--text-tertiary)] shrink-0" />
                  }
                  {[profile.school, profile.city, profile.study_country].filter(Boolean).join(' · ')}
                </p>
              )}

              {profile.personality_type && (
                <span className="inline-block mt-2 border border-[var(--border)] px-2.5 py-1 rounded-full t-label normal-case tracking-normal text-[var(--text-secondary)]">
                  {profile.personality_type}
                </span>
              )}

              {memberSince && (
                <p className="t-label normal-case tracking-normal text-[var(--text-quaternary)] mt-2">
                  В Qadam с {memberSince}
                </p>
              )}
            </div>

            {/* Edit toggle */}
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary shrink-0 flex items-center gap-1.5 px-4 py-2 h-auto text-sm"
            >
              <Edit3 size={13} strokeWidth={1.5} />
              {editing ? 'Отмена' : 'Изменить'}
            </button>
          </div>
        </div>

        {/* ── ACADEMIC BENTO ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {bentoStats.map(({ label, value, max }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`font-bold tracking-tight leading-none mb-1 ${
                value ? 'text-[var(--text-primary)] text-xl' : 'text-[var(--text-quaternary)] text-lg'
              }`}>
                {value ?? '—'}
              </p>
              <p className="t-label">{label}</p>
              {max && <p className="t-label text-[var(--text-quaternary)] mt-0.5 normal-case tracking-normal">/ {max}</p>}
            </div>
          ))}
        </div>

        {/* ── BIO ─────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <p className="t-label mb-4">О себе</p>
          {editing ? (
            <textarea
              className="inp h-24 resize-none"
              placeholder="Расскажи о себе, своих целях и интересах..."
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
            />
          ) : (
            <p className="t-body leading-loose">
              {profile.bio || (
                <span className="text-[var(--text-quaternary)]">Биография не заполнена</span>
              )}
            </p>
          )}
        </div>

        {/* ── SUB-COMPONENTS ─────────────────────────────────────────── */}
        <ProfileForm
          profile={profile}
          editing={editing}
          saved={saved}
          saving={saving}
          onEdit={() => setEditing(!editing)}
          onSave={handleSave}
          onChange={setProfile}
        />

        <GoalsSection
          profile={profile}
          editing={editing}
          onChange={setProfile}
        />

        <AcademicStats
          profile={profile}
          editing={editing}
          onChange={setProfile}
        />

        {userId && <SavedUniversities userId={userId} />}
        {userId && <TestResults userId={userId} />}

        {userId && <Portfolio
          items={portfolio}
          userId={userId}
          onAdd={handleAddPortfolio}
          onDelete={handleDeletePortfolio}
        />}

        {/* ── SAVE CTA ────────────────────────────────────────────────── */}
        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><Loader2 size={15} strokeWidth={2} className="animate-spin" /> Сохранение...</>
              : <><Check size={15} strokeWidth={2} /> Сохранить профиль</>
            }
          </button>
        )}

        {saved && (
          <p className="text-center text-emerald-400 text-sm font-medium">
            Профиль сохранён
          </p>
        )}

        {/* ── Footer links ────────────────────────────────────────────── */}
        <div className="flex justify-center gap-8 pt-8">
          {[
            { href: '/', label: 'Главная' },
            { href: '/assistant', label: 'AI помощник' },
            { href: '/calendar', label: 'Календарь' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="t-label normal-case tracking-normal text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] transition">
              {label}
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
