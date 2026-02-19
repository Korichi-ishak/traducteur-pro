import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RevisionView.css';

function RevisionView({ apiUrl }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRevisionWords();
  }, []);

  const loadRevisionWords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/history/revision/words`);
      
      if (response.data.length === 0) {
        setError('Aucun mot à réviser pour le moment. Ajoutez des mots à votre historique !');
        setLoading(false);
        return;
      }
      
      // Shuffle words
      const shuffled = response.data.sort(() => Math.random() - 0.5);
      setWords(shuffled.slice(0, 15)); // Limit to 15 words per session
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des mots');
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    const currentWord = words[currentIndex];
    const correct = isAnswerCorrect(userAnswer, currentWord);
    
    // Record result
    try {
      await axios.post(`${apiUrl}/api/history/revision`, {
        word_id: currentWord.id,
        correct
      });
    } catch (err) {
      console.error('Error recording revision:', err);
    }

    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }));

    setShowAnswer(true);
  };

  const isAnswerCorrect = (answer, word) => {
    const userAns = answer.toLowerCase().trim();
    const correctAnswers = [
      word.main_translation?.toLowerCase(),
      ...(word.translations || []).map(t => t.toLowerCase())
    ].filter(Boolean);

    // Exact match
    if (correctAnswers.includes(userAns)) return true;

    // Partial match (fuzzy)
    for (const correct of correctAnswers) {
      if (userAns.length > 2 && (
        userAns.includes(correct) || 
        correct.includes(userAns)
      )) {
        return true;
      }
    }

    return false;
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setShowHint(false);
    } else {
      setSessionComplete(true);
    }
  };

  const skipWord = () => {
    nextWord();
  };

  const getHint = () => {
    const word = words[currentIndex];
    const trans = word.main_translation || word.translations[0] || '';
    const hint = trans[0] + '_'.repeat(Math.max(0, trans.length - 2)) + (trans.length > 1 ? trans[trans.length - 1] : '');
    return `${hint} (${trans.length} lettres)`;
  };

  const renderStars = (score) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  const flags = { de: '🇩🇪', fr: '🇫🇷' };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🧠</div>
        <h3>{error}</h3>
      </div>
    );
  }

  if (sessionComplete) {
    const total = sessionStats.correct + sessionStats.incorrect;
    const percentage = total > 0 ? (sessionStats.correct / total) * 100 : 0;
    
    return (
      <div className="session-complete">
        <div className="complete-icon">🎉</div>
        <h2>Session terminée !</h2>
        
        <div className="session-summary">
          <div className="summary-stat">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Mots révisés</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value correct">{sessionStats.correct}</div>
            <div className="stat-label">✅ Corrects</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value incorrect">{sessionStats.incorrect}</div>
            <div className="stat-label">❌ Incorrects</div>
          </div>
        </div>

        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${percentage >= 70 ? 'great' : percentage >= 50 ? 'good' : 'okay'}`}
            style={{ width: `${percentage}%` }}
          >
            {percentage.toFixed(0)}%
          </div>
        </div>

        <div className="motivational-message">
          {percentage === 100 && '🌟 Parfait ! Excellent travail !'}
          {percentage >= 70 && percentage < 100 && '👍 Bien joué !'}
          {percentage >= 50 && percentage < 70 && '📝 Continue, tu progresses !'}
          {percentage < 50 && '💪 Courage ! Révise régulièrement.'}
        </div>

        <button 
          className="restart-btn"
          onClick={() => {
            setCurrentIndex(0);
            setSessionStats({ correct: 0, incorrect: 0 });
            setSessionComplete(false);
            loadRevisionWords();
          }}
        >
          🔄 Nouvelle session
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const correct = showAnswer && isAnswerCorrect(userAnswer, currentWord);

  return (
    <div className="revision-view">
      <div className="revision-header">
        <h2>🧠 Mode Révision</h2>
        <div className="progress-info">
          <span className="word-count">{currentIndex + 1} / {words.length}</span>
          <span className="session-score">
            ✅ {sessionStats.correct} | ❌ {sessionStats.incorrect}
          </span>
        </div>
      </div>

      <div className="flashcard">
        <div className="card-level">
          <span className="level-label">Niveau:</span>
          <span className="stars">{renderStars(currentWord.revision_score)}</span>
        </div>

        <div className="question">
          <span className="flag">{flags[currentWord.src_lang]}</span>
          <div className="question-text">
            Comment dit-on <strong>« {currentWord.word} »</strong> en {currentWord.tgt_lang === 'fr' ? 'français' : 'allemand'} ?
          </div>
        </div>

        {currentWord.senses && currentWord.senses[0] && (
          <div className="context-hint">
            (Sens: {currentWord.senses[0].meaning})
          </div>
        )}

        {!showAnswer ? (
          <div className="answer-input-section">
            <input
              type="text"
              className="answer-input"
              placeholder="Votre réponse..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') checkAnswer();
              }}
              autoFocus
            />
            
            <div className="action-buttons">
              <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                💡 Indice
              </button>
              <button className="skip-btn" onClick={skipWord}>
                ⏭️ Passer
              </button>
              <button className="check-btn" onClick={checkAnswer}>
                ✓ Vérifier
              </button>
            </div>

            {showHint && (
              <div className="hint-box">
                💡 {getHint()}
              </div>
            )}
          </div>
        ) : (
          <div className="answer-result">
            <div className={`result-badge ${correct ? 'correct' : 'incorrect'}`}>
              {correct ? '✅ Correct !' : '❌ Incorrect'}
            </div>

            <div className="correct-answer">
              <span className="flag">{flags[currentWord.tgt_lang]}</span>
              <strong>{currentWord.main_translation}</strong>
            </div>

            {currentWord.translations && currentWord.translations.length > 0 && (
              <div className="other-translations">
                Aussi: {currentWord.translations.slice(0, 3).join(', ')}
              </div>
            )}

            {currentWord.examples && currentWord.examples[0] && (
              <div className="example">
                <div className="example-original">💬 {currentWord.examples[0].original}</div>
                <div className="example-translation">{currentWord.examples[0].translation}</div>
              </div>
            )}

            <button className="next-btn" onClick={nextWord}>
              {currentIndex < words.length - 1 ? 'Suivant →' : 'Terminer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RevisionView;
