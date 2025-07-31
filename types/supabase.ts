export interface SearchLog {
  id: string
  user_id: string
  query: string
  result_summary: string
  created_at: string
}

export interface Teacher {
  id: string
  name: string
  shop_name: string
  specialty: string
  location: string
  profile_img_url: string
  visit_type: string
}

export interface Message {
  id: string
  user_id: string
  teacher_id?: string
  message: string
  answer: string
  created_at: string
}

export interface MyNote {
  id: string
  user_id: string
  entry_title: string
  summary: string
  knowledge_card: string[]
  shop_visit_log: any
  created_at: string
}

export interface SugorokuProgress {
  id: string
  user_id: string
  theme: string
  current_position: number
  started_at: string
  finished: boolean
}