import { Result } from '@/services/calculatorService'

export default function ScoreCard({ result }: { result: Result }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{result.specialty}</h3>
          <p className="text-gray-500">{result.university}</p>
        </div>
        <div className={`text-3xl font-bold ${
          result.color === 'green' ? 'text-green-500' :
          result.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {result.chance}%
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${
            result.color === 'green' ? 'bg-green-500' :
            result.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${result.chance}%` }}
        />
      </div>

      <p className="text-sm text-gray-500 mt-2">
        {result.chance >= 70 ? '✅ Высокие шансы — подавай!' :
         result.chance >= 40 ? '⚠️ Средние шансы — готовься усерднее' :
         '❌ Низкие шансы — нужно больше подготовки'}
      </p>
    </div>
  )
}