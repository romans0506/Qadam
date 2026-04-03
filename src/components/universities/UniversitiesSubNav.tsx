'use client'
import Link from 'next/link'

interface Props {
  active: 'list' | 'rankings'
}

export default function UniversitiesSubNav({ active }: Props) {
  return (
    <div className="flex gap-1 mb-10 border-b border-[var(--border)] pb-0">
      <Link
        href="/universities"
        className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
          active === 'list'
            ? 'text-white border-[var(--accent)]'
            : 'text-[var(--text-tertiary)] border-transparent hover:text-white'
        }`}
      >
        Все университеты
      </Link>
      <Link
        href="/universities/rankings"
        className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
          active === 'rankings'
            ? 'text-white border-[var(--accent)]'
            : 'text-[var(--text-tertiary)] border-transparent hover:text-white'
        }`}
      >
        Рейтинги
      </Link>
    </div>
  )
}
