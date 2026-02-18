const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Créer le client Supabase avec la clé service (côté serveur)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérifier si les credentials sont valides (pas les defaults du .env)
const hasValidCredentials = supabaseUrl && 
                           supabaseServiceKey && 
                           supabaseUrl.startsWith('http') && 
                           !supabaseUrl.includes('your-project-url');

if (!hasValidCredentials) {
    console.warn('\n⚠️  ATTENTION: Supabase non configuré');
    console.warn('   Le serveur fonctionne en mode dégradé (sans base de données)');
    console.warn('   Pour activer Supabase:');
    console.warn('   1. Copiez .env.example vers .env');
    console.warn('   2. Ajoutez vos clés Supabase depuis https://app.supabase.com\n');
}

const supabase = hasValidCredentials 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// ═══════════════════════════════════════════════════════════
// Historique des traductions
// ═══════════════════════════════════════════════════════════

/**
 * Récupérer l'historique d'un utilisateur
 */
async function getHistory(userId) {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_lookup', { ascending: false });
    
    if (error) {
        console.error('Erreur récupération historique:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Ajouter ou mettre à jour une traduction
 */
async function addToHistory(userId, word, result) {
    if (!supabase) return null;
    
    // Vérifier si le mot existe déjà
    const { data: existing } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('word', word)
        .eq('src_lang', result.src)
        .single();
    
    if (existing) {
        // Mettre à jour
        const { data, error } = await supabase
            .from('translation_history')
            .update({
                main_translation: result.main_translation || result.translation,
                lookup_count: existing.lookup_count + 1,
                last_lookup: new Date().toISOString(),
                translations: result.translations || [],
                senses: result.senses || [],
                synonyms: result.synonyms || [],
                examples: (result.examples || []).slice(0, 8),
                phrases: (result.phrases || []).slice(0, 6)
            })
            .eq('id', existing.id)
            .select()
            .single();
        
        if (error) console.error('Erreur mise à jour historique:', error);
        return data;
    } else {
        // Insérer nouveau
        const { data, error } = await supabase
            .from('translation_history')
            .insert({
                user_id: userId,
                word: word,
                main_translation: result.main_translation || result.translation,
                translations: result.translations || [],
                senses: result.senses || [],
                synonyms: result.synonyms || [],
                examples: (result.examples || []).slice(0, 8),
                phrases: (result.phrases || []).slice(0, 6),
                src_lang: result.src,
                tgt_lang: result.tgt,
                revision_score: 0,
                next_revision: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) console.error('Erreur ajout historique:', error);
        return data;
    }
}

/**
 * Rechercher dans l'historique
 */
async function searchHistory(userId, query) {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .or(`word.ilike.%${query}%,main_translation.ilike.%${query}%`)
        .order('last_lookup', { ascending: false });
    
    if (error) {
        console.error('Erreur recherche historique:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Supprimer un mot de l'historique
 */
async function deleteFromHistory(userId, wordId) {
    if (!supabase) return false;
    
    const { error } = await supabase
        .from('translation_history')
        .delete()
        .eq('user_id', userId)
        .eq('id', wordId);
    
    if (error) {
        console.error('Erreur suppression:', error);
        return false;
    }
    
    return true;
}

/**
 * Effacer tout l'historique
 */
async function clearHistory(userId) {
    if (!supabase) return false;
    
    const { error } = await supabase
        .from('translation_history')
        .delete()
        .eq('user_id', userId);
    
    if (error) {
        console.error('Erreur effacement historique:', error);
        return false;
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════
// Révision
// ═══════════════════════════════════════════════════════════

/**
 * Récupérer les mots à réviser
 */
async function getWordsForRevision(userId, limit = 20) {
    if (!supabase) return [];
    
    const now = new Date().toISOString();
    
    // Mots qui ont besoin d'être révisés
    const { data: dueWords } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .lte('next_revision', now)
        .limit(limit);
    
    if (dueWords && dueWords.length >= limit) {
        return dueWords;
    }
    
    // Compléter avec les mots les moins révisés
    const remaining = limit - (dueWords?.length || 0);
    if (remaining > 0) {
        const { data: lessReviewed } = await supabase
            .from('translation_history')
            .select('*')
            .eq('user_id', userId)
            .gt('next_revision', now)
            .order('revision_score', { ascending: true })
            .limit(remaining);
        
        return [...(dueWords || []), ...(lessReviewed || [])];
    }
    
    return dueWords || [];
}

/**
 * Enregistrer le résultat d'une révision
 */
async function recordRevisionResult(userId, wordId, correct) {
    if (!supabase) return null;
    
    // Récupérer le mot
    const { data: word } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('id', wordId)
        .single();
    
    if (!word) return null;
    
    let newScore = word.revision_score;
    let nextRevision = new Date();
    
    if (correct) {
        newScore = Math.min(5, word.revision_score + 1);
        
        // Intervalles de révision selon le score (en jours)
        const intervals = [1, 3, 7, 14, 30];
        const days = intervals[newScore - 1] || 30;
        nextRevision.setDate(nextRevision.getDate() + days);
    } else {
        newScore = Math.max(0, word.revision_score - 1);
        
        // Réviser bientôt si erreur
        nextRevision.setHours(nextRevision.getHours() + 4);
    }
    
    const { data, error } = await supabase
        .from('translation_history')
        .update({
            revision_score: newScore,
            next_revision: nextRevision.toISOString(),
            times_correct: correct ? word.times_correct + 1 : word.times_correct,
            times_incorrect: correct ? word.times_incorrect : word.times_incorrect + 1
        })
        .eq('id', wordId)
        .select()
        .single();
    
    if (error) console.error('Erreur enregistrement révision:', error);
    return data;
}

// ═══════════════════════════════════════════════════════════
// Statistiques
// ═══════════════════════════════════════════════════════════

/**
 * Récupérer les statistiques d'un utilisateur
 */
async function getStats(userId) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('revision_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération stats:', error);
        return null;
    }
    
    // Si pas de stats, les créer
    if (!data) {
        const { data: newStats } = await supabase
            .from('revision_stats')
            .insert({ user_id: userId })
            .select()
            .single();
        
        return newStats;
    }
    
    return data;
}

/**
 * Mettre à jour les statistiques après une session
 */
async function updateSessionStats(userId, wordsReviewed, correctCount) {
    if (!supabase) return null;
    
    const stats = await getStats(userId);
    if (!stats) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = stats.last_session ? stats.last_session.split('T')[0] : null;
    
    let streakDays = stats.streak_days || 0;
    
    if (lastSessionDate === today) {
        // Même jour, pas de changement de streak
    } else if (lastSessionDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastSessionDate === yesterdayStr) {
            streakDays += 1;
        } else {
            streakDays = 1;
        }
    } else {
        streakDays = 1;
    }
    
    const { data, error } = await supabase
        .from('revision_stats')
        .update({
            total_sessions: stats.total_sessions + 1,
            total_words_reviewed: stats.total_words_reviewed + wordsReviewed,
            total_correct: stats.total_correct + correctCount,
            total_incorrect: stats.total_incorrect + (wordsReviewed - correctCount),
            streak_days: streakDays,
            last_session: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
    
    if (error) console.error('Erreur mise à jour stats:', error);
    return data;
}

/**
 * Récupérer les statistiques complètes
 */
async function getStatistics(userId) {
    if (!supabase) return null;
    
    const stats = await getStats(userId);
    const history = await getHistory(userId);
    
    const totalWords = history.length;
    const avgLookups = totalWords > 0
        ? history.reduce((sum, e) => sum + e.lookup_count, 0) / totalWords
        : 0;
    
    const masteredWords = history.filter(e => e.revision_score >= 4).length;
    const learningWords = history.filter(e => e.revision_score >= 1 && e.revision_score < 4).length;
    const newWords = history.filter(e => e.revision_score === 0).length;
    
    const successRate = stats.total_words_reviewed > 0
        ? ((stats.total_correct / stats.total_words_reviewed) * 100).toFixed(1)
        : 0;
    
    return {
        ...stats,
        totalWords,
        avgLookups: avgLookups.toFixed(1),
        masteredWords,
        learningWords,
        newWords,
        successRate
    };
}

module.exports = {
    supabase,
    getHistory,
    addToHistory,
    searchHistory,
    deleteFromHistory,
    clearHistory,
    getWordsForRevision,
    recordRevisionResult,
    getStats,
    updateSessionStats,
    getStatistics
};
