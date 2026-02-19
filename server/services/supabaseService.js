const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let useMemory = false;

// In-memory fallback storage
const memoryStore = {
  history: [],
  stats: {
    total_sessions: 0,
    total_words_reviewed: 0,
    total_correct: 0,
    total_incorrect: 0,
    streak_days: 0,
    last_session: null
  }
};

if (supabaseUrl && supabaseKey && supabaseUrl !== 'your-project-url.supabase.co') {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected');
} else {
  console.log('⚠️  Supabase not configured - using in-memory storage');
  useMemory = true;
}

// Test Supabase schema on startup
async function testSupabaseSchema() {
  if (!supabase || useMemory) return;
  try {
    // Test with a user_id filter to check for UUID type mismatch
    const { data, error } = await supabase
      .from('translation_history')
      .select('id')
      .eq('user_id', 'test-user')
      .limit(1);
    if (error) {
      console.warn('⚠️  Supabase schema error:', error.message);
      console.warn('   → Switching to in-memory storage');
      console.warn('   → To fix: run this SQL in your Supabase SQL Editor:');
      console.warn('     ALTER TABLE translation_history DROP CONSTRAINT IF EXISTS translation_history_user_id_fkey;');
      console.warn('     ALTER TABLE translation_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;');
      console.warn('     ALTER TABLE translation_history ALTER COLUMN user_id SET DEFAULT \'default-user\';');
      console.warn('     ALTER TABLE revision_stats DROP CONSTRAINT IF EXISTS revision_stats_user_id_fkey;');
      console.warn('     ALTER TABLE revision_stats ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;');
      console.warn('     NOTIFY pgrst, \'reload schema\';');
      useMemory = true;
    } else {
      console.log('✅ Supabase schema OK');
    }
  } catch (e) {
    console.warn('⚠️  Supabase test failed:', e.message);
    useMemory = true;
  }
}
testSupabaseSchema();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate next revision date based on score
function calculateNextRevision(score) {
  const daysMap = [1, 2, 4, 7, 14, 30]; // Spaced repetition intervals
  const days = daysMap[Math.min(score, 5)];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

// ============================================
// HISTORY FUNCTIONS
// ============================================

async function getHistory(userId) {
  if (!supabase || useMemory) {
    return memoryStore.history.filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.last_lookup) - new Date(a.last_lookup));
  }
  
  try {
    const { data, error } = await supabase
      .from('translation_history')
      .select('*')
      .order('last_lookup', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('getHistory error:', error);
    return memoryStore.history;
  }
}

