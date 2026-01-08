-- Add category column to topics table for TYT/AYT distinction
-- Run this in Supabase SQL Editor

ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TYT'; -- 'TYT', 'AYT', 'YDT' etc.
