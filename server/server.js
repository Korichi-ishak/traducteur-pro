const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Routes
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS - Autoriser les requêtes depuis le frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL // URL Vercel en production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Configuration
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
};

const LANG_MAP = {
    'de': { name: 'Allemand', flag: '🇩🇪', pons: 'german', glosbe: 'de' },
    'fr': { name: 'Français', flag: '🇫🇷', pons: 'french', glosbe: 'fr' },
};

// Cache pour optimiser les requêtes
const translateCache = new Map();

// ─────────────────────────────────────────────────────────
// Services de traduction
// ─────────────────────────────────────────────────────────

/**
 * Google Translate via API gratuite
 */
async function googleTranslate(text, src, tgt) {
    const cacheKey = `google:${text}:${src}:${tgt}`;
    if (translateCache.has(cacheKey)) {
        return translateCache.get(cacheKey);
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 8000 });
        
        if (response.data && response.data[0]) {
            const translation = response.data[0].map(item => item[0]).join('');
            translateCache.set(cacheKey, translation);
            return translation;
        }
        return null;
    } catch (error) {
        console.error('Erreur Google Translate:', error.message);
        return null;
    }
}

/**
 * PONS Dictionary - Définitions et expressions
 */
async function ponsLookup(word, src, tgt) {
    try {
        const srcPons = LANG_MAP[src].pons;
        const tgtPons = LANG_MAP[tgt].pons;
        const url = `https://en.pons.com/translate/${srcPons}-${tgtPons}/${encodeURIComponent(word)}`;
        
        const response = await axios.get(url, { 
            headers: HEADERS, 
            timeout: 10000 
        });
        
        const $ = cheerio.load(response.data);
        const result = { senses: [], phrases: [] };
        
        $('dl').slice(0, 15).each((i, dl) => {
            const dt = $(dl).find('dt');
            const dd = $(dl).find('dd');
            
            if (!dt.length || !dd.length) return;
            
            const dtText = dt.text().trim();
            let ddText = dd.text().trim();
            ddText = ddText.replace(/French\s*(\(Canada\))?\s*/g, '').trim();
            
            const senseEl = dt.find('.sense');
            if (senseEl.length) {
                let meaning = senseEl.text().trim();
                meaning = meaning.replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2');
                result.senses.push({
                    meaning: meaning,
                    translation: ddText
                });
            } else if (dtText.length > 3) {
                result.phrases.push({
                    phrase: dtText,
                    translation: ddText
                });
            }
        });
        
        return result;
    } catch (error) {
        console.error('Erreur PONS:', error.message);
        return { senses: [], phrases: [] };
    }
}

/**
 * Glosbe - Exemples contextuels
 */
async function glosbeLookup(word, src, tgt) {
    try {
        const url = `https://glosbe.com/${src}/${tgt}/${encodeURIComponent(word)}`;
        
        const response = await axios.get(url, { 
            headers: HEADERS, 
            timeout: 10000 
        });
        
        const $ = cheerio.load(response.data);
        const result = { translations: [], examples: [] };
        
        // Traductions
        $('h3').slice(0, 8).each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length < 50) {
                result.translations.push(text);
            }
        });
        
        // Exemples
        $('.translation__example').slice(0, 6).each((i, elem) => {
            const ps = $(elem).find('p');
            if (ps.length >= 2) {
                const srcText = $(ps[0]).text().trim();
                const tgtText = $(ps[1]).text().trim();
                if (srcText && tgtText) {
                    result.examples.push({
                        original: srcText,
                        translation: tgtText
                    });
                }
            }
        });
        
        return result;
    } catch (error) {
        console.error('Erreur Glosbe:', error.message);
        return { translations: [], examples: [] };
    }
}

// ─────────────────────────────────────────────────────────
// Routes API
// ─────────────────────────────────────────────────────────

/**
 * GET / - Test du serveur
 */
app.get('/', (req, res) => {
    res.json({ 
        message: '🌍 Traducteur Pro API',
        version: '1.0.0',
        endpoints: ['/api/translate', '/api/quick-translate']
    });
});

/**
 * POST /api/translate - Traduction complète
 */