async function addToHistory(userId, word, result) {
  if (!supabase || useMemory) {
    // In-memory storage
    const existing = memoryStore.history.find(
      h => h.user_id === userId && h.word === word && h.src_lang === result.src
    );
    if (existing) {
      existing.lookup_count += 1;
      existing.last_lookup = new Date().toISOString();
      existing.main_translation = result.main_translation;
      existing.translations = result.all_translations || [];
      existing.senses = result.senses || [];
      existing.phrases = result.phrases || [];
      existing.examples = result.examples || [];
    } else {
      memoryStore.history.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
        user_id: userId,
        word,
        main_translation: result.main_translation,
        translations: result.all_translations || [],
        senses: result.senses || [],
        synonyms: [],
        examples: result.examples || [],
        phrases: result.phrases || [],
        src_lang: result.src,
        tgt_lang: result.tgt,
        date_added: new Date().toISOString(),
        last_lookup: new Date().toISOString(),
        lookup_count: 1,
        revision_score: 0,
        next_revision: new Date().toISOString(),
        times_correct: 0,
        times_incorrect: 0
      });
    }
    return;
  }
  
  try {
    // Check if word already exists
    const { data: existing } = await supabase
      .from('translation_history')
      .select('*')
      .eq('word', word)
      .eq('src_lang', result.src)
      .single();
    
    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('translation_history')
        .update({
          lookup_count: existing.lookup_count + 1,
          last_lookup: new Date().toISOString(),
          main_translation: result.main_translation,
          translations: result.all_translations || [],
          senses: result.senses || [],
          phrases: result.phrases || [],
          examples: result.examples || []
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('translation_history')
        .insert({
          word,
          main_translation: result.main_translation,
          translations: result.all_translations || [],
          senses: result.senses || [],
          synonyms: [],
          examples: result.examples || [],
          phrases: result.phrases || [],
          src_lang: result.src,
          tgt_lang: result.tgt,
          date_added: new Date().toISOString(),
          last_lookup: new Date().toISOString(),
          lookup_count: 1,
          revision_score: 0,
          next_revision: new Date().toISOString(),
          times_correct: 0,
          times_incorrect: 0
        });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('addToHistory error:', error);
  }
}

async function deleteFromHistory(userId, id) {
  if (!supabase || useMemory) {
    memoryStore.history = memoryStore.history.filter(h => h.id !== id);
    return;
  }
  
  try {
    const { error } = await supabase
      .from('translation_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('deleteFromHistory error:', error);
    throw error;
  }
}

async function searchHistory(userId, query) {
  if (!supabase || useMemory) {
    const q = query.toLowerCase();
    return memoryStore.history.filter(h =>
      h.word.toLowerCase().includes(q) ||
      h.main_translation.toLowerCase().includes(q)
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('translation_history')
      .select('*')
      .or(`word.ilike.%${query}%,main_translation.ilike.%${query}%`)
      .order('last_lookup', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('searchHistory error:', error);
    return [];
  }
}

// ============================================
// REVISION FUNCTIONS
// ============================================

async function getWordsForRevision(userId) {
  if (!supabase || useMemory) {
    const now = new Date();
    const due = memoryStore.history
      .filter(h => new Date(h.next_revision) <= now)
      .sort((a, b) => new Date(a.next_revision) - new Date(b.next_revision))
      .slice(0, 15);
    if (due.length > 0) return due;
    return [...memoryStore.history]
      .sort((a, b) => a.revision_score - b.revision_score)
      .slice(0, 10);
  }
  
  try {
    const now = new Date().toISOString();
    
    // Get words due for revision
    const { data: dueWords, error: error1 } = await supabase
      .from('translation_history')
      .select('*')
      .lte('next_revision', now)
      .order('next_revision', { ascending: true })
      .limit(15);
    
    if (error1) throw error1;
    
    if (dueWords && dueWords.length > 0) {
      return dueWords;
    }
    
    // If no words due, get words with lowest scores
    const { data: lowScoreWords, error: error2 } = await supabase
      .from('translation_history')
      .select('*')
      .order('revision_score', { ascending: true })
      .order('last_lookup', { ascending: false })
      .limit(10);
    
    if (error2) throw error2;
    return lowScoreWords || [];
  } catch (error) {
    console.error('getWordsForRevision error:', error);
    return [];
  }
}

async function recordRevisionResult(userId, wordId, correct) {
  if (!supabase || useMemory) {
    const word = memoryStore.history.find(h => h.id === wordId);
    if (!word) throw new Error('Word not found');
    word.revision_score = correct
      ? Math.min(5, word.revision_score + 1)
      : Math.max(0, word.revision_score - 1);
    word.next_revision = correct
      ? calculateNextRevision(word.revision_score)
      : new Date().toISOString();
    word.times_correct += correct ? 1 : 0;
    word.times_incorrect += correct ? 0 : 1;
    // Update memory stats
    memoryStore.stats.total_words_reviewed += 1;
    memoryStore.stats.total_correct += correct ? 1 : 0;
    memoryStore.stats.total_incorrect += correct ? 0 : 1;
    memoryStore.stats.last_session = new Date().toISOString();
    return;
  }
  
  try {
    // Get current word data
    const { data: word, error: fetchError } = await supabase
      .from('translation_history')
      .select('*')
      .eq('id', wordId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!word) throw new Error('Word not found');
    
    // Calculate new score and next revision
    const newScore = correct 
      ? Math.min(5, word.revision_score + 1)
      : Math.max(0, word.revision_score - 1);
    
    const nextRevision = correct 
      ? calculateNextRevision(newScore)
      : new Date().toISOString();
    
    // Update word
    const { error: updateError } = await supabase
      .from('translation_history')
      .update({
        revision_score: newScore,
        next_revision: nextRevision,
        times_correct: word.times_correct + (correct ? 1 : 0),
        times_incorrect: word.times_incorrect + (correct ? 0 : 1)
      })
      .eq('id', wordId);
    
    if (updateError) throw updateError;
    
    // Update session stats
    await updateSessionStats(userId, correct);
  } catch (error) {
    console.error('recordRevisionResult error:', error);
    throw error;
  }
}

async function updateSessionStats(userId, correct) {
  if (!supabase || useMemory) return; // Already handled in memory
  
  try {
    // Get current stats
    const { data: allStats, error: fetchError } = await supabase
      .from('revision_stats')
      .select('*');
    
    const stats = allStats?.[0];
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    if (!stats) {
      const { error: insertError } = await supabase
        .from('revision_stats')
        .insert({
          total_sessions: 1,
          total_words_reviewed: 1,
          total_correct: correct ? 1 : 0,
          total_incorrect: correct ? 0 : 1,
          streak_days: 0,
          last_session: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
    } else {
      const lastSession = stats.last_session ? new Date(stats.last_session) : null;
      const now = new Date();
      const isNewSession = !lastSession || 
        (now.getTime() - lastSession.getTime()) > 30 * 60 * 1000;
      
      const { error: updateError } = await supabase
        .from('revision_stats')
        .update({
          total_sessions: stats.total_sessions + (isNewSession ? 1 : 0),
          total_words_reviewed: stats.total_words_reviewed + 1,
          total_correct: stats.total_correct + (correct ? 1 : 0),
          total_incorrect: stats.total_incorrect + (correct ? 0 : 1),
          last_session: now.toISOString()
        })
        .eq('id', stats.id);
      
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('updateSessionStats error:', error);
  }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

async function getStatistics(userId) {
  const emptyStats = {
    total_sessions: 0,
    total_words_reviewed: 0,
    total_correct: 0,
    total_incorrect: 0,
    streak_days: 0,
    last_session: null,
    total_words: 0,
    level_distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  if (!supabase || useMemory) {
    const levelDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    memoryStore.history.forEach(h => {
      const s = h.revision_score || 0;
      levelDistribution[s] = (levelDistribution[s] || 0) + 1;
    });
    return {
      ...memoryStore.stats,
      total_words: memoryStore.history.length,
      level_distribution: levelDistribution
    };
  }
  
  try {
    // Get revision stats
    const { data: allStats } = await supabase
      .from('revision_stats')
      .select('*');
    const revisionStats = allStats?.[0];
    
    // Get total words count
    const { count } = await supabase
      .from('translation_history')
      .select('*', { count: 'exact', head: true });
    
    // Get level distribution
    const { data: history } = await supabase
      .from('translation_history')
      .select('revision_score');
    
    const levelDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (history) {
      history.forEach(item => {
        const score = item.revision_score || 0;
        levelDistribution[score] = (levelDistribution[score] || 0) + 1;
      });
    }
    
    return {
      total_sessions: revisionStats?.total_sessions || 0,
      total_words_reviewed: revisionStats?.total_words_reviewed || 0,
      total_correct: revisionStats?.total_correct || 0,
      total_incorrect: revisionStats?.total_incorrect || 0,
      streak_days: revisionStats?.streak_days || 0,
      last_session: revisionStats?.last_session || null,
      total_words: count || 0,
      level_distribution: levelDistribution
    };
  } catch (error) {
    console.error('getStatistics error:', error);
    return emptyStats;
  }
}

module.exports = {
  getHistory,
  addToHistory,
  deleteFromHistory,
  searchHistory,
  getWordsForRevision,
  recordRevisionResult,
  getStatistics
};
