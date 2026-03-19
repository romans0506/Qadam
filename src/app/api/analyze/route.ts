import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { profile } = await req.json()

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Напиши короткую биографию (3-4 предложения) для казахстанского школьника для образовательного профиля на сайте Qadam. На русском языке, от первого лица, дружелюбно и профессионально.

Данные:
- Имя: ${profile.full_name || 'не указано'}
- Класс: ${profile.grade || 'не указан'}
- Город: ${profile.city || 'не указан'}
- Школа: ${profile.school || 'не указана'}
- GPA: ${profile.gpa || 'не указан'}
- Интересы: ${profile.interests?.join(', ') || 'не указаны'}
- Цель: поступить в ${profile.target_university || 'университет'} на ${profile.target_specialty || 'специальность'}
- Языки: ${profile.languages?.join(', ') || 'не указаны'}

Напиши только биографию, без лишних слов.`
      }]
    })

    const bio = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ bio })
  } catch {
    return NextResponse.json({ bio: null }, { status: 500 })
  }
}