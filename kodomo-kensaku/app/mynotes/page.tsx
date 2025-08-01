'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Book, Trophy, MapPin, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MyNote {
  id: string
  entry_title: string
  summary: string
  knowledge_card: string[]
  shop_visit_log: any
  created_at: string
}

export default function MyNotes() {
  const router = useRouter()
  const [notes, setNotes] = useState<MyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [userId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || ''
      : ''
  )

  useEffect(() => {
    if (userId) {
      fetchNotes()
    }
  }, [userId])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('mynotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          トップページへ戻る
        </button>

        <h1 className="text-4xl font-bold text-center mb-8 text-orange-800 flex items-center justify-center gap-3">
          <Book className="w-10 h-10" />
          わたしの まなびノート
        </h1>

        {loading ? (
          <div className="text-center">
            <p className="text-xl text-gray-600">よみこみちゅう... 📖</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-2xl text-gray-500 mb-4">まだ ノートが ないよ！</p>
            <p className="text-lg text-gray-400">けんさくして まなんだことが ここに きろくされるよ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-bold mb-3 text-gray-800">
                  {note.entry_title}
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {note.summary}
                </p>

                {note.knowledge_card.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-gray-700">ゲットした カード</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {note.knowledge_card.map((card, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                        >
                          {card}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {note.shop_visit_log && Object.keys(note.shop_visit_log).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-gray-700">おみせ ほうもん</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {note.shop_visit_log.shop_name}を ほうもんしたよ！
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-400 mt-4">
                  {formatDate(note.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-purple-800">
            🌟 まなびの きろく
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{notes.length}</p>
              <p className="text-gray-600">しらべた かず</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-bold text-yellow-600">
                {notes.reduce((acc, note) => acc + note.knowledge_card.length, 0)}
              </p>
              <p className="text-gray-600">あつめた カード</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">
                {notes.filter(note => note.shop_visit_log && Object.keys(note.shop_visit_log).length > 0).length}
              </p>
              <p className="text-gray-600">おみせ ほうもん</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}