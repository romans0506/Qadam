'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { href: '/universities', label: 'Университеты' },
  { href: '/news', label: 'Новости' },
  { href: '/tests', label: 'Тесты' },
  { href: '/calendar', label: 'Календарь' },
  { href: '/assistant', label: 'AI', dot: true },
  { href: '/profile', label: 'Профиль' },
]

export default function Header() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null))
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
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        <Link href="/" className="text-white font-bold text-lg tracking-tight flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-black">Q</span>
          Qadam
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
                {link.dot && (
                  <span className="relative z-10 inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <button
              onClick={handleLogout}
              className="hidden md:block text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden md:block text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition font-medium"
            >
              Войти
            </Link>
          )}

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition"
            aria-label="Menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block w-4 h-0.5 bg-slate-300 origin-center"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-4 h-0.5 bg-slate-300"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block w-4 h-0.5 bg-slate-300 origin-center"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium px-3 py-2.5 rounded-lg transition ${
                    pathname === link.href
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={pathname === link.href ? { background: 'rgba(255,255,255,0.07)' } : {}}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/[0.06] mt-2 pt-2">
                {email ? (
                  <button onClick={handleLogout} className="w-full text-left text-sm text-slate-400 px-3 py-2.5 rounded-lg hover:bg-white/5 transition">
                    Выйти
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm bg-indigo-500 text-white px-3 py-2.5 rounded-lg text-center font-medium">
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
