import React, { useState } from 'react';
import './App.css';
import TranslationView from './components/TranslationView';
import HistoryView from './components/HistoryView';
import RevisionView from './components/RevisionView';
import StatsView from './components/StatsView';
import SearchView from './components/SearchView';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [currentView, setCurrentView] = useState('translate');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const views = {
    translate: <TranslationView 
      apiUrl={API_URL} 
      onHistoryUpdate={() => setRefreshHistory(prev => prev + 1)} 
    />,
    history: <HistoryView 
      apiUrl={API_URL} 
      refreshTrigger={refreshHistory}
      onWordSelect={(word, src, tgt) => setCurrentView('translate')}
    />,
    revision: <RevisionView apiUrl={API_URL} />,
    stats: <StatsView apiUrl={API_URL} />,
    search: <SearchView apiUrl={API_URL} />
  };

  const navItems = [
    { id: 'translate', icon: '🌍', label: 'Traduire' },
    { id: 'history', icon: '📚', label: 'Historique' },
    { id: 'revision', icon: '🧠', label: 'Révision' },
    { id: 'stats', icon: '📊', label: 'Stats' },
    { id: 'search', icon: '🔍', label: 'Recherche' }
  ];

  return (
    <div className="App">
      {/* Animated background */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>

      <div className="app-shell">
        {/* Header */}
        <header className="app-header">
          <div className="header-glow"></div>
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <span>DE</span>
                <svg className="logo-arrows" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4"/>
                </svg>
                <span>FR</span>
              </div>
              <div className="logo-text">
                <h1>LinguaPro</h1>
                <span className="logo-badge">Allemand - Français</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="app-nav">
          <div className="nav-track">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {currentView === item.id && <span className="nav-indicator"></span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-main" key={currentView}>
          {views[currentView]}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-sources">
            <span className="source-dot"></span>
            Google Translate
            <span className="source-dot"></span>
            PONS
            <span className="source-dot"></span>
            Glosbe
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
