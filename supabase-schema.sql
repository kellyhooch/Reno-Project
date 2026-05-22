-- ====================================================================
--  SUPABASE DATABASE SCHEMA FOR SINGAPORE HOME RENOVATION PLANNER
-- ====================================================================
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com)
-- to automatically provision standard table schemas for your app.
-- This enables global persistent saving and multi-user chat sync.

-- 1. Create the Discussion Board 'comments' table
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT '🏡 Homeowner',
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    timestamp TEXT,
    replies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Real-time listener for the comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
alter publication supabase_realtime add table public.comments;

-- 2. Create the Saved Floor Plan Projects 'entries' table
CREATE TABLE IF NOT EXISTS public.entries (
    id TEXT PRIMARY KEY,
    propertyType TEXT,
    property_type TEXT,
    budget NUMERIC,
    optionSelected TEXT,
    option_selected TEXT,
    optionData JSONB,
    option_data JSONB,
    presetId TEXT,
    preset_id TEXT,
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Real-time listener for the entries table
ALTER TABLE public.entries REPLICA IDENTITY FULL;
alter publication supabase_realtime add table public.entries;

-- 3. Setup Row Level Security (RLS) policies for anonymous guest access
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select / read
CREATE POLICY "Allow public read access to comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to entries" ON public.entries FOR SELECT USING (true);

-- Allow anyone to insert/upsert
CREATE POLICY "Allow public write access to comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public write access to entries" ON public.entries FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 4. CRITICAL: Grant table permissions to standard Supabase API roles
-- ====================================================================
-- In many Supabase setups, you must explicitly grant table permissions to the API role
-- to resolve PostgreSQL Error 42501 (permission denied for table). Paste and run:

GRANT ALL ON public.comments TO anon;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

GRANT ALL ON public.entries TO anon;
GRANT ALL ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;

