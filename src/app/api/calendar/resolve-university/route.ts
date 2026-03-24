import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

type Candidate = { id: string; name: string; description_short?: string | null }

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, remaining, resetIn } = rateLimit(`resolve-uni:${ip}`, 30, 60_000)

  if (!allowed) {
    return NextResponse.json(
      { error: `Слишком много запросов. Попробуй через ${Math.ceil(resetIn / 1000)} сек.` },
      { status: 429 }
    )
  }

  const { query, candidates } = (await req.json()) as {
    query: string
    candidates: Candidate[]
  }

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'NVIDIA_API_KEY is not set' },
      { status: 500 }
    )
  }

  const systemPrompt = `
Ты помогаешь сопоставлять упомянутый пользователем университет с записью из списка кандидатов.

Правила:
1) Выбирай только ОДИН лучший матч (самый вероятный).
2) Если подходящего в списке нет, верни university_id = null.
3) Верни ТОЛЬКО валидный JSON без комментариев.
4) Поле confidence должно быть числом от 0 до 1.
`

  const userPrompt = `
Запрос пользователя:
${query}

Кандидаты (выбери из них):
${(candidates || [])
  .map((c, i) => `${i + 1}) ${c.name} [id=${c.id}]`)
  .join('\n')}
`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          temperature: 0,
          max_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt.trim() },
            { role: 'user', content: userPrompt.trim() },
          ],
        }),
      }
    )

    clearTimeout(timeoutId)

    const raw = await response.text()
    if (!response.ok) {
      return NextResponse.json(
        { error: 'NVIDIA error', status: response.status, raw },
        { status: response.status }
      )
    }

    let json: any
    try {
      json = JSON.parse(raw)
    } catch {
      // Иногда модель может вернуть текст вокруг JSON
      // Поэтому пытаемся достать content и распарсить его как JSON.
      const fallback = (() => {
        try {
          const data = JSON.parse(raw)
          return data.choices?.[0]?.message?.content ?? null
        } catch {
          return null
        }
      })()
      if (fallback) {
        try {
          return NextResponse.json(JSON.parse(fallback))
        } catch {
          // fallthrough
        }
      }
      return NextResponse.json(
        { error: 'NVIDIA returned non-JSON response', raw },
        { status: 500 }
      )
    }

    const content = json.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No content from NVIDIA', raw },
        { status: 500 }
      )
    }

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json(
        { error: 'Content is not JSON', content, raw },
        { status: 500 }
      )
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: 'AI resolver error', detail: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}

