'use client'
import { useState } from 'react'

interface Props {
  src: string
  name: string
  size?: number
  rounded?: string
  padding?: string
}

export default function UniversityLogo({ src, name, size = 72, rounded = 'rounded-2xl', padding = 'p-1.5' }: Props) {
  const [failed, setFailed] = useState(false)

  // Initials fallback (e.g. "MIT" → "MI")
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${rounded} overflow-hidden border border-white/10 bg-white/[0.06] shadow-2xl shrink-0 flex items-center justify-center`}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="text-[var(--text-tertiary)] font-bold select-none" style={{ fontSize: size * 0.28 }}>
          {initials}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className={`w-full h-full object-contain ${padding}`}
        />
      )}
    </div>
  )
}
