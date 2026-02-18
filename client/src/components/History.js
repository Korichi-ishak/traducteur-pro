import React, { useState, useEffect } from 'react';
import { loadHistory, searchHistory, deleteFromHistory, clearHistory } from '../services/historyService';
import './History.css';

const LANG_MAP = {
  'de': { name: 'Allemand', flag: '🇩🇪' },
  'fr': { name: 'Français', flag: '🇫🇷' },
};

const History = ({ onWordSelect }) => {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [expandedWord, setExpandedWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchHistory(searchQuery);
        setFilteredHistory(results);
      } else {
        setFilteredHistory(history);
      }
    };
    performSearch();
  }, [searchQuery, history]);

  const loadHistoryData = async () => {
    setLoading(true);
    const data = await loadHistory();
    setHistory(data);
    setFilteredHistory(data);
    setLoading(false);
  };

  const handleDelete = async (wordId, wordText) => {
    if (window.confirm(`Supprimer "${wordText}" de l'historique ?`)) {
      await deleteFromHistory(wordId);
      await loadHistoryData();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Supprimer tout l\'historique ? Cette action est irréversible.')) {
      await clearHistory();
      await loadHistoryData();
    }
  };

  const toggleExpand = (word) => {
    setExpandedWord(expandedWord === word ? null : word);
  };

  const exportToFile = () => {
    const content = filteredHistory.map(entry => 
      `${entry.word}\t${entry.main_translation}\t${entry.src_lang}→${entry.tgt_lang}\t×${entry.lookup_count}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulaire_' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="history-empty">
        <div className="empty-icon">⏳</div>
        <h3>Chargement...</h3>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">📭</div>
        <h3>Aucun mot dans l'historique</h3>
        <p>Les mots que vous traduisez apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📚 Historique — {history.length} mots</h2>
        
        <div className="history-actions">
          <button onClick={exportToFile} className="btn-export">
            💾 Exporter
          </button>
          <button onClick={handleClearAll} className="btn-clear">
            🗑️ Tout effacer
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher dans l'historique..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <span className="search-results-count">
            {filteredHistory.length} résultat{filteredHistory.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="history-list">
        {filteredHistory.map((entry, index) => {
          const srcFlag = LANG_MAP[entry.src_lang].flag;
          const tgtFlag = LANG_MAP[entry.tgt_lang].flag;
          const isExpanded = expandedWord === entry.id;
          const stars = '★'.repeat(entry.revision_score) + '☆'.repeat(5 - entry.revision_score);

          return (
            <div key={entry.id || index} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
              <div className="history-item-main" onClick={() => toggleExpand(entry.id)}>
                <div className="history-word">
                  <span className="flag">{srcFlag}</span>
                  <span className="word-text">{entry.word}</span>
                </div>
                <div className="history-arrow">→</div>
                <div className="history-translation">
                  <span className="flag">{tgtFlag}</span>
                  <span className="translation-text">{entry.main_translation}</span>
                </div>
                <div className="history-meta">
                  <span className="lookup-count" title="Nombre de consultations">
                    ×{entry.lookup_count}
                  </span>
                  <span className="revision-stars" title="Niveau de maîtrise">
                    {stars}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="history-item-details">
                  {entry.translations && entry.translations.length > 0 && (
                    <div className="detail-section">
                      <strong>Traductions :</strong>
                      <div className="translations-chips">
                        {entry.translations.slice(0, 8).map((t, i) => (
                          <span key={i} className="chip">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.synonyms && entry.synonyms.length > 0 && (
                    <div className="detail-section">
                      <strong>Synonymes :</strong>
                      <div className="translations-chips">
                        {entry.synonyms.slice(0, 6).map((s, i) => (
                          <span key={i} className="chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.examples && entry.examples.length > 0 && (
                    <div className="detail-section">
                      <strong>Exemples :</strong>
                      {entry.examples.slice(0, 3).map((ex, i) => (
                        <div key={i} className="example-item">
                          <div className="example-original">{ex.original}</div>
                          <div className="example-translation">→ {ex.translation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="history-item-actions">
                    <button 
                      className="btn-retranslate"
                      onClick={() => onWordSelect && onWordSelect(entry.word, entry.src_lang, entry.tgt_lang)}
                    >
                      🔄 Retraduire
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(entry.id, entry.word)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;