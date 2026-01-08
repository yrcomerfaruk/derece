-- Create Program Tables
-- Run this in Supabase SQL Editor

-- 1. Weekly Programs Table
CREATE TABLE IF NOT EXISTS user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Program Items (Daily Slots) Table
CREATE TABLE IF NOT EXISTS program_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES user_programs(id) ON DELETE CASCADE NOT NULL,
  day_index INTEGER NOT NULL, -- 0 (Monday) to 6 (Sunday)
  slot_index INTEGER NOT NULL, -- 1, 2, 3...
  topic_id UUID REFERENCES topics(id), -- Nullable for custom items or breaks
  activity_type TEXT NOT NULL, -- 'study', 'test', 'review'
  duration_minutes INTEGER DEFAULT 50,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;

-- user_programs policies
CREATE POLICY "Users can view own programs" ON user_programs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own programs" ON user_programs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs" ON user_programs
  FOR UPDATE USING (auth.uid() = user_id);

-- program_items policies
CREATE POLICY "Users can view own program items" ON program_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_programs 
      WHERE user_programs.id = program_items.program_id 
      AND user_programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own program items" ON program_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_programs 
      WHERE user_programs.id = program_items.program_id 
      AND user_programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own program items" ON program_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_programs 
      WHERE user_programs.id = program_items.program_id 
      AND user_programs.user_id = auth.uid()
    )
  );
