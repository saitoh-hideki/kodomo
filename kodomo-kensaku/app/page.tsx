'use client'

import { useState, useEffect } from 'react'
import { Send, Sparkles, Book, Store } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SugorokuBoard from '@/components/SugorokuBoard'
import Quiz from '@/components/Quiz'

interface Message {
  role: 'user' | 'assistant'
  content: string
  quiz?: {
    question: string
    options: string[]
    correctAnswer: string
  }
}

const SUPABASE_URL = 'https://sgqocipbrjvribupcoxp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncW9jaXBicmp2cmlidXBjb3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzI2MjUsImV4cCI6MjA2OTU0ODYyNX0.SuDLRiF3tGwnXxJKjxa3xmhxtK7dCYM-V19mQAzmDdQ'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || crypto.randomUUID()
      : ''
  )
  const [currentTheme, setCurrentTheme] = useState('パン作り')
  const [sugorokuPosition, setSugorokuPosition] = useState(0)
  const [chatContainerRef, setChatContainerRef] = useState<HTMLDivElement | null>(null)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherInfo, setTeacherInfo] = useState<{
    name: string
    shop_name: string
    specialty: string
    location: string
    knowledgeCard: string
  } | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<{
    question: string
    options: string[]
    correctAnswer: string
  } | null>(null)

  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      localStorage.setItem('userId', userId)
      fetchSugorokuStatus()
    }
  }, [userId])

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    if (chatContainerRef) {
      chatContainerRef.scrollTop = chatContainerRef.scrollHeight
    }
  }, [messages, chatContainerRef])

  const fetchSugorokuStatus = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-sugoroku-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ userId, theme: currentTheme })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSugorokuPosition(data.currentPosition || 0)
      } else {
        console.error('Failed to fetch sugoroku status:', response.status, data)
        // エラー時でもデフォルト値を設定
        setSugorokuPosition(data.currentPosition || 0)
      }
    } catch (error) {
      console.error('Error fetching sugoroku status:', error)
      // エラー時はデフォルト値を設定
      setSugorokuPosition(0)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // ストリーミング用のアシスタントメッセージを追加
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-ai-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ query: input, userId })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        let currentContent = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.type === 'content') {
                    currentContent += data.data
                    // 最新のメッセージを更新
                    setMessages(prev => {
                      const newMessages = [...prev]
                      const lastMessage = newMessages[newMessages.length - 1]
                      if (lastMessage && lastMessage.role === 'assistant') {
                        lastMessage.content = currentContent
                      }
                      return newMessages
                    })
                  }
                } catch (e) {
                  // JSONパースエラーは無視
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }

        // チャットが完了したら、クイズを生成
        setTimeout(async () => {
          try {
            const quizResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-quiz`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ topic: input, userId })
            })

            if (quizResponse.ok) {
              const quizData = await quizResponse.json()
              if (quizData.quiz) {
                setCurrentQuiz(quizData.quiz)
              }
            }
          } catch (error) {
            console.error('Error generating quiz:', error)
          }
        }, 1000)
      } else {
        // エラー時のフォールバック応答
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = 'ごめんね、今ちょっとお答えできないよ。もう一度試してみてね！'
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // エラー時のフォールバック応答
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'ごめんね、今ちょっとお答えできないよ。もう一度試してみてね！'
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuizAnswer = async (answer: string, isCorrect: boolean) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-quiz-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId,
          theme: currentTheme,
          answer,
          isCorrect
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSugorokuPosition(data.newPosition)

        if (data.finished && data.reward) {
          // 商店主の情報を設定してモーダルを表示
          if (data.reward.teacher) {
            setTeacherInfo({
              name: data.reward.teacher.name,
              shop_name: data.reward.teacher.shop_name,
              specialty: data.reward.teacher.specialty,
              location: data.reward.teacher.location,
              knowledgeCard: data.reward.knowledgeCard
            })
            setShowTeacherModal(true)
          } else {
            alert(`🎉 ゴールおめでとう！「${data.reward.knowledgeCard}」をゲットしたよ！`)
          }
        }
      } else {
        // エラー時のフォールバック処理
        const newPosition = isCorrect ? Math.min(sugorokuPosition + 1, 10) : Math.max(sugorokuPosition - 1, 0)
        setSugorokuPosition(newPosition)
        
        if (isCorrect) {
          alert('🎉 正解！1マス進んだよ！')
        } else {
          alert('😅 惜しい！1マス戻るよ。もう一度頑張ろう！')
        }
      }
    } catch (error) {
      console.error('Error handling quiz answer:', error)
      // エラー時のフォールバック処理
      const newPosition = isCorrect ? Math.min(sugorokuPosition + 1, 10) : Math.max(sugorokuPosition - 1, 0)
      setSugorokuPosition(newPosition)
      
      if (isCorrect) {
        alert('🎉 正解！1マス進んだよ！')
      } else {
        alert('😅 惜しい！1マス戻るよ。もう一度頑張ろう！')
      }
    }
  }

  const handleNextQuestion = () => {
    // クイズをクリアして新しいチャットを開始
    setCurrentQuiz(null)
    
    // 新しい質問を促すメッセージを追加
    const assistantMessage: Message = {
      role: 'assistant',
      content: 'すごいね！他にも何か知りたいことはある？例えば「パンはどうしてふくらむの？」とか「小麦粉って何？」とか、なんでも聞いてね！'
    }
    setMessages(prev => [...prev, assistantMessage])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800">
            <Sparkles className="inline-block mr-2" />
            こどもけんさく
          </h1>
          <div className="flex gap-4">
            <Link
              href="/mynotes"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
            >
              <Book className="w-5 h-5" />
              Myノート
            </Link>
            <Link
              href="/teacher-registration"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              <Store className="w-5 h-5" />
              先生登録
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            <div 
              ref={setChatContainerRef}
              className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-xl"
            >
              {messages.length === 0 ? (
                <div className="text-center text-black mt-20">
                  <p className="text-2xl mb-4">🌟 なにか きいてみよう！</p>
                  <p>「パンはどうしてふくらむの？」みたいな しつもんを してみてね</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index}>
                    <div
                      className={`p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-100 ml-auto max-w-[80%]'
                          : 'bg-white max-w-[80%] shadow'
                      }`}
                    >
                      <p className="text-lg text-black">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {/* クイズを独立して表示 */}
              {currentQuiz && (
                <div className="mt-6">
                  <Quiz
                    quiz={currentQuiz}
                    onAnswer={handleQuizAnswer}
                    onNextQuestion={handleNextQuestion}
                  />
                </div>
              )}
              

              
              {loading && (
                <div className="text-center">
                  <p className="text-black">かんがえちゅう... 🤔</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="ここに しつもんを かいてね..."
                className="flex-1 px-4 py-3 rounded-full border-2 border-gray-300 focus:border-blue-400 focus:outline-none text-lg text-black"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">
              🎲 まなびすごろく
            </h2>
            <p className="text-center mb-4 text-gray-600">
              テーマ: {currentTheme}
            </p>
            <SugorokuBoard
              position={sugorokuPosition}
              theme={currentTheme}
            />
          </div>
        </div>
      </div>

      {/* 商店主紹介モーダル */}
      {showTeacherModal && teacherInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-700 mb-4">
                🎉 ゴールおめでとう！
              </h3>
              <div className="bg-yellow-100 p-4 rounded-lg mb-6">
                <p className="text-lg font-semibold text-yellow-800">
                  「{teacherInfo.knowledgeCard}」をゲットしたよ！
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h4 className="text-xl font-bold text-blue-800 mb-3">
                  🏪 商店主先生の紹介
                </h4>
                <div className="text-left space-y-2">
                  <p><span className="font-semibold">先生：</span>{teacherInfo.name}先生</p>
                  <p><span className="font-semibold">お店：</span>{teacherInfo.shop_name}</p>
                  <p><span className="font-semibold">専門：</span>{teacherInfo.specialty}</p>
                  <p><span className="font-semibold">場所：</span>{teacherInfo.location}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                お店に行って、実際に体験してみよう！
              </p>
              
              <button
                onClick={() => setShowTeacherModal(false)}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                わかった！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}