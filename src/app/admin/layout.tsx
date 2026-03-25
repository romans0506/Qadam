'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { LayoutDashboard, Building2, CalendarDays, Trophy, ArrowLeft, Loader2 } from 'lucide-react'

const NAV = [
  { href: '/admin',             label: 'Дашборд',      icon: LayoutDashboard },
  { href: '/admin/universities', label: 'Университеты', icon: Building2 },
  { href: '/admin/deadlines',    label: 'Дедлайны',     icon: CalendarDays },
  { href: '/admin/rankings',     label: 'Рейтинги',     icon: Trophy },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('user_id', data.session?.user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[var(--text-tertiary)]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] flex flex-col py-6 px-3 sticky top-0 h-screen">
        <div className="px-3 mb-8">
          <p className="text-xs font-bold text-[var(--text-primary)] tracking-widest uppercase">Admin</p>
          <p className="text-xs text-[var(--text-quaternary)] mt-0.5">Qadam Panel</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
                  active
                    ? 'bg-white/10 text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-quaternary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Назад в приложение
        </Link>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
