-- Add description column to topics table
-- Run this in Supabase SQL Editor

ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS description TEXT;
