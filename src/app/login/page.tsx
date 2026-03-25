'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Mail, CheckCircle2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/profile')
    })
  }, [router])

  function friendlyError(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('user already registered') || m.includes('already been registered'))
      return 'Этот email уже зарегистрирован. Войдите в аккаунт.'
    if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
      return 'Неверный email или пароль.'
    if (m.includes('email not confirmed'))
      return 'Подтверди email перед входом — проверь почту.'
    if (m.includes('rate limit') || m.includes('too many requests'))
      return 'Слишком много попыток. Подожди немного и попробуй снова.'
    if (m.includes('password should be at least'))
      return 'Пароль должен содержать минимум 6 символов.'
    if (m.includes('unable to validate email'))
      return 'Некорректный email адрес.'
    return msg
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Supabase returns success even for existing emails (re-sends confirmation).
        // If there's no session and no user identity, the email is already taken.
        if (!data.session && data.user && data.user.identities?.length === 0) {
          setError('Этот email уже зарегистрирован. Войдите в аккаунт.')
          return
        }
        // Email confirmation required — no session yet
        if (!data.session) {
          setAwaitingConfirm(true)
          return
        }
        router.push('/profile')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/profile')
      }
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Ошибка авторизации'))
    } finally {
      setLoading(false)
    }
  }

  if (awaitingConfirm) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[140px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="card-glass w-full max-w-md p-12 relative z-10 text-center"
        >
          {/* Animated envelope with check */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Mail size={36} strokeWidth={1.3} className="text-indigo-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#050505]">
                <CheckCircle2 size={16} strokeWidth={2.5} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="t-headline mb-3">Письмо отправлено!</h1>
          <p className="t-body text-[var(--text-tertiary)] mb-2">
            Мы отправили письмо с подтверждением на
          </p>
          <p className="font-semibold text-[var(--text-primary)] mb-6 break-all">{email}</p>
          <p className="text-sm text-[var(--text-quaternary)] mb-8">
            Перейди по ссылке в письме, чтобы активировать аккаунт. Не забудь проверить папку «Спам».
          </p>

          <button
            onClick={() => { setAwaitingConfirm(false); setMode('signin'); setPassword('') }}
            className="btn-primary w-full"
          >
            Войти после подтверждения
          </button>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[140px]" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="card-glass w-full max-w-md p-12 relative z-10"
      >

        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-lg leading-none">Q</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="t-headline mb-2">Welcome to Qadam</h1>
          <p className="t-body text-[var(--text-tertiary)]">
            {mode === 'signin'
              ? 'Sign in to continue your journey.'
              : 'Create an account to get started.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <label className="t-label">Email</label>
            <div className="relative">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                className="inp w-full focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="t-label">Пароль</label>
            <div className="relative">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="inp w-full focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5">
                  <AlertCircle size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              : (mode === 'signin' ? 'Войти' : 'Создать аккаунт')
            }
          </button>

        </form>

        {/* Mode toggle */}
        <div className="mt-8 text-center">
          <p className="t-body text-sm text-[var(--text-quaternary)]">
            {mode === 'signin' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setAwaitingConfirm(false) }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium"
            >
              {mode === 'signin' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

      </motion.div>
    </main>
  )
}
