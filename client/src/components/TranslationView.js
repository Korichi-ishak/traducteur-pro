import React, { useState } from 'react';
import axios from 'axios';
import './TranslationView.css';

function TranslationView({ apiUrl, onHistoryUpdate }) {
  const [direction, setDirection] = useState({ src: 'de', tgt: 'fr' });
  const [mode, setMode] = useState('word'); // 'word' or 'phrase'
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    const text = inputText.trim();
    
    if (!text) {
      setError('⚠️ Veuillez entrer du texte à traduire');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${apiUrl}/api/translate`, {
        text,
        src: direction.src,
        tgt: direction.tgt,
        mode
      });

      setResult(response.data);
      
      // Notifier la mise à jour de l'historique
      if (mode === 'word' && onHistoryUpdate) {
        onHistoryUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Erreur lors de la traduction');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const switchDirection = () => {
    setDirection(prev => ({ src: prev.tgt, tgt: prev.src }));
    setResult(null);
  };

  const flags = { de: '🇩🇪', fr: '🇫🇷' };

  return (
    <div className="translation-view">
      {/* Direction Selector */}
      <div className="direction-selector">
        <button className="dir-btn active">
          <span className="flag">{flags[direction.src]}</span>
          <span className="lang">{direction.src.toUpperCase()}</span>
        </button>
        <button className="switch-btn" onClick={switchDirection}>
          ⇄
        </button>
        <button className="dir-btn active">
          <span className="flag">{flags[direction.tgt]}</span>
          <span className="lang">{direction.tgt.toUpperCase()}</span>
        </button>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'word' ? 'active' : ''}`}
          onClick={() => setMode('word')}
        >
          📖 Mot (détaillé)
        </button>
        <button
          className={`mode-btn ${mode === 'phrase' ? 'active' : ''}`}
          onClick={() => setMode('phrase')}
        >
          💬 Phrase
        </button>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <textarea
          className="input-text"
          placeholder={mode === 'word' ? 'Entrez un mot...' : 'Entrez une phrase...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTranslate();
            }
          }}
        />
        <button
          className="translate-btn"
          onClick={handleTranslate}
          disabled={loading}
        >
          {loading ? <span className="spinner"></span> : 'Traduire'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Results */}
      {result && mode === 'word' && <WordResult result={result} direction={direction} flags={flags} />}
      {result && mode === 'phrase' && <PhraseResult result={result} direction={direction} flags={flags} />}
    </div>
  );
}

function WordResult({ result, direction, flags }) {
  return (
    <div className="result-container word-result">
      {/* Main Translation */}
      <div className="main-translation">
        <div className="original-word">
          <span className="flag">{flags[direction.src]}</span>
          <span className="word">{result.word}</span>
        </div>
        <div className="arrow">→</div>
        <div className="translated-word">
          <span className="flag">{flags[direction.tgt]}</span>
          <span className="word">{result.main_translation}</span>
        </div>
      </div>

      {/* All Translations */}
      {result.all_translations && result.all_translations.length > 0 && (
        <div className="section">
          <h3 className="section-title">📝 Traductions</h3>
          <div className="translations-list">
            {result.all_translations.slice(0, 8).map((trans, idx) => (
              <span key={idx} className="translation-tag">{trans}</span>
            ))}
          </div>
        </div>
      )}

      {/* Senses (PONS) */}
      {result.senses && result.senses.length > 0 && (
        <div className="section">
          <h3 className="section-title">🎯 Significations par sens (PONS)</h3>
          {result.senses.slice(0, 10).map((sense, idx) => (
            <div key={idx} className="sense-item">
              <div className="sense-meaning">{sense.meaning}</div>
              <div className="sense-translation">→ {sense.translation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Phrases (PONS) */}
      {result.phrases && result.phrases.length > 0 && (
        <div className="section">
          <h3 className="section-title">💡 Expressions & Locutions (PONS)</h3>
          {result.phrases.slice(0, 8).map((phrase, idx) => (
            <div key={idx} className="phrase-item">
              <div className="phrase-original">{flags[direction.src]} {phrase.phrase}</div>
              <div className="phrase-translation">{flags[direction.tgt]} {phrase.translation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Examples (Glosbe) */}
      {result.examples && result.examples.length > 0 && (
        <div className="section">
          <h3 className="section-title">💬 Exemples en contexte (Glosbe)</h3>
          {result.examples.slice(0, 8).map((ex, idx) => (
            <div key={idx} className="example-item">
              <div className="example-original">{flags[direction.src]} {ex.original}</div>
              <div className="example-translation">{flags[direction.tgt]} {ex.translation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhraseResult({ result, direction, flags }) {
  return (
    <div className="result-container phrase-result">
      {/* Translation */}
      <div className="main-translation">
        <div className="phrase-box original">
          <span className="flag">{flags[direction.src]}</span>
          <p className="phrase-text">{result.original}</p>
        </div>
        <div className="arrow">↓</div>
        <div className="phrase-box translated">
          <span className="flag">{flags[direction.tgt]}</span>
          <p className="phrase-text">{result.translation}</p>
        </div>
      </div>

      {/* Word by Word */}
      {result.word_by_word && Object.keys(result.word_by_word).length > 0 && (
        <div className="section">
          <h3 className="section-title">📝 Vocabulaire (mot à mot)</h3>
          <div className="word-by-word">
            {Object.entries(result.word_by_word).map(([word, trans], idx) => (
              <div key={idx} className="wbw-item">
                <span className="wbw-word">{word}</span>
                <span className="wbw-arrow">→</span>
                <span className="wbw-translation">{trans}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TranslationView;
