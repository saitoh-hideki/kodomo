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
    const { userId, theme, answer, isCorrect } = await req.json()

    if (!userId || !theme) {
      return new Response(
        JSON.stringify({ error: 'userId and theme are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 現在の進捗を取得
    const { data: progress, error } = await supabase
      .from('sugoroku_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('theme', theme)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error)
      throw error
    }

    let currentPosition = progress?.current_position || 0
    let newPosition = currentPosition

    // 正解・不正解に応じて位置を更新
    if (isCorrect) {
      newPosition = Math.min(currentPosition + 1, 10)
    } else {
      newPosition = Math.max(currentPosition - 1, 0)
    }

    const finished = newPosition === 10

    // 進捗を更新または作成
    if (progress) {
      const { error: updateError } = await supabase
        .from('sugoroku_progress')
        .update({
          current_position: newPosition,
          finished: finished
        })
        .eq('user_id', userId)
        .eq('theme', theme)

      if (updateError) {
        console.error('Error updating progress:', updateError)
        throw updateError
      }
    } else {
      const { error: insertError } = await supabase
        .from('sugoroku_progress')
        .insert({
          user_id: userId,
          theme: theme,
          current_position: newPosition,
          finished: finished
        })

      if (insertError) {
        console.error('Error creating progress:', insertError)
        throw insertError
      }
    }

    // ゴール時の報酬を取得
    let reward = null
    if (finished) {
      try {
        const { data: teachers, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .ilike('specialty', `%${theme}%`)
          .limit(1)
          .single()

        if (!teacherError) {
          reward = {
            knowledgeCard: `${theme}マスター`,
            teacher: teachers
          }
        }
      } catch (teacherError) {
        console.error('Error fetching teacher:', teacherError)
        // 教師が見つからない場合でも報酬は提供
        reward = {
          knowledgeCard: `${theme}マスター`,
          teacher: null
        }
      }
    }

    return new Response(
      JSON.stringify({
        correct: isCorrect,
        newPosition: newPosition,
        finished: finished,
        reward: reward
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        correct: false,
        newPosition: 0,
        finished: false,
        reward: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})