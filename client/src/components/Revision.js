import React, { useState, useEffect } from 'react';
import { getWordsForRevision, recordRevisionResult, updateSessionStats } from '../services/historyService';
import './Revision.css';

const LANG_MAP = {
  'de': { name: 'Allemand', flag: '🇩🇪' },
  'fr': { name: 'Français', flag: '🇫🇷' },
};

const Revision = () => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevisionWords();
  }, []);

  const loadRevisionWords = async () => {
    const revisionWords = await getWordsForRevision(20);
    
    if (revisionWords.length === 0) {
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    // Mélanger les mots
    const shuffled = [...revisionWords].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setIsLoading(false);
  };

  const handleAnswer = async (correct) => {
    const currentWord = words[currentIndex];
    await recordRevisionResult(currentWord.id, correct);

    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }));

    // Passer au mot suivant
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Session terminée
      await updateSessionStats(words.length, sessionStats.correct + (correct ? 1 : 0));
      setIsFinished(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setIsFinished(false);
    setIsLoading(true);
    loadRevisionWords();
  };

  if (isLoading) {
    return (
      <div className="revision-loading">
        <div className="spinner-large">⏳</div>
        <p>Chargement des mots à réviser...</p>
      </div>
    );
  }

  if (words.length === 0 || isFinished) {
    const totalWords = sessionStats.correct + sessionStats.incorrect;
    const successRate = totalWords > 0 
      ? ((sessionStats.correct / totalWords) * 100).toFixed(0)
      : 0;

    return (
      <div className="revision-finished">
        {words.length === 0 ? (
          <>
            <div className="finished-icon">🎉</div>
            <h2>Aucun mot à réviser !</h2>
            <p>Vous avez révisé tous vos mots récemment.</p>
            <p className="hint">Ajoutez de nouveaux mots en les traduisant.</p>
          </>
        ) : (
          <>
            <div className="finished-icon">✅</div>
            <h2>Session terminée !</h2>
            <div className="session-results">
              <div className="result-stat">
                <div className="result-value">{totalWords}</div>
                <div className="result-label">Mots révisés</div>
              </div>
              <div className="result-stat success">
                <div className="result-value">{sessionStats.correct}</div>
                <div className="result-label">Corrects</div>
              </div>
              <div className="result-stat error">
                <div className="result-value">{sessionStats.incorrect}</div>
                <div className="result-label">Incorrects</div>
              </div>
              <div className="result-stat">
                <div className="result-value">{successRate}%</div>
                <div className="result-label">Taux de réussite</div>
              </div>
            </div>
            <button className="btn-restart" onClick={resetSession}>
              🔄 Nouvelle session
            </button>
          </>
        )}
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const srcFlag = LANG_MAP[currentWord.src_lang].flag;
  const tgtFlag = LANG_MAP[currentWord.tgt_lang].flag;
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="revision-container">
      <div className="revision-header">
        <h2>🧠 Mode Révision</h2>
        <div className="session-progress">
          <span className="progress-text">
            {currentIndex + 1} / {words.length}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="session-score">
          <span className="score-correct">✅ {sessionStats.correct}</span>
          <span className="score-incorrect">❌ {sessionStats.incorrect}</span>
        </div>
      </div>

      <div className="flashcard">
        <div className="flashcard-front">
          <div className="card-language">
            <span className="flag">{srcFlag}</span>
            <span className="language-name">{LANG_MAP[currentWord.src_lang].name}</span>
          </div>
          <div className="card-word">{currentWord.word}</div>
          <div className="card-level">
            {'★'.repeat(currentWord.revision_score)}
            {'☆'.repeat(5 - currentWord.revision_score)}
          </div>
        </div>

        {!showAnswer ? (
          <button className="btn-show-answer" onClick={() => setShowAnswer(true)}>
            👁️ Afficher la réponse
          </button>
        ) : (
          <div className="flashcard-back">
            <div className="card-answer">
              <div className="answer-language">
                <span className="flag">{tgtFlag}</span>
                <span className="language-name">{LANG_MAP[currentWord.tgt_lang].name}</span>
              </div>
              <div className="answer-translation">{currentWord.main_translation}</div>

              {currentWord.translations && currentWord.translations.length > 1 && (
                <div className="answer-alternatives">
                  <strong>Autres traductions :</strong>
                  <div className="alternatives-list">
                    {currentWord.translations.slice(1, 4).map((t, i) => (
                      <span key={i} className="alternative-chip">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className="answer-example">
                  <strong>Exemple :</strong>
                  <div className="example-text">{currentWord.examples[0].original}</div>
                  <div className="example-translation">→ {currentWord.examples[0].translation}</div>
                </div>
              )}
            </div>

            <div className="answer-buttons">
              <button className="btn-incorrect" onClick={() => handleAnswer(false)}>
                ❌ Incorrect
              </button>
              <button className="btn-correct" onClick={() => handleAnswer(true)}>
                ✅ Correct
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="revision-hint">
        <p>💡 Essayez de vous rappeler la traduction avant de révéler la réponse</p>
      </div>
    </div>
  );
};

export default Revision;
