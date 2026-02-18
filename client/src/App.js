import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import DirectionSelector from './components/DirectionSelector';
import ModeSelector from './components/ModeSelector';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import ErrorMessage from './components/ErrorMessage';
import Footer from './components/Footer';
import History from './components/History';
import Revision from './components/Revision';
import Statistics from './components/Statistics';
import { addToHistory } from './services/historyService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [currentView, setCurrentView] = useState('translator'); // translator, history, revision, statistics
  const [direction, setDirection] = useState({ src: 'de', tgt: 'fr' });
  const [mode, setMode] = useState('word');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    const text = inputText.trim();
    
    if (!text) {
      setError('Veuillez entrer du texte à traduire');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/translate`, {
        text: text,
        src: direction.src,
        tgt: direction.tgt,
        mode: mode
      });

      const data = response.data;
      setResult(data);

      // Ajouter à l'historique si c'est un mot (pas une phrase)
      if (data.word && mode === 'word') {
        await addToHistory(text, data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la traduction');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleWordSelectFromHistory = (word, src, tgt) => {
    setDirection({ src, tgt });
    setInputText(word);
    setMode('word');
    setCurrentView('translator');
    // Auto-translate
    setTimeout(() => {
      handleTranslate();
    }, 100);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return <History onWordSelect={handleWordSelectFromHistory} />;
      case 'revision':
        return <Revision />;
      case 'statistics':
        return <Statistics />;
      case 'translator':
      default:
        return (
          <>
            <DirectionSelector 
              direction={direction}
              onDirectionChange={setDirection}
            />
            
            <ModeSelector 
              mode={mode}
              onModeChange={setMode}
            />
            
            <InputSection
              inputText={inputText}
              onInputChange={setInputText}
              onTranslate={handleTranslate}
              onKeyPress={handleKeyPress}
              loading={loading}
              mode={mode}
            />
            
            {error && <ErrorMessage message={error} />}
            
            {result && (
              <ResultSection 
                result={result}
                direction={direction}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="App">
      <div className="container">
        <Header />
        
        {/* Navigation Menu */}
        <nav className="main-nav">
          <button 
            className={`nav-btn ${currentView === 'translator' ? 'active' : ''}`}
            onClick={() => setCurrentView('translator')}
          >
            🌍 Traduire
          </button>
          <button 
            className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            📚 Historique
          </button>
          <button 
            className={`nav-btn ${currentView === 'revision' ? 'active' : ''}`}
            onClick={() => setCurrentView('revision')}
          >
            🧠 Révision
          </button>
          <button 
            className={`nav-btn ${currentView === 'statistics' ? 'active' : ''}`}
            onClick={() => setCurrentView('statistics')}
          >
            📊 Stats
          </button>
        </nav>

        {/* Main Content */}
        <div className="main-content">
          {renderContent()}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
