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
    const { query, userId } = await req.json()

    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing query or userId' }),
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
            content: 'あなたは子供向けの優しい先生です。子供が理解しやすいように、簡単な言葉で説明してください。回答は200文字程度にしてください。'
          },
          {
            role: 'user',
            content: query
          }
        ],
        stream: true
      }),
    })

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI API error: ${openAiResponse.status}`)
    }

    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openAiResponse.body?.getReader()
        if (!reader) {
          controller.error(new Error('No response body'))
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    fullResponse += content
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', data: content })}\n\n`))
                  }
                } catch (e) {
                  // JSONパースエラーは無視
                }
              }
            }
          }
        } catch (error) {
          controller.error(error instanceof Error ? error : new Error('Unknown error'))
        } finally {
          reader.releaseLock()
        }
      }
    })

    // データベースにログを保存（非同期）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // バックグラウンドでログを保存
    setTimeout(async () => {
      try {
        const responseText = fullResponse || 'AI response'
        await supabase.from('search_logs').insert({
          user_id: userId,
          query: query,
          result_summary: responseText.trim()
        })

        await supabase.from('messages').insert({
          user_id: userId,
          message: query,
          answer: responseText
        })
      } catch (error) {
        console.error('Error saving logs:', error instanceof Error ? error.message : 'Unknown error')
      }
    }, 1000)

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})