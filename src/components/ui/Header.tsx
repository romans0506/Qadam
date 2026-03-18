'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)

const links = [
  { href: '/', label: 'Главная' },
  { href: '/universities', label: 'Университеты' },
  { href: '/tests', label: 'Тесты' },
  { href: '/calendar', label: 'Календарь' },
  { href: '/dashboard', label: 'Шансы' },
  { href: '/profile', label: 'Профиль' },
]

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
  }


  return (
    <header className="bg-blue-950 border-b border-blue-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">

        {/* Логотип */}
        <Link href="/" className="text-white font-bold text-2xl">
          Qadam 🎓
        </Link>

        {/* Навигация */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                pathname === link.href
                  ? 'text-white border-b-2 border-white pb-1'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Юзер */}
        <div className="flex items-center gap-3">
          {email && (
            <span className="text-blue-300 text-sm hidden md:block">
              {email}
            </span>
          )}
          {email ? (
            <button
              onClick={handleLogout}
              className="text-sm text-blue-200 hover:text-white underline"
            >
              Выйти
            </button>
          ) : (
            <Link href="/login" className="text-sm text-blue-200 hover:text-white underline">
              Войти
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}