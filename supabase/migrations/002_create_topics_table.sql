-- Create Topics Table for Curriculum
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,          -- e.g., 'TYT Matematik'
  title TEXT NOT NULL,            -- e.g., 'Temel Kavramlar'
  description TEXT,               -- Konu açıklaması
  slug TEXT,                      -- e.g., 'tyt_mat_temel_kavramlar'
  study_hours INTEGER DEFAULT 0,  -- Kaç saat süreceği
  test_hours INTEGER DEFAULT 0,   -- Kaç saat test süreceği
  review_hours INTEGER DEFAULT 0, -- Kaç saate tekrar edileceği
  order_index INTEGER DEFAULT 0,  -- Sıralama
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read topics (public curriculum)
CREATE POLICY "Public read access" ON topics
  FOR SELECT USING (true);

-- Allow authenticated users to insert (for admin/content entry per user request)
CREATE POLICY "Authenticated insert access" ON topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update/delete (for corrections)
CREATE POLICY "Authenticated update access" ON topics
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete access" ON topics
  FOR DELETE USING (auth.role() = 'authenticated');
