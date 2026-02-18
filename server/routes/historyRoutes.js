const express = require('express');
const router = express.Router();
const {
    getHistory,
    addToHistory,
    searchHistory,
    deleteFromHistory,
    clearHistory,
    getWordsForRevision,
    recordRevisionResult,
    getStatistics,
    updateSessionStats
} = require('../services/supabaseService');

// Middleware simple pour extraire l'userId (à remplacer par une vraie auth)
// Pour l'instant, on utilise un header X-User-Id
const getUserId = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
        return res.status(401).json({ 
            error: 'User ID manquant. Utilisez le header X-User-Id.' 
        });
    }
    
    req.userId = userId;
    next();
};

router.use(getUserId);

// ═══════════════════════════════════════════════════════════
// HISTORIQUE
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/history - Récupérer l'historique complet
 */
router.get('/', async (req, res) => {
    try {
        const history = await getHistory(req.userId);
        res.json(history);
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/history - Ajouter/Mettre à jour une traduction
 * Body: { word, result }
 */
router.post('/', async (req, res) => {
    try {
        const { word, result } = req.body;
        
        if (!word || !result) {
            return res.status(400).json({ 
                error: 'Paramètres manquants: word et result requis' 
            });
        }
        
        const entry = await addToHistory(req.userId, word, result);
        res.json(entry);
    } catch (error) {
        console.error('Erreur ajout historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/history/search - Rechercher dans l'historique
 * Query: ?q=mot
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Paramètre q manquant' });
        }
        
        const results = await searchHistory(req.userId, q);
        res.json(results);
    } catch (error) {
        console.error('Erreur recherche historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/history/:id - Supprimer une entrée
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await deleteFromHistory(req.userId, id);
        
        if (success) {
            res.json({ message: 'Supprimé avec succès' });
        } else {
            res.status(404).json({ error: 'Entrée non trouvée' });
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/history - Effacer tout l'historique
 */
router.delete('/', async (req, res) => {
    try {
        const success = await clearHistory(req.userId);
        
        if (success) {
            res.json({ message: 'Historique effacé' });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'effacement' });
        }
    } catch (error) {
        console.error('Erreur effacement historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════
// RÉVISION
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/history/revision/words - Récupérer les mots à réviser
 * Query: ?limit=20
 */
router.get('/revision/words', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const words = await getWordsForRevision(req.userId, limit);
        res.json(words);
    } catch (error) {
        console.error('Erreur récupération mots révision:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/history/revision - Enregistrer le résultat d'une révision
 * Body: { wordId, correct }
 */
router.post('/revision', async (req, res) => {
    try {
        const { wordId, correct } = req.body;
        
        if (!wordId || typeof correct !== 'boolean') {
            return res.status(400).json({ 
                error: 'Paramètres manquants: wordId (string) et correct (boolean) requis' 
            });
        }
        
        const result = await recordRevisionResult(req.userId, wordId, correct);
        
        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: 'Mot non trouvé' });
        }
    } catch (error) {
        console.error('Erreur enregistrement révision:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/history/revision/session - Mettre à jour les stats de session
 * Body: { wordsReviewed, correctCount }
 */
router.post('/revision/session', async (req, res) => {
    try {
        const { wordsReviewed, correctCount } = req.body;
        
        if (typeof wordsReviewed !== 'number' || typeof correctCount !== 'number') {
            return res.status(400).json({ 
                error: 'Paramètres invalides: wordsReviewed et correctCount doivent être des nombres' 
            });
        }
        
        const stats = await updateSessionStats(req.userId, wordsReviewed, correctCount);
        res.json(stats);
    } catch (error) {
        console.error('Erreur mise à jour stats session:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════
// STATISTIQUES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/history/statistics - Récupérer les statistiques complètes
 */
router.get('/statistics', async (req, res) => {
    try {
        const statistics = await getStatistics(req.userId);
        res.json(statistics);
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
