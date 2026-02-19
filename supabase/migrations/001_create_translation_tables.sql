-- Migration: create_translation_tables
-- Description: Tables pour stocker l'historique, les statistiques et les révisions

-- Table des utilisateurs (profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Table de l'historique des traductions
CREATE TABLE IF NOT EXISTS translation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    word TEXT NOT NULL,
    main_translation TEXT NOT NULL,
    translations JSONB DEFAULT '[]'::jsonb,
    senses JSONB DEFAULT '[]'::jsonb,
    synonyms JSONB DEFAULT '[]'::jsonb,
    examples JSONB DEFAULT '[]'::jsonb,
    phrases JSONB DEFAULT '[]'::jsonb,
    src_lang TEXT NOT NULL,
    tgt_lang TEXT NOT NULL,
    date_added TIMESTAMPTZ DEFAULT NOW(),
    last_lookup TIMESTAMPTZ DEFAULT NOW(),
    lookup_count INTEGER DEFAULT 1,
    revision_score INTEGER DEFAULT 0 CHECK (revision_score >= 0 AND revision_score <= 5),
    next_revision TIMESTAMPTZ DEFAULT NOW(),
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;

-- Policies for translation_history (permissive for now, restrict when auth is added)
CREATE POLICY "Users can view their own translations" ON translation_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own translations" ON translation_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own translations" ON translation_history
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own translations" ON translation_history
    FOR DELETE USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON translation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_history_word ON translation_history(word);
CREATE INDEX IF NOT EXISTS idx_translation_history_next_revision ON translation_history(next_revision);
CREATE INDEX IF NOT EXISTS idx_translation_history_lookup ON translation_history(user_id, last_lookup DESC);

-- Table des statistiques de révision
CREATE TABLE IF NOT EXISTS revision_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE DEFAULT 'default-user',
    total_sessions INTEGER DEFAULT 0,
    total_words_reviewed INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_session TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE revision_stats ENABLE ROW LEVEL SECURITY;

-- Policies for revision_stats (permissive for now, restrict when auth is added)
CREATE POLICY "Users can view their own stats" ON revision_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON revision_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stats" ON revision_stats
    FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_history_updated_at BEFORE UPDATE ON translation_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_stats_updated_at BEFORE UPDATE ON revision_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.revision_stats (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
