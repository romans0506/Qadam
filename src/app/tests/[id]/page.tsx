'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, ArrowRight, CheckCheck, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface Question {
  id: string
  text: string
  type: string
  order: number
  options: Option[]
}

interface Option {
  id: string
  text: string
  value: string
  order: number
}

/* ── Result metadata ──────────────────────────────────────────────────────── */
const mbtiDescriptions: Record<string, { title: string; desc: string; careers: string[] }> = {
  INTJ: { title: 'Стратег',       desc: 'Независимый мыслитель с острым умом и стратегическим видением',    careers: ['IT', 'Наука', 'Инженерия'] },
  INTP: { title: 'Логик',         desc: 'Изобретательный аналитик, влюблённый в идеи',                       careers: ['Математика', 'IT', 'Исследования'] },
  ENTJ: { title: 'Командир',      desc: 'Смелый, волевой лидер с природной харизмой',                        careers: ['Бизнес', 'Право', 'Менеджмент'] },
  ENTP: { title: 'Полемист',      desc: 'Умный и любопытный мыслитель, обожающий дискуссии',                 careers: ['Предпринимательство', 'Право', 'IT'] },
  INFJ: { title: 'Активист',      desc: 'Тихий, мистический идеалист с чёткими ценностями',                 careers: ['Психология', 'Медицина', 'Педагогика'] },
  INFP: { title: 'Посредник',     desc: 'Поэтичный, добросердечный человек с богатым внутренним миром',      careers: ['Журналистика', 'Психология', 'Искусство'] },
  ENFJ: { title: 'Протагонист',   desc: 'Харизматичный и вдохновляющий лидер',                              careers: ['Педагогика', 'Медицина', 'PR'] },
  ENFP: { title: 'Борец',         desc: 'Энтузиаст с богатым воображением и неутомимой энергией',            careers: ['Журналистика', 'Маркетинг', 'Педагогика'] },
  ISTJ: { title: 'Администратор', desc: 'Практичный, надёжный человек с острым чувством долга',             careers: ['Бухгалтерия', 'Право', 'Менеджмент'] },
  ISFJ: { title: 'Защитник',      desc: 'Преданный, заботливый защитник близких',                           careers: ['Медицина', 'Педагогика', 'Социальная работа'] },
  ESTJ: { title: 'Менеджер',      desc: 'Отличный администратор, упорядочивающий хаос',                     careers: ['Бизнес', 'Право', 'Менеджмент'] },
  ESFJ: { title: 'Консул',        desc: 'Заботливый и общительный человек, держащий команду вместе',        careers: ['Медицина', 'Педагогика', 'HR'] },
  ISTP: { title: 'Виртуоз',       desc: 'Смелый и практичный экспериментатор, мастер инструментов',         careers: ['Инженерия', 'IT', 'Механика'] },
  ISFP: { title: 'Артист',        desc: 'Гибкий и обаятельный художник, живущий в настоящем',               careers: ['Дизайн', 'Архитектура', 'Медицина'] },
  ESTP: { title: 'Делец',         desc: 'Умный и энергичный предприниматель, живущий здесь и сейчас',       careers: ['Бизнес', 'Спорт', 'Предпринимательство'] },
  ESFP: { title: 'Развлекатель',  desc: 'Спонтанный, энергичный человек, дарящий радость всем вокруг',      careers: ['Журналистика', 'PR', 'Педагогика'] },
}

