-- search_logs table
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  result_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  location TEXT NOT NULL,
  profile_img_url TEXT,
  visit_type TEXT NOT NULL
);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  teacher_id UUID REFERENCES teachers(id),
  message TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- mynotes table
CREATE TABLE mynotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_title TEXT NOT NULL,
  summary TEXT NOT NULL,
  knowledge_card TEXT[] DEFAULT '{}',
  shop_visit_log JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- sugoroku_progress table
CREATE TABLE sugoroku_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme TEXT NOT NULL,
  current_position INTEGER DEFAULT 0 CHECK (current_position >= 0 AND current_position <= 10),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, theme)
);

-- Indexes for better performance
CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_mynotes_user_id ON mynotes(user_id);
CREATE INDEX idx_sugoroku_progress_user_id ON sugoroku_progress(user_id); 