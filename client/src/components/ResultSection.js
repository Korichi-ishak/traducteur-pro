import React from 'react';

const LANG_MAP = {
  'de': { name: 'Allemand', flag: '🇩🇪' },
  'fr': { name: 'Français', flag: '🇫🇷' },
};

const ResultSection = ({ result, direction }) => {
  const sourceFlag = LANG_MAP[direction.src].flag;
  const targetFlag = LANG_MAP[direction.tgt].flag;

  // Mode mot
  if (result.word) {
    return (
      <div className="result-section">
        <div className="main-result">
          <div className="source-word">
            <span className="flag-label">{sourceFlag}</span>
            <span>{result.word}</span>
          </div>
          <div className="arrow-down">↓</div>
          <div className="translation-word">
            <span className="flag-label">{targetFlag}</span>
            <span>{result.main_translation}</span>
          </div>
        </div>

        <div className="details-container">
          {/* Traductions multiples */}
          {result.translations && result.translations.length > 1 && (
            <DetailCard title="📖 Traductions">
              <div className="translation-list">
                {result.translations.map((t, i) => (
                  <span key={i} className="translation-chip">{t}</span>
                ))}
              </div>
            </DetailCard>
          )}

          {/* Synonymes */}
          {result.synonyms && result.synonyms.length > 0 && (
            <DetailCard title="🔄 Mots proches">
              <div className="translation-list">
                {result.synonyms.map((s, i) => (
                  <span key={i} className="translation-chip">{s}</span>
                ))}
              </div>
            </DetailCard>
          )}

          {/* Significations par sens (PONS) */}
          {result.senses && result.senses.length > 0 && (
            <DetailCard title="🎯 Significations par sens">
              {result.senses.map((s, i) => (
                <div key={i} className="detail-item">
                  <strong>{s.meaning}</strong>
                  <p>→ {s.translation}</p>
                </div>
              ))}
            </DetailCard>
          )}

          {/* Expressions (PONS) */}
          {result.phrases && result.phrases.length > 0 && (
            <DetailCard title="💡 Expressions">
              {result.phrases.map((p, i) => (
                <div key={i} className="detail-item">
                  <strong>{p.phrase}</strong>
                  <p>→ {p.translation}</p>
                </div>
              ))}
            </DetailCard>
          )}

          {/* Exemples (Glosbe) */}
          {result.examples && result.examples.length > 0 && (
            <DetailCard title="💬 Exemples en contexte">
              {result.examples.map((ex, i) => (
                <div key={i} className="detail-item">
                  <strong>({i + 1}) {ex.original}</strong>
                  <p>→ {ex.translation}</p>
                </div>
              ))}
            </DetailCard>
          )}
        </div>
      </div>
    );
  }

  // Mode phrase
  if (result.original) {
    return (
      <div className="result-section">
        <div className="main-result">
          <div className="source-word">
            <span className="flag-label">{sourceFlag}</span>
            <span>{result.original}</span>
          </div>
          <div className="arrow-down">↓</div>
          <div className="translation-word">
            <span className="flag-label">{targetFlag}</span>
            <span>{result.translation}</span>
          </div>
        </div>

        <div className="details-container">
          {/* Vocabulaire mot à mot */}
          {result.word_by_word && Object.keys(result.word_by_word).length > 0 && (
            <DetailCard title="📝 Vocabulaire (mot à mot)">
              {Object.entries(result.word_by_word).map(([word, trans], i) => (
                <div key={i} className="word-by-word">
                  <span className="word-src">{word}</span>
                  <span className="word-arrow">→</span>
                  <span className="word-tgt">{trans}</span>
                </div>
              ))}
            </DetailCard>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const DetailCard = ({ title, children }) => {
  return (
    <div className="detail-card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
};

export default ResultSection;
