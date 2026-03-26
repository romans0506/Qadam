'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Building2, CalendarDays, Trophy, Users, LayoutTemplate } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ universities: 0, deadlines: 0, rankings: 0, users: 0 })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    Promise.all([
      supabase.from('universities').select('*', { count: 'exact', head: true }),
      supabase.from('university_deadlines').select('*', { count: 'exact', head: true }),
      supabase.from('university_rankings').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]).then(([u, d, r, p]) => {
      setStats({
        universities: u.count ?? 0,
        deadlines:    d.count ?? 0,
        rankings:     r.count ?? 0,
        users:        p.count ?? 0,
      })
    })
  }, [])

  const cards = [
    { label: 'Университеты', value: stats.universities, icon: Building2,   href: '/admin/universities', color: 'text-indigo-400' },
    { label: 'Дедлайны',     value: stats.deadlines,    icon: CalendarDays, href: '/admin/deadlines',    color: 'text-amber-400'  },
    { label: 'Рейтинги',     value: stats.rankings,     icon: Trophy,       href: '/admin/rankings',     color: 'text-violet-400' },
    { label: 'Пользователи', value: stats.users,        icon: Users,        href: '#',                   color: 'text-emerald-400' },
    { label: 'Шаблоны',     value: 0,                  icon: LayoutTemplate, href: '/admin/templates',  color: 'text-cyan-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Дашборд</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">Управление контентом Qadam</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="card p-6 hover:border-white/15 transition group">
            <Icon size={20} strokeWidth={1.5} className={`${color} mb-4`} />
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="t-label mt-1 group-hover:text-[var(--text-secondary)] transition">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 card p-6">
        <p className="t-label mb-4">Быстрые действия</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/universities" className="btn-secondary text-sm">+ Добавить университет</Link>
          <Link href="/admin/deadlines"    className="btn-secondary text-sm">+ Добавить дедлайн</Link>
          <Link href="/admin/rankings"     className="btn-secondary text-sm">+ Добавить рейтинг</Link>
          <Link href="/admin/templates"   className="btn-secondary text-sm">+ Добавить шаблон</Link>
        </div>
      </div>
    </div>
  )
}
