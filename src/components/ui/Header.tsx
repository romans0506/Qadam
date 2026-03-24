'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

const links = [
  { href: '/universities', label: 'Университеты' },
  { href: '/tests', label: 'Тесты' },
  { href: '/calendar', label: 'Календарь' },
  { href: '/assistant', label: 'AI' },
  { href: '/dashboard', label: 'Шансы' },
  { href: '/profile', label: 'Профиль' },
]

export default function Header() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">

        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          Qadam
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                pathname === link.href
                  ? 'bg-white/15 text-white'
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <button
              onClick={handleLogout}
              className="text-xs text-blue-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition"
            >
              Войти
            </Link>
          )}

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-white/10 pt-3 flex flex-col gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                pathname === link.href
                  ? 'bg-white/15 text-white'
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