const interestDescriptions: Record<string, { title: string; desc: string; specialties: string[] }> = {
  analytical: { title: 'Аналитик',    desc: 'Тебе нравится решать сложные задачи и находить закономерности', specialties: ['Математика', 'IT', 'Физика'] },
  social:     { title: 'Помощник',    desc: 'Тебе важно помогать людям и делать мир лучше',                  specialties: ['Медицина', 'Педагогика', 'Психология'] },
  creative:   { title: 'Творец',      desc: 'Тебе нравится создавать новое и выражать себя',                 specialties: ['Дизайн', 'Архитектура', 'Журналистика'] },
  managerial: { title: 'Организатор', desc: 'Тебе нравится управлять процессами и вести людей',              specialties: ['Менеджмент', 'Бизнес', 'Право'] },
}

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [userId, setUserId]     = useState<string | null>(null)
  const [testId, setTestId]     = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers]   = useState<Record<string, string[]>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [testResult, setTestResult] = useState<{ code: string; data: Record<string, unknown> } | null>(null)

  useEffect(() => { params.then(p => setTestId(p.id)) }, [params])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.push('/login'); return }
      setUserId(data.session?.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId || !testId) return
    loadTest()
  }, [userId, testId])

  async function loadTest() {
    const supabase = createSupabaseBrowserClient()
    const { data: questionsData } = await supabase
      .from('test_questions')
      .select('*, options:test_options(*)')
      .eq('test_id', testId)
      .order('order')
    setQuestions((questionsData ?? []) as unknown as Question[])

    const { data: existingSessions } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('user_id', userId!)
      .eq('test_id', testId!)
      .eq('status', 'in_progress')
      .limit(1)

    if (existingSessions && existingSessions.length > 0) {
      setSessionId(existingSessions[0].id)
    } else {
      const { data: newSession } = await supabase
        .from('user_test_sessions')
        .insert({ user_id: userId, test_id: testId, status: 'in_progress' })
        .select()
        .single()
      setSessionId(newSession?.id ?? null)
    }
    setLoading(false)
  }

  function selectOption(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: [optionId] }))
  }

  async function finishTest() {
    if (!sessionId || !userId || !testId) return
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()

    for (const [questionId, optionIds] of Object.entries(answers)) {
      await supabase.from('user_test_answers').insert({
        session_id: sessionId,
        question_id: questionId,
        selected_option_ids: optionIds,
      })
    }

    const { data: selectedOptions } = await supabase
      .from('test_options')
      .select('value, question_id')
      .in('id', Object.values(answers).flat())

    const test = await supabase.from('tests').select('code').eq('id', testId).single()

    let resultCode = 'completed'
    let resultData: Record<string, unknown> = { answers }

    if (test.data?.code === 'personality' && selectedOptions) {
      const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
      selectedOptions.forEach(opt => { if (opt.value && counts[opt.value] !== undefined) counts[opt.value]++ })
      const mbti = [
        counts.E >= counts.I ? 'E' : 'I',
        counts.S >= counts.N ? 'S' : 'N',
        counts.T >= counts.F ? 'T' : 'F',
        counts.J >= counts.P ? 'J' : 'P',
      ].join('')
      resultCode = mbti
      resultData = { mbti, counts }
      await supabase.from('profiles').update({ personality_type: mbti }).eq('user_id', userId)

    } else if (test.data?.code === 'interests' && selectedOptions) {
      const counts: Record<string, number> = {}
      selectedOptions.forEach(opt => { if (opt.value) counts[opt.value] = (counts[opt.value] || 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      resultCode = top || 'analytical'
      resultData = { counts, top }

    } else if (test.data?.code === 'skills' && selectedOptions) {
      const skillMap: Record<string, string> = {}
      questions.forEach((q, i) => {
        const answer = selectedOptions.find(o => o.question_id === q.id)
        if (answer) skillMap[`skill_${i + 1}`] = answer.value
      })
      const avg = Object.values(skillMap).reduce((a, b) => a + parseInt(b), 0) / Object.values(skillMap).length
      resultCode = avg >= 3 ? 'strong' : avg >= 2 ? 'average' : 'needs_improvement'
      resultData = { skillMap, average: avg }
    }

    await supabase.from('user_test_results').insert({
      session_id: sessionId, user_id: userId, test_id: testId,
      result_code: resultCode, result_data: resultData,
    })
    await supabase.from('user_test_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    setTestResult({ code: resultCode, data: resultData })
    setFinished(true)
    setSubmitting(false)
  }

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 size={18} strokeWidth={1.5} className="text-[var(--accent)] animate-spin" />
        <p className="t-body">Загрузка теста...</p>
      </div>
    </main>
  )

  /* ── Result screen ────────────────────────────────────────────────────── */
  if (finished && testResult) {
    const isMBTI     = Object.keys(mbtiDescriptions).includes(testResult.code)
    const isInterest = Object.keys(interestDescriptions).includes(testResult.code)
    const mbti       = mbtiDescriptions[testResult.code]
    const interest   = interestDescriptions[testResult.code]

    const skillConfig: Record<string, { label: string; sub: string; accent: string; border: string }> = {
      strong:           { label: 'Сильный профиль',   sub: 'У тебя отличные академические навыки',       accent: 'text-emerald-400', border: 'border-emerald-500/30' },
      average:          { label: 'Есть потенциал',    sub: 'Продолжай развиваться — результаты улучшатся', accent: 'text-amber-400',   border: 'border-amber-500/30' },
      needs_improvement:{ label: 'Нужна практика',   sub: 'Сосредоточься на подготовке к экзаменам',    accent: 'text-red-400',     border: 'border-red-500/30' },
    }
    const skill = skillConfig[testResult.code]

    return (
      <main className="min-h-screen bg-[var(--bg-base)] bg-vignette flex items-center justify-center p-6">
        {/* ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent)]/[0.07] blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="card-glass p-10 max-w-md w-full text-center relative z-10"
        >
          {/* Header */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-violet-600 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={22} strokeWidth={1.5} className="text-white" />
          </div>

          <p className="t-label mb-2">Тест завершён</p>

          {/* MBTI result */}
          {isMBTI && mbti && (
            <>
              <h1 className="t-hero gradient-text-accent mb-1">{testResult.code}</h1>
              <p className="t-headline text-[var(--text-primary)] mb-3">{mbti.title}</p>
              <p className="t-body leading-loose mb-8">{mbti.desc}</p>
              <div className="border-t border-[var(--border)] pt-6">
                <p className="t-label mb-3">Подходящие направления</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mbti.careers.map(c => (
                    <span key={c} className="btn-secondary text-xs px-4 py-2 h-auto cursor-default flex items-center gap-1.5">
                      <Sparkles size={10} strokeWidth={1.5} className="text-[var(--accent)]" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Interest result */}
          {isInterest && interest && (
            <>
              <h1 className="t-headline gradient-text-accent mb-3">{interest.title}</h1>
              <p className="t-body leading-loose mb-8">{interest.desc}</p>
              <div className="border-t border-[var(--border)] pt-6">
                <p className="t-label mb-3">Рекомендуемые специальности</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {interest.specialties.map(s => (
                    <span key={s} className="btn-secondary text-xs px-4 py-2 h-auto cursor-default flex items-center gap-1.5">
                      <Sparkles size={10} strokeWidth={1.5} className="text-[var(--accent)]" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Skills result */}
          {skill && (
            <div className={`card-glass border ${skill.border} p-6 mb-6`}>
              <p className={`t-headline mb-1 ${skill.accent}`}>{skill.label}</p>
              <p className="t-body text-sm">{skill.sub}</p>
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-3 mt-8">
            <button onClick={() => router.push('/tests')} className="btn-secondary flex-1">
              К тестам
            </button>
            <button onClick={() => router.push('/profile')} className="btn-primary flex-1">
              Профиль
            </button>
          </div>
        </motion.div>
      </main>
    )
  }

  /* ── No questions ────────────────────────────────────────────────────── */
  if (questions.length === 0) return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="card-glass p-10 text-center max-w-sm w-full">
        <p className="t-body mb-6">В этом тесте пока нет вопросов</p>
        <button onClick={() => router.push('/tests')} className="btn-secondary">← Назад</button>
      </div>
    </main>
  )

  /* ── Quiz interface ───────────────────────────────────────────────────── */
  const currentQuestion = questions[currentIndex]
  const isLast    = currentIndex === questions.length - 1
  const hasAnswer = answers[currentQuestion.id]?.length > 0
  const progressPct = ((currentIndex + (hasAnswer ? 1 : 0)) / questions.length) * 100

  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col">

      {/* Fixed top progress bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-[3px] bg-white/[0.05]">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-violet-500"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Back + counter */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/tests')}
          className="flex items-center gap-1.5 t-label normal-case tracking-normal text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Выйти
        </button>
        <span className="t-label">{currentIndex + 1} / {questions.length}</span>
      </div>

      {/* Question + options */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              {/* Question card */}
              <div className="card-glass p-10 mb-6">
                <p className="t-label mb-4">Вопрос {currentIndex + 1}</p>
                <h2 className="t-headline leading-snug">{currentQuestion.text}</h2>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options
                  .sort((a, b) => a.order - b.order)
                  .map(option => {
                    const selected = answers[currentQuestion.id]?.includes(option.id)
                    return (
                      <button
                        key={option.id}
                        onClick={() => selectOption(currentQuestion.id, option.id)}
                        className={`card card-hover text-left p-5 transition-all duration-200 ${
                          selected
                            ? 'border-[var(--accent)]/50 bg-[var(--accent)]/[0.06] ring-2 ring-[var(--accent)]/30'
                            : 'hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            selected
                              ? 'border-[var(--accent)] bg-[var(--accent)]'
                              : 'border-[var(--border-strong)]'
                          }`}>
                            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className={`t-body text-sm leading-snug ${selected ? 'text-[var(--text-primary)]' : ''}`}>
                            {option.text}
                          </span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(i => i - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                Назад
              </button>
            )}
            <div className="flex-1" />
            {isLast ? (
              <button
                onClick={finishTest}
                disabled={!hasAnswer || submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-40"
              >
                {submitting
                  ? <><Loader2 size={14} strokeWidth={2} className="animate-spin" /> Сохраняем...</>
                  : <><CheckCheck size={14} strokeWidth={2} /> Завершить</>
                }
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                disabled={!hasAnswer}
                className="btn-primary flex items-center gap-2 disabled:opacity-40"
              >
                Далее
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

    </main>
  )
}
