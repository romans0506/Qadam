import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: NextRequest) {
  const { student, results } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Ты карьерный советник для казахстанских школьников. Отвечай на русском языке, дружелюбно и просто.

Данные студента:
- Класс: ${student.grade}
- Город: ${student.city}  
- Средний балл (GPA): ${student.gpa}
- Балл ЕНТ: ${student.ent_score || 'не сдавал'}
- Интересы: ${student.interests.join(', ')}

Топ результаты по шансам поступления:
${results.slice(0, 3).map((r: {specialty: string, university: string, chance: number}) => 
  `- ${r.specialty} в ${r.university}: ${r.chance}%`
).join('\n')}

Дай:
1. Короткий персональный анализ (2-3 предложения)
2. Топ-3 конкретных совета по подготовке к ЕНТ
3. Один главный совет по выбору специальности

Будь конкретным и мотивирующим!`
      }
    ]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  
  return NextResponse.json({ analysis: text })
}