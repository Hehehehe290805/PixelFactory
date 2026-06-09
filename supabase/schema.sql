-- Run this in your Supabase SQL editor (supabase.com → your project → SQL Editor)

-- Users extended profile (Supabase Auth handles auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  gold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: pixels and blocks owned outside of levels
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'pixel', 'block', 'grid_style', 'special_unlock'
  item_key TEXT NOT NULL,  -- e.g. 'pixel_red', 'block_doubler', 'style_overclock'
  quantity INTEGER DEFAULT 0
);

-- Block Templates
CREATE TABLE IF NOT EXISTS block_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pixel_layout JSONB NOT NULL, -- 16x16 array of color values
  set_type TEXT,               -- e.g. 'MIDNIGHT', null if no set
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Progress
CREATE TABLE IF NOT EXISTS campaign_progress (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  level_number INTEGER,
  stars INTEGER DEFAULT 0,
  best_time_seconds INTEGER,
  PRIMARY KEY (user_id, level_number)
);

-- Endless Highscores (leaderboard)
CREATE TABLE IF NOT EXISTS endless_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  highest_wave INTEGER NOT NULL,
  total_pixels_produced BIGINT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Row Level Security: users can only read/write their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE endless_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own inventory" ON inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own templates" ON block_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own campaign progress" ON campaign_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own endless scores" ON endless_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view endless scores" ON endless_scores FOR SELECT USING (true);
