import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { profile } = await req.json()

  try {
    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { bio: null, message: 'NVIDIA_API_KEY is not set in environment variables' },
        { status: 500 }
      )
    }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Попробуй именно этот вариант ID, он самый стабильный для 3.1 8b
        model: 'meta/llama-3.1-8b-instruct', 
        messages: [{
          role: 'user',
          content: `Напиши биографию для: ${profile.full_name}, ${profile.grade} класс, г. ${profile.city}.`
        }],
        temperature: 0.2, // Поставим поменьше для теста
        top_p: 0.7,
        max_tokens: 1024,
      })
    })

    // Если NVIDIA вернула ошибку (404, 401 и т.д.)
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`NVIDIA API Error (${response.status}):`, errorText);
      return NextResponse.json({ bio: null, error: errorText }, { status: response.status });
    }

    const raw = await response.text()
    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      return NextResponse.json({ bio: null, error: raw }, { status: 500 })
    }
    const bio = data.choices?.[0]?.message?.content || null
    return NextResponse.json({ bio })

  } catch {
    return NextResponse.json({ bio: null }, { status: 500 })
  }
}