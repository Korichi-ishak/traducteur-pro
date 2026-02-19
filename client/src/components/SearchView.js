import React, { useState } from 'react';
import axios from 'axios';
import './SearchView.css';

function SearchView({ apiUrl }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get(`${apiUrl}/api/history/search`, {
        params: { q: searchQuery }
      });
      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i}>{part}</mark> : part
    );
  };

  const flags = { de: '🇩🇪', fr: '🇫🇷' };

  return (
    <div className="search-view">
      <div className="search-header">
        <h2>🔍 Rechercher dans l'historique</h2>
        <p>Retrouvez rapidement un mot ou une traduction</p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher un mot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? <span className="spinner-small"></span> : '🔍'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🤷‍♂️</div>
          <h3>Aucun résultat trouvé</h3>
          <p>Essayez avec un autre mot</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <div className="results-count">
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </div>

          <div className="results-grid">
            {results.map(entry => (
              <div key={entry.id} className="result-card">
                <div className="card-header">
                  <div className="word-section">
                    <span className="flag">{flags[entry.src_lang]}</span>
                    <span className="word">
                      {highlightText(entry.word, searchQuery)}
                    </span>
                  </div>
                  <span className="lookup-count">{entry.lookup_count}×</span>
                </div>

                <div className="card-body">
                  <div className="translation-section">
                    <span className="flag">{flags[entry.tgt_lang]}</span>
                    <span className="translation">
                      {highlightText(entry.main_translation, searchQuery)}
                    </span>
                  </div>

                  {entry.translations && entry.translations.length > 0 && (
                    <div className="alt-translations">
                      {entry.translations.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="alt-trans">
                          {highlightText(t, searchQuery)}
                        </span>
                      )).reduce((prev, curr) => [prev, ', ', curr])}
                    </div>
                  )}

                  <div className="card-footer">
                    <div className="level">
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
      )}
    </div>
  );
}

export default SearchView;
