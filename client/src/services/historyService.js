// Service de gestion de l'historique et des statistiques
// Utilise l'API serveur avec Supabase pour la persistance des données

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

// Générer ou récupérer un userId temporaire
// À remplacer par l'authentification Supabase plus tard
const getUserId = () => {
  let userId = localStorage.getItem('temp_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('temp_user_id', userId);
  }
  return userId;
};

// Configuration axios avec l'userId
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId()
  }
});

// ═══════════════════════════════════════════════════════════
// Historique des traductions
// ═══════════════════════════════════════════════════════════

export const loadHistory = async () => {
  try {
    const response = await api.get('/history');
    return response.data;
  } catch (error) {
    console.error('Erreur chargement historique:', error);
    return [];
  }
};

export const addToHistory = async (word, result) => {
  try {
    const response = await api.post('/history', { word, result });
    return response.data;
  } catch (error) {
    console.error('Erreur ajout historique:', error);
    return null;
  }
};

export const searchHistory = async (query) => {
  try {
    if (!query || !query.trim()) {
      return await loadHistory();
    }
    const response = await api.get(`/history/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Erreur recherche historique:', error);
    return [];
  }
};

export const deleteFromHistory = async (wordId) => {
  try {
    await api.delete(`/history/${wordId}`);
    return true;
  } catch (error) {
    console.error('Erreur suppression:', error);
    return false;
  }
};

export const clearHistory = async () => {
  try {
    await api.delete('/history');
    return true;
  } catch (error) {
    console.error('Erreur effacement historique:', error);
    return false;
  }
};

export const exportHistory = async () => {
  try {
    const history = await loadHistory();
    const text = history.map(entry => 
      `${entry.word}\t${entry.main_translation}\t${entry.src_lang}→${entry.tgt_lang}\t×${entry.lookup_count}`
    ).join('\n');
    
    return {
      text: text,
      json: JSON.stringify(history, null, 2)
    };
  } catch (error) {
    console.error('Erreur export:', error);
    return { text: '', json: '[]' };
  }
};

// ═══════════════════════════════════════════════════════════
// Mode révision (flashcards)
// ═══════════════════════════════════════════════════════════

export const getWordsForRevision = async (limit = 20) => {
  try {
    const response = await api.get(`/history/revision/words?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Erreur récupération mots révision:', error);
    return [];
  }
};

export const recordRevisionResult = async (wordId, correct) => {
  try {
    const response = await api.post('/history/revision', { wordId, correct });
    return response.data;
  } catch (error) {
    console.error('Erreur enregistrement révision:', error);
    return null;
  }
};

export const updateSessionStats = async (wordsReviewed, correctCount) => {
  try {
    const response = await api.post('/history/revision/session', { 
      wordsReviewed, 
      correctCount 
    });
    return response.data;
  } catch (error) {
    console.error('Erreur mise à jour stats session:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════
// Statistiques de progression
// ═══════════════════════════════════════════════════════════

export const getStatistics = async () => {
  try {
    const response = await api.get('/history/statistics');
    return response.data;
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    return {
      total_sessions: 0,
      total_words_reviewed: 0,
      total_correct: 0,
      total_incorrect: 0,
      streak_days: 0,
      last_session: null,
      totalWords: 0,
      avgLookups: '0',
      masteredWords: 0,
      learningWords: 0,
      newWords: 0,
      successRate: 0
    };
  }
};

// Fonctions de compatibilité (non utilisées mais gardées pour compatibilité)
export const saveHistory = () => {
  console.warn('saveHistory() est obsolète - utilise addToHistory() à la place');
};

export const loadStats = () => {
  console.warn('loadStats() est obsolète - utilise getStatistics() à la place');
  return getStatistics();
};

export const saveStats = () => {
  console.warn('saveStats() est obsolète - les stats sont automatiquement sauvegardées');
};
