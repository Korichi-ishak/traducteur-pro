-- Migration: fix_user_id_type
-- Description: Change user_id from UUID (with FK to profiles) to TEXT
-- This allows the app to work without authentication for now.
-- Run this in the Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ============================================
-- 1. Fix translation_history table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own translations" ON translation_history;
DROP POLICY IF EXISTS "Users can insert their own translations" ON translation_history;
DROP POLICY IF EXISTS "Users can update their own translations" ON translation_history;
DROP POLICY IF EXISTS "Users can delete their own translations" ON translation_history;

-- Drop the foreign key constraint
ALTER TABLE translation_history DROP CONSTRAINT IF EXISTS translation_history_user_id_fkey;

-- Change user_id column type from UUID to TEXT
ALTER TABLE translation_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE translation_history ALTER COLUMN user_id SET DEFAULT 'default-user';

-- Recreate permissive policies (no auth required for now)
CREATE POLICY "Users can view their own translations" ON translation_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own translations" ON translation_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own translations" ON translation_history
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own translations" ON translation_history
    FOR DELETE USING (true);

-- ============================================
-- 2. Fix revision_stats table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own stats" ON revision_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON revision_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON revision_stats;

-- Drop the foreign key constraint
ALTER TABLE revision_stats DROP CONSTRAINT IF EXISTS revision_stats_user_id_fkey;

-- Drop unique constraint (will be re-added after type change)
ALTER TABLE revision_stats DROP CONSTRAINT IF EXISTS revision_stats_user_id_key;

-- Change user_id column type from UUID to TEXT
ALTER TABLE revision_stats ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE revision_stats ALTER COLUMN user_id SET DEFAULT 'default-user';

-- Re-add unique constraint
ALTER TABLE revision_stats ADD CONSTRAINT revision_stats_user_id_key UNIQUE (user_id);

-- Recreate permissive policies
CREATE POLICY "Users can view their own stats" ON revision_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON revision_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stats" ON revision_stats
    FOR UPDATE USING (true);
