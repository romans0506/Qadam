import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, remaining, resetIn } = rateLimit(`assistant:${ip}`, 20, 60_000)

  if (!allowed) {
    return NextResponse.json(
      { message: `Слишком много запросов. Попробуй через ${Math.ceil(resetIn / 1000)} сек.` },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)), 'X-RateLimit-Remaining': '0' },
      }
    )
  }

  const { messages, profile, portfolio, isInitial } = await req.json()

  const profileSummary = `
Профиль студента:
- Имя: ${profile?.full_name || 'не указано'}
- Класс: ${profile?.grade || 'не указан'}
- GPA: ${profile?.gpa || 'не указан'}
- ЕНТ: ${profile?.ent_score || 'не сдавал'}
- SAT: ${profile?.sat_score || 'не сдавал'}
- IELTS: ${profile?.ielts_score || 'не сдавал'}
- Интересы: ${profile?.interests?.join(', ') || 'не указаны'}
- Цель: ${profile?.target_university || 'не указан'}, ${profile?.target_specialty || 'не указана'}
- Тип личности: ${profile?.personality_type || 'не определён'}
- Портфолио: ${portfolio?.length || 0} достижений`

  const systemPrompt = `Ты — Qadam AI, персональный помощник для казахстанских школьников по поступлению в университеты.

${profileSummary}

Отвечай на русском языке. Будь конкретным и мотивирующим. Максимум 300 слов.`

  try {
    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: 'NVIDIA_API_KEY is not set in environment variables' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(isInitial
            ? [{ role: 'user', content: 'Проанализируй мой профиль и дай персональные рекомендации. Укажи сильные и слабые стороны и с чего начать подготовку.' }]
            : messages.map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content
              }))
          )
        ],
        temperature: 0.7,
        max_tokens: 1024,
      })
    })
    clearTimeout(timeoutId)

    const text = await response.text()
    console.log('NVIDIA response:', text)

    if (!response.ok) {
      return NextResponse.json(
        { message: 'NVIDIA API error', status: response.status, raw: text },
        { status: response.status }
      )
    }

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { message: 'NVIDIA returned non-JSON response', raw: text },
        { status: 500 }
      )
    }

    const message = data.choices?.[0]?.message?.content || 'Не удалось получить ответ'
    return NextResponse.json({ message })

  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError'
    console.error('AI error:', error)
    return NextResponse.json(
      { message: isTimeout ? 'AI не ответил вовремя. Попробуй ещё раз.' : 'AI временно недоступен. Попробуй позже.' },
      { status: 500 }
    )
  }
}