import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, resetIn } = rateLimit(`strengths:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { profile, portfolio } = await req.json()

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'NVIDIA_API_KEY not set' }, { status: 500 })

  const portfolioList = portfolio?.length
    ? portfolio.map((p: any) => `${p.type}: ${p.title}${p.year ? ` (${p.year})` : ''}`).join(', ')
    : 'нет'

  const prompt = `Проанализируй профиль казахстанского школьника и верни ТОЛЬКО валидный JSON без лишнего текста.

Профиль:
- GPA: ${profile?.gpa || 'нет'}
- ЕНТ: ${profile?.ent_score ? `${profile.ent_score}/140` : 'нет'}
- SAT: ${profile?.sat_score ? `${profile.sat_score}/1600` : 'нет'}
- ACT: ${profile?.act_score ? `${profile.act_score}/36` : 'нет'}
- IELTS: ${profile?.ielts_score ? `${profile.ielts_score}/9` : 'нет'}
- TOEFL: ${profile?.toefl_score ? `${profile.toefl_score}/120` : 'нет'}
- Цель: ${profile?.target_university || 'не указан'} (${profile?.target_country || '?'})
- Специальность: ${profile?.target_specialty || 'не указана'}
- Портфолио: ${portfolioList}
- Тип личности: ${profile?.personality_type || 'нет'}

Верни JSON строго в таком формате:
{
  "strengths": ["краткая сильная сторона 1", "краткая сильная сторона 2"],
  "weaknesses": ["краткая слабая сторона 1", "краткая слабая сторона 2"],
  "next_steps": ["конкретный шаг 1", "конкретный шаг 2", "конкретный шаг 3"],
  "score": 72
}

Поле score — общая оценка конкурентоспособности от 0 до 100. Массивы — 2-3 элемента максимум. Только JSON, никакого другого текста.`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 40000)

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.2,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    clearTimeout(timeoutId)

    const raw = await response.text()
    if (!response.ok) return NextResponse.json({ error: 'NVIDIA error', raw }, { status: response.status })

    const data = JSON.parse(raw)
    const content = data.choices?.[0]?.message?.content || ''

    // Вытаскиваем JSON из ответа (модель может добавить текст вокруг)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON in response', content }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