app.post('/api/translate', async (req, res) => {
    try {
        const { text, src = 'de', tgt = 'fr', mode = 'word' } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Texte vide' });
        }
        
        const trimmedText = text.trim();
        const wordCount = trimmedText.split(/\s+/).length;
        
        // Si plus de 3 mots ou mode phrase, traiter comme phrase
        if (mode === 'sentence' || wordCount > 3) {
            const result = await translateSentence(trimmedText, src, tgt);
            return res.json(result);
        } else {
            const result = await translateWord(trimmedText, src, tgt);
            return res.json(result);
        }
        
    } catch (error) {
        console.error('Erreur traduction:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/quick-translate - Traduction rapide (Google uniquement)
 */
app.post('/api/quick-translate', async (req, res) => {
    try {
        const { text, src = 'de', tgt = 'fr' } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Texte vide' });
        }
        
        const translation = await googleTranslate(text.trim(), src, tgt);
        
        res.json({
            text: text.trim(),
            translation: translation,
            src: src,
            tgt: tgt
        });
        
    } catch (error) {
        console.error('Erreur traduction rapide:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// Fonctions de traduction
// ─────────────────────────────────────────────────────────

/**
 * Traduction complète d'un mot
 */
async function translateWord(word, src, tgt) {
    console.log(`📖 Traduction mot: "${word}" (${src} → ${tgt})`);
    
    // Appels parallèles pour optimiser
    const [mainTranslation, ponsData, glosbeData] = await Promise.all([
        googleTranslate(word, src, tgt),
        ponsLookup(word, src, tgt),
        glosbeLookup(word, src, tgt)
    ]);
    
    // Fusionner les traductions
    const allTranslations = [];
    const seen = new Set();
    
    const sources = [
        ...(mainTranslation ? [mainTranslation] : []),
        ...glosbeData.translations
    ];
    
    for (const t of sources) {
        if (t && !seen.has(t.toLowerCase())) {
            seen.add(t.toLowerCase());
            allTranslations.push(t);
        }
    }
    
    // Synonymes via traduction inverse
    const synonyms = [];
    for (const t of allTranslations.slice(0, 3)) {
        try {
            const reverse = await googleTranslate(t, tgt, src);
            if (reverse && reverse.toLowerCase() !== word.toLowerCase()) {
                if (!synonyms.some(s => s.toLowerCase() === reverse.toLowerCase())) {
                    synonyms.push(reverse);
                }
            }
        } catch (error) {
            // Ignorer les erreurs de traduction inverse
        }
    }
    
    return {
        word: word,
        main_translation: mainTranslation || (allTranslations[0] || '?'),
        translations: allTranslations.slice(0, 10),
        senses: ponsData.senses.slice(0, 8),
        phrases: ponsData.phrases.slice(0, 6),
        examples: glosbeData.examples.slice(0, 6),
        synonyms: synonyms.slice(0, 5),
        src: src,
        tgt: tgt
    };
}

/**
 * Traduction d'une phrase
 */
async function translateSentence(sentence, src, tgt) {
    console.log(`💬 Traduction phrase: "${sentence}" (${src} → ${tgt})`);
    
    const translation = await googleTranslate(sentence, src, tgt);
    
    // Vocabulaire mot à mot
    const words = sentence.match(/\b\w+\b/g) || [];
    const wordByWord = {};
    
    // Traduire les mots en parallèle (limité aux mots > 2 caractères)
    const longWords = words.filter(w => w.length > 2);
    const translations = await Promise.all(
        longWords.map(w => googleTranslate(w, src, tgt))
    );
    
    longWords.forEach((word, i) => {
        if (translations[i]) {
            wordByWord[word] = translations[i];
        }
    });
    
    return {
        original: sentence,
        translation: translation,
        word_by_word: wordByWord,
        src: src,
        tgt: tgt
    };
}

// ─────────────────────────────────────────────────────────
// Routes API
// ─────────────────────────────────────────────────────────

// Routes pour l'historique, révision et statistiques
app.use('/api/history', historyRoutes);

// ─────────────────────────────────────────────────────────
// Démarrage du serveur
// ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('  🌍  TRADUCTEUR PRO - Serveur Node.js');
    console.log('  Allemand ⇄ Français');
    console.log('='.repeat(60));
    console.log(`\n  ✓ Serveur démarré sur le port ${PORT}`);
    console.log(`  ✓ API disponible sur: http://localhost:${PORT}`);
    console.log('\n' + '='.repeat(60) + '\n');
});
