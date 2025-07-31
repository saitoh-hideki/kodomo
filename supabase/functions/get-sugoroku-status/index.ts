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
    const { userId, theme } = await req.json()

    if (!userId || !theme) {
      return new Response(
        JSON.stringify({ error: 'userId and theme are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Supabaseクライアントを作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // データベース接続をテスト
    try {
      const { data: testData, error: testError } = await supabase
        .from('sugoroku_progress')
        .select('count')
        .limit(1)

      if (testError) {
        console.error('Database connection test failed:', testError)
        return new Response(
          JSON.stringify({ 
            error: 'Database connection failed',
            details: testError.message,
            theme: theme,
            currentPosition: 0,
            finished: false,
            startedAt: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // データベース接続成功、進捗データを取得
      const { data: progress, error } = await supabase
        .from('sugoroku_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('theme', theme)
        .single()

      if (error && error.code === 'PGRST116') {
        // データが存在しない場合は新規作成
        const { data: newProgress, error: insertError } = await supabase
          .from('sugoroku_progress')
          .insert({
            user_id: userId,
            theme: theme,
            current_position: 0,
            finished: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating progress:', insertError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create progress',
              details: insertError.message,
              theme: theme,
              currentPosition: 0,
              finished: false,
              startedAt: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        return new Response(
          JSON.stringify({
            theme: theme,
            currentPosition: newProgress?.current_position || 0,
            finished: newProgress?.finished || false,
            startedAt: newProgress?.started_at || new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (error) {
        console.error('Error fetching progress:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch progress',
            details: error.message,
            theme: theme,
            currentPosition: 0,
            finished: false,
            startedAt: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({
          theme: theme,
          currentPosition: progress?.current_position || 0,
          finished: progress?.finished || false,
          startedAt: progress?.started_at || new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          theme: theme,
          currentPosition: 0,
          finished: false,
          startedAt: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        theme: 'パン作り',
        currentPosition: 0,
        finished: false,
        startedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})