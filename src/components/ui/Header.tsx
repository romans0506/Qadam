'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'

export default function Header() {
  const { user } = useUser()
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Главная' },
    { href: '/dashboard', label: 'Шансы' },
    { href: '/profile', label: 'Профиль' },
  ]

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
          {user && (
            <span className="text-blue-300 text-sm hidden md:block">
              {user.fullName}
            </span>
          )}
          <UserButton  />
        </div>

      </div>
    </header>
  )
}