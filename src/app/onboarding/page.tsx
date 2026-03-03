'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnBoarding(){
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [data, setData] = useState({
        grade : '',
        city: '',
        gpa: '',
        ent_score: '',
        interests: [] as string[],
        subjects:{
            математика: '',
            физика: '',
            химия: '',
            биология: '',
            история: '',
            английский: '',
        }
    })
    
    const interests = ['IT', 'Медицина','Право','Бизнес','Инженерия','Педагогика']
    
    const toggleInterest = (interest : string) => {
        setData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
            ? prev.interests.filter(i => i !== interest)
            :[...prev.interests,interest]
        }))
    }
    return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        
        {/* Прогресс */}
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Шаг 1 — Основная информация */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Основная информация</h2>
            
            <label className="block text-gray-600 mb-1">Класс</label>
            <select
              className="w-full border rounded-lg p-3 mb-4 text-gray-800"
              value={data.grade}
              onChange={e => setData({...data, grade: e.target.value})}
            >
              <option value="">Выбери класс</option>
              {[8,9,10,11].map(g => <option key={g} value={g}>{g} класс</option>)}
            </select>

            <label className="block text-gray-600 mb-1">Город</label>
            <input
              className="w-full border rounded-lg p-3 mb-4 text-gray-800"
              placeholder="Например: Алматы"
              value={data.city}
              onChange={e => setData({...data, city: e.target.value})}
            />

            <label className="block text-gray-600 mb-1">Средний балл (GPA)</label>
            <input
              className="w-full border rounded-lg p-3 mb-4 text-gray-800"
              placeholder="Например: 4.5"
              type="number"
              min="1" max="5" step="0.1"
              value={data.gpa}
              onChange={e => setData({...data, gpa: e.target.value})}
            />

            <label className="block text-gray-600 mb-1">Балл ЕНТ (если сдавал)</label>
            <input
              className="w-full border rounded-lg p-3 mb-6 text-gray-800"
              placeholder="Оставь пустым если не сдавал"
              type="number"
              value={data.ent_score}
              onChange={e => setData({...data, ent_score: e.target.value})}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!data.grade || !data.city || !data.gpa}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
            >
              Далее →
            </button>
          </div>
        )}

        {/* Шаг 2 — Интересы */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Твои интересы</h2>
            <p className="text-gray-500 mb-6">Выбери одно или несколько направлений</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {interests.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                    data.interests.includes(interest)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50">
                ← Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={data.interests.length === 0}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
              >
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Шаг 3 — Оценки */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Оценки по предметам</h2>
            <p className="text-gray-500 mb-6">Укажи свои оценки (1-5)</p>
            
            <div className="space-y-3 mb-8">
              {Object.keys(data.subjects).map(subject => (
                <div key={subject} className="flex items-center gap-3">
                  <label className="flex-1 text-gray-700 capitalize">{subject}</label>
                  <input
                    type="number"
                    min="1" max="5"
                    className="w-20 border rounded-lg p-2 text-center text-gray-800"
                    placeholder="1-5"
                    value={data.subjects[subject as keyof typeof data.subjects]}
                    onChange={e => setData({
                      ...data,
                      subjects: {...data.subjects, [subject]: e.target.value}
                    })}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50">
                ← Назад
              </button>
              <button
            onClick={async () => {
                    localStorage.setItem('studentData', JSON.stringify(data))
                const { supabase } = await import('@/lib/supabase')

                const { data: student } = await supabase
                    .from('students')
                    .insert({
                        grade: parseInt(data.grade),
                        city: data.city,
                        gpa: parseFloat(data.gpa),
                        ent_score: data.ent_score ? parseInt(data.ent_score): null 
                    }) 
                .select()
                .single()

            if(student){
                
                const subjects = Object.entries(data.subjects)
                .filter(([, grade]) => grade !== '')
                .map(([subject, grade]) => ({
                  student_id: student.id,
                  subject,
                  grade: parseInt(grade)  
                }))

            if(subjects.length > 0) {
                await supabase.from('student_subjects').insert(subjects)
            }

            const interests = data.interests.map(interest => ({
                student_id: student.id,
                interest
            }))

            if(interests.length > 0){
                await supabase.from('student_interests').insert(interests)
            }
         }    


         router.push('/dashboard')

                }}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Узнать шансы 🎯
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}