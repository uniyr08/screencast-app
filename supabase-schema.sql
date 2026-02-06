-- ============================================
-- ScreenCast App — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- 1. Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Recording',
  description TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  file_size BIGINT NOT NULL DEFAULT 0,
  share_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  views INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'issue', 'win', 'action_item')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_videos_share_id ON videos(share_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);

-- 4. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (but allow public access for MVP)
-- For the MVP we allow public access. Add auth policies later.
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read videos (for shared links)
CREATE POLICY "Anyone can view videos" ON videos
  FOR SELECT USING (true);

-- Allow anyone to insert videos (no auth for MVP)
CREATE POLICY "Anyone can insert videos" ON videos
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update videos (for view count)
CREATE POLICY "Anyone can update videos" ON videos
  FOR UPDATE USING (true);

-- Allow anyone to delete videos
CREATE POLICY "Anyone can delete videos" ON videos
  FOR DELETE USING (true);

-- Allow anyone to read comments
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

-- Allow anyone to add comments
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Done! Now go to Storage and create a bucket:
-- 1. Go to Storage in Supabase dashboard
-- 2. Click "New Bucket"
-- 3. Name: "recordings"
-- 4. Toggle "Public bucket" → ON
-- 5. Click "Create bucket"
-- ============================================
