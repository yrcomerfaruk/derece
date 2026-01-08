-- Onboarding User Data Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Step 1: Sınıf
  class_level TEXT NOT NULL, -- '12' veya 'mezun'
  
  -- Step 2: Bölüm
  department TEXT NOT NULL DEFAULT 'sayisal', -- 'sayisal' (şimdilik sadece bu)
  
  -- Step 3: Çalışmaya Başlama Zamanı
  study_start_time TEXT NOT NULL, -- 'baslamadim', '3ay', '6ay', '1yil', 'sene_basi'
  
  -- Step 4: Net Durumu (güncel ve hedef)
  nets JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Örnek: {
  --   "tyt_turkce": { "current": 20, "target": 35 },
  --   "tyt_matematik": { "current": 15, "target": 30 },
  --   "tyt_fen": { "current": 10, "target": 18 },
  --   "tyt_sosyal": { "current": 12, "target": 18 },
  --   "ayt_matematik": { "current": 10, "target": 30 },
  --   "ayt_fizik": { "current": 5, "target": 12 },
  --   "ayt_kimya": { "current": 5, "target": 10 },
  --   "ayt_biyoloji": { "current": 5, "target": 10 }
  -- }
  
  -- Step 5: Konu/Ders Seviyeleri
  subject_proficiency JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Örnek: {
  --   "tyt_turkce_paragraf": "orta",
  --   "tyt_turkce_dilbilgisi": "baslangic",
  --   "tyt_matematik_ilk12": "iyi",
  --   ...
  -- }
  
  -- Step 6: Etüt Ayarları
  study_session JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Örnek: {
  --   "duration": 50,       -- Etüt süresi (dk)
  --   "break": 10,          -- Mola süresi (dk)
  --   "lunch_break": 60,    -- Öğle arası (dk)
  --   "session_count": 8    -- Günlük etüt sayısı
  -- }
  
  -- Step 7: Etüt Yapısı (Yüzdelik dağılım)
  study_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Örnek: {
  --   "matematik": 50,
  --   "fen": 25,
  --   "turkce": 25
  -- }
  
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can only see their own onboarding data
CREATE POLICY "Users can view own onboarding data" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding data" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding data" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
