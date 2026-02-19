import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './HistoryView.css';

function HistoryView({ apiUrl, refreshTrigger, onWordSelect }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, az, level

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/history`);
      setHistory(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshTrigger]);

  const deleteWord = async (id) => {
    if (!window.confirm('Supprimer ce mot de l\'historique ?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/history/${id}`);
      loadHistory();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const exportVocabulary = () => {
    const csv = [
      ['Mot', 'Traduction', 'Sens (FR→DE/DE→FR)', 'Consultations', 'Niveau'].join(','),
      ...history.map(entry => [
        entry.word,
        entry.main_translation,
        `${entry.src_lang}→${entry.tgt_lang}`,
        entry.lookup_count,
        entry.revision_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulaire_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSortedHistory = () => {
    const sorted = [...history];
    switch (sortBy) {
      case 'az':
        return sorted.sort((a, b) => a.word.localeCompare(b.word));
      case 'level':
        return sorted.sort((a, b) => b.revision_score - a.revision_score);
      case 'recent':
      default:
        return sorted.sort((a, b) => 
          new Date(b.last_lookup) - new Date(a.last_lookup)
        );
    }
  };

  const renderStars = (score) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  const flags = { de: '🇩🇪', fr: '🇫🇷' };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>Aucun mot dans l'historique</h3>
        <p>Commencez par traduire des mots pour construire votre vocabulaire !</p>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>📚 Historique - {history.length} mots</h2>
        <div className="history-actions">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Plus récents</option>
            <option value="az">A → Z</option>
            <option value="level">Par niveau</option>
          </select>
          <button className="export-btn" onClick={exportVocabulary}>
            💾 Exporter
          </button>
        </div>
      </div>

      <div className="history-grid">
        {getSortedHistory().map(entry => (
          <div key={entry.id} className="history-card">
            <div className="card-header">
              <div className="word-info">
                <span className="flag">{flags[entry.src_lang]}</span>
                <span className="word">{entry.word}</span>
              </div>
              <div className="card-actions">
                <span className="lookup-count" title="Nombre de consultations">
                  {entry.lookup_count}×
                </span>
                <button 
                  className="delete-btn"
                  onClick={() => deleteWord(entry.id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="card-body">
              <div className="translation-main">
                <span className="flag">{flags[entry.tgt_lang]}</span>
                <span className="translation">{entry.main_translation}</span>
              </div>

              {entry.translations && entry.translations.length > 0 && (
                <div className="translation-alt">
                  {entry.translations.slice(0, 3).join(', ')}
                </div>
              )}

              <div className="card-footer">
                <div className="level">
                  <span className="level-label">Niveau:</span>
                  <span className="stars">{renderStars(entry.revision_score)}</span>
                </div>
                <div className="date">
                  {new Date(entry.last_lookup).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryView;
