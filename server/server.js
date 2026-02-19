require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const supabaseService = require('./services/supabaseService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// User ID Middleware (simple for now)
app.use((req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'default-user';
  next();
});

// ===========================================
// TRANSLATION SERVICES
// ===========================================

// Google Translate API (using http request)
async function googleTranslate(text, src, tgt) {
  try {
    const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: src,
        tl: tgt,
        dt: 't',
        q: text
      }
    });
    
    if (response.data && response.data[0]) {
      return response.data[0].map(item => item[0]).join('');
    }
    return null;
  } catch (error) {
    console.error('Google Translate error:', error.message);
    return null;
  }
}

// PONS Dictionary Scraper
async function fetchPONS(word, src, tgt) {
  const langMap = {
    'de': 'german',
    'fr': 'french'
  };
  
  const srcLang = langMap[src];
  const tgtLang = langMap[tgt];
  
  if (!srcLang || !tgtLang) return { senses: [], phrases: [] };
  
  const url = `https://en.pons.com/translate/${srcLang}-${tgtLang}/${encodeURIComponent(word)}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const senses = [];
    const phrases = [];
    
    // Extract senses
    $('dl').each((i, dl) => {
      const dt = $(dl).find('dt').first();
      const dd = $(dl).find('dd').first();
      
      if (dt.length && dd.length) {
        const meaning = dt.text().trim();
        const translation = dd.text().replace(/French\s*(\(Canada\))?\s*/g, '').trim();
        
        if (meaning && translation) {
          if (meaning.includes('•') || meaning.includes('|')) {
            // It's a phrase/expression
            phrases.push({
              phrase: meaning,
              translation
            });
          } else {
            // It's a sense
            senses.push({
              meaning,
              translation
            });
          }
        }
      }
    });
    
    return { senses: senses.slice(0, 10), phrases: phrases.slice(0, 10) };
  } catch (error) {
    console.error('PONS error:', error.message);
    return { senses: [], phrases: [] };
  }
}

// Glosbe API (examples)
async function fetchGlosbe(word, src, tgt) {
  const url = `https://glosbe.com/${src}/${tgt}/${encodeURIComponent(word)}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const examples = [];
    
    // Extract examples
    $('div[class*="example"]').each((i, elem) => {
      if (i >= 10) return;
      
      const original = $(elem).find(`[lang="${src}"]`).text().trim();
      const translation = $(elem).find(`[lang="${tgt}"]`).text().trim();
      
      if (original && translation) {
        examples.push({ original, translation });
      }
    });
    
    return { examples };
  } catch (error) {
    console.error('Glosbe error:', error.message);
    return { examples: [] };
  }
}

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Translate endpoint
app.post('/api/translate', async (req, res) => {
  const { text, src, tgt, mode } = req.body;
  
  if (!text || !src || !tgt) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    if (mode === 'phrase') {
      // Phrase translation
      const translation = await googleTranslate(text, src, tgt);
      
      if (!translation) {
        return res.status(500).json({ error: 'Translation failed' });
      }
      
      // Split into words and translate each
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordByWord = {};
      
      for (const word of words) {
        const trans = await googleTranslate(word.replace(/[.,!?;:]/, ''), src, tgt);
        if (trans) {
          wordByWord[word] = trans;
        }
      }
      
      return res.json({
        original: text,
        translation,
        word_by_word: wordByWord,
        src,
        tgt
      });
    } else {
      // Word translation (detailed)
      const [mainTrans, ponsData, glosbeData] = await Promise.all([
        googleTranslate(text, src, tgt),
        fetchPONS(text, src, tgt),
        fetchGlosbe(text, src, tgt)
      ]);
      
      if (!mainTrans) {
        return res.status(500).json({ error: 'Translation failed' });
      }
      
      const result = {
        word: text,
        main_translation: mainTrans,
        all_translations: [],
        senses: ponsData.senses,
        phrases: ponsData.phrases,
        examples: glosbeData.examples,
        src,
        tgt
      };
      
      // Add to history
      try {
        await supabaseService.addToHistory(req.userId, text, result);
      } catch (err) {
        console.error('Error adding to history:', err);
      }
      
      return res.json(result);
    }
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get history
app.get('/api/history', async (req, res) => {
  try {
    const history = await supabaseService.getHistory(req.userId);
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Delete from history
app.delete('/api/history/:id', async (req, res) => {
  try {
    await supabaseService.deleteFromHistory(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Search history
app.get('/api/history/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Missing search query' });
    }
    
    const results = await supabaseService.searchHistory(req.userId, query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get words for revision
app.get('/api/history/revision/words', async (req, res) => {
  try {
    const words = await supabaseService.getWordsForRevision(req.userId);
    res.json(words);
  } catch (error) {
    console.error('Revision words error:', error);
    res.status(500).json({ error: 'Failed to load revision words' });
  }
});

// Record revision result
app.post('/api/history/revision', async (req, res) => {
  try {
    const { word_id, correct } = req.body;
    await supabaseService.recordRevisionResult(req.userId, word_id, correct);
    res.json({ success: true });
  } catch (error) {
    console.error('Revision result error:', error);
    res.status(500).json({ error: 'Failed to record result' });
  }
});

// Get statistics
app.get('/api/history/statistics', async (req, res) => {
  try {
    const stats = await supabaseService.getStatistics(req.userId);
    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   POST /api/translate`);
    console.log(`   GET  /api/history`);
    console.log(`   GET  /api/history/search`);
    console.log(`   GET  /api/history/revision/words`);
    console.log(`   POST /api/history/revision`);
    console.log(`   GET  /api/history/statistics\n`);
  });
}

module.exports = app;
