'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/profile')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.push('/profile')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/profile')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Qadam</h1>
        <p className="text-blue-200 mb-6">
          {mode === 'signin' ? 'Вход' : 'Регистрация'} через Supabase Auth
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-blue-200">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-blue-200">Пароль</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {error && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-white text-blue-950 font-semibold py-2 disabled:opacity-70"
          >
            {loading ? '...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="mt-4 text-sm text-blue-200">
          {mode === 'signin' ? (
            <button className="underline" onClick={() => setMode('signup')}>
              Нет аккаунта? Зарегистрироваться
            </button>
          ) : (
            <button className="underline" onClick={() => setMode('signin')}>
              Уже есть аккаунт? Войти
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

