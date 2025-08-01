'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function TeacherRegistration() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    specialty: '',
    location: '',
    profile_img_url: '',
    visit_type: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('teachers')
        .insert([formData])

      if (error) throw error

      alert('登録が完了しました！子どもたちがあなたのお店を訪れるのを楽しみにしています！')
      router.push('/')
    } catch (error) {
      console.error('Error:', error)
      alert('登録中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          トップページへ戻る
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-green-800 flex items-center justify-center gap-3">
            <Store className="w-8 h-8" />
            商店主先生 登録フォーム
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                お名前
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="例：うちだ たかし"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                お店の名前
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
                placeholder="例：うちだパン店"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                教えられるテーマ（専門分野）
              </label>
              <textarea
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                placeholder="例：パン作り、発酵、粉の違い、地元の小麦について"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg h-24"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                お店の場所
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="例：東京都世田谷区〇〇1-2-3"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                プロフィール写真URL（任意）
              </label>
              <input
                type="url"
                name="profile_img_url"
                value={formData.profile_img_url}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-700">
                来店方式
              </label>
              <select
                name="visit_type"
                value={formData.visit_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-400 focus:outline-none text-lg"
              >
                <option value="">選択してください</option>
                <option value="自由見学">自由見学</option>
                <option value="予約制">予約制</option>
                <option value="体験可（予約制）">体験可（予約制）</option>
                <option value="見学のみ">見学のみ</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ご注意：</strong>
                登録後、子どもたちからの質問への応答はすべてAIが自動で行います。
                商店主様に直接の負担はかかりません。
                実際の店舗訪問時のみ、子どもたちと交流していただく形になります。
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-500 text-white text-xl font-bold rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}