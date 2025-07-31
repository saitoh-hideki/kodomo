import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { topic, userId } = await req.json()

    if (!topic || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing topic or userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `あなたは子供向けのクイズを作成する先生です。
以下の形式でクイズを作成してください：

クイズ：「[質問]」
A) [選択肢1]
B) [選択肢2]
C) [選択肢3]

正解は必ずA)にしてください。質問は子供が理解しやすい内容にしてください。`
          },
          {
            role: 'user',
            content: `「${topic}」についてのクイズを作成してください。`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    })

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI API error: ${openAiResponse.status}`)
    }

    const response = await openAiResponse.json()
    const content = response.choices[0].message.content

    // クイズデータを解析
    const lines = content.split('\n').filter(line => line.trim())
    let question = ''
    const options = []
    let correctAnswer = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('クイズ：')) {
        question = trimmedLine.replace('クイズ：', '').trim()
      } else if (trimmedLine.match(/^[A-C]\)/)) {
        const optionText = trimmedLine.replace(/^[A-C]\)\s*/, '')
        options.push(optionText)
        
        // A)が正解
        if (trimmedLine.startsWith('A)')) {
          correctAnswer = optionText
        }
      }
    }

    const quizData = {
      question: question,
      options: options,
      correctAnswer: correctAnswer
    }

    // データベースにログを保存（非同期）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    setTimeout(async () => {
      try {
        await supabase.from('search_logs').insert({
          user_id: userId,
          query: `クイズ生成: ${topic}`,
          result_summary: `クイズ: ${question}`
        })
      } catch (error) {
        console.error('Error saving quiz log:', error instanceof Error ? error.message : 'Unknown error')
      }
    }, 1000)

    return new Response(
      JSON.stringify({ quiz: quizData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 