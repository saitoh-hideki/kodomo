import React, { useState } from 'react'
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react'

interface QuizProps {
  quiz: {
    question: string
    options: string[]
    correctAnswer: string
  }
  onAnswer: (answer: string, isCorrect: boolean) => void
  onNextQuestion: () => void
}

export default function Quiz({ quiz, onAnswer, onNextQuestion }: QuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  // デバッグ用：クイズデータをコンソールに出力
  console.log('Quiz component received:', quiz)

  const handleAnswer = (option: string) => {
    if (showResult) return
    
    setSelectedAnswer(option)
    setShowResult(true)
    
    // 正解判定を修正：選択肢のテキストと正解を直接比較
    const isCorrect = option === quiz.correctAnswer
    onAnswer(option, isCorrect)
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
      <h3 className="text-lg font-bold mb-3 flex items-center text-black">
        <span className="text-2xl mr-2">❓</span>
        クイズタイム！
      </h3>
      <p className="text-lg mb-4 text-black">{quiz.question}</p>
      
      <div className="space-y-2">
        {quiz.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrect = option === quiz.correctAnswer
          
          return (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`
                w-full text-left p-3 rounded-lg transition-all text-lg text-black
                ${!showResult ? 'hover:bg-white hover:shadow cursor-pointer' : ''}
                ${showResult && isSelected && isCorrect ? 'bg-green-200 text-green-800' : ''}
                ${showResult && isSelected && !isCorrect ? 'bg-red-200 text-red-800' : ''}
                ${showResult && !isSelected && isCorrect ? 'bg-green-100 text-green-700' : ''}
                ${!showResult ? 'bg-white' : ''}
              `}
            >
              <span className="flex items-center justify-between">
                {option}
                {showResult && isSelected && isCorrect && <CheckCircle className="w-6 h-6 text-green-600" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-600" />}
              </span>
            </button>
          )
        })}
      </div>
      
      {showResult && (
        <div className="mt-4 space-y-3">
          <div className={`p-3 rounded-lg text-center font-bold ${
            selectedAnswer === quiz.correctAnswer ? 
            'bg-green-200 text-green-800' : 
            'bg-red-200 text-red-800'
          }`}>
            {selectedAnswer === quiz.correctAnswer ? 
              '🎉 せいかい！1マス すすむよ！' : 
              '😢 ざんねん！1マス もどるよ...'
            }
          </div>
          
          <button
            onClick={onNextQuestion}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            <MessageCircle className="w-5 h-5" />
            つぎの しつもんを する
          </button>
        </div>
      )}
    </div>
  )
}