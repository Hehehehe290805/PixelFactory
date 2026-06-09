-- Run this in your Supabase SQL editor (supabase.com → your project → SQL Editor)

-- Users extended profile (Supabase Auth handles auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  gold INTEGER DEFAULT 0,
  delete_requested_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: pixels and blocks owned outside of levels
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  quantity INTEGER DEFAULT 0
);

-- Block Templates
CREATE TABLE IF NOT EXISTS block_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pixel_layout JSONB NOT NULL,
  set_type TEXT,
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

-- Row Level Security
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

-- ── Auto-create profile on sign-up ──────────────────────────────────────────
-- This trigger runs with SECURITY DEFINER so it bypasses RLS even when email
-- confirmation is pending (no session yet). The username comes from the metadata
-- passed in supabase.auth.signUp({ options: { data: { username } } }).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, gold)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    0
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Auto-delete accounts marked for deletion > 30 days ago ──────────────────
-- Run this as a Supabase cron job (pg_cron extension) or call it from a
-- scheduled Edge Function. It hard-deletes auth.users (cascades to profiles).
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-pending-accounts', '0 3 * * *', $$
--   DELETE FROM auth.users
--   WHERE id IN (
--     SELECT id FROM public.profiles
--     WHERE delete_requested_at IS NOT NULL
--       AND delete_requested_at < NOW() - INTERVAL '30 days'
--   );
-- $$);
