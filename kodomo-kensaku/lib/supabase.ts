import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgqocipbrjvribupcoxp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncW9jaXBicmp2cmlidXBjb3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzI2MjUsImV4cCI6MjA2OTU0ODYyNX0.SuDLRiF3tGwnXxJKjxa3xmhxtK7dCYM-V19mQAzmDdQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)