import React, { useState, useEffect } from 'react';
import { getStatistics } from '../services/historyService';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getStatistics();
    setStats(data);
  };

  if (!stats) {
    return (
      <div className="stats-loading">
        <div className="spinner-large">⏳</div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  const lastSessionDate = stats.last_session 
    ? new Date(stats.last_session).toLocaleDateString('fr-FR')
    : 'Jamais';

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h2>📊 Statistiques de Progression</h2>
      </div>

      {/* Vue d'ensemble */}
      <div className="stats-section">
        <h3>📈 Vue d'ensemble</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{stats.totalWords}</div>
            <div className="stat-label">Mots au total</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.streak_days}</div>
            <div className="stat-label">Jours consécutifs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.successRate}%</div>
            <div className="stat-label">Taux de réussite</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{lastSessionDate}</div>
            <div className="stat-label">Dernière session</div>
          </div>
        </div>
      </div>

      {/* Niveau de maîtrise */}
      <div className="stats-section">
        <h3>⭐ Niveau de maîtrise</h3>
        <div className="mastery-grid">
          <div className="mastery-card mastered">
            <div className="mastery-icon">🏆</div>
            <div className="mastery-value">{stats.masteredWords}</div>
            <div className="mastery-label">Mots maîtrisés</div>
            <div className="mastery-stars">★★★★★</div>
          </div>
          <div className="mastery-card learning">
            <div className="mastery-icon">📖</div>
            <div className="mastery-value">{stats.learningWords}</div>
            <div className="mastery-label">En apprentissage</div>
            <div className="mastery-stars">★★☆☆☆</div>
          </div>
          <div className="mastery-card new">
            <div className="mastery-icon">🆕</div>
            <div className="mastery-value">{stats.newWords}</div>
            <div className="mastery-label">Mots nouveaux</div>
            <div className="mastery-stars">☆☆☆☆☆</div>
          </div>
        </div>

        {/* Barre de progression */}
        {stats.totalWords > 0 && (
          <div className="mastery-progress">
            <div className="progress-label">Progression globale</div>
            <div className="progress-bar-container">
              <div 
                className="progress-segment mastered"
                style={{ width: `${(stats.masteredWords / stats.totalWords) * 100}%` }}
              ></div>
              <div 
                className="progress-segment learning"
                style={{ width: `${(stats.learningWords / stats.totalWords) * 100}%` }}
              ></div>
              <div 
                className="progress-segment new"
                style={{ width: `${(stats.newWords / stats.totalWords) * 100}%` }}
              ></div>
            </div>
            <div className="progress-percentages">
              <span className="percent mastered">{((stats.masteredWords / stats.totalWords) * 100).toFixed(0)}%</span>
              <span className="percent learning">{((stats.learningWords / stats.totalWords) * 100).toFixed(0)}%</span>
              <span className="percent new">{((stats.newWords / stats.totalWords) * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Sessions de révision */}
      <div className="stats-section">
        <h3>🧠 Sessions de révision</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔢</div>
            <div className="stat-value">{stats.total_sessions}</div>
            <div className="stat-label">Sessions totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.total_words_reviewed}</div>
            <div className="stat-label">Mots révisés</div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.total_correct}</div>
            <div className="stat-label">Réponses correctes</div>
          </div>
          <div className="stat-card error">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats.total_incorrect}</div>
            <div className="stat-label">Réponses incorrectes</div>
          </div>
        </div>
      </div>

      {/* Activité */}
      <div className="stats-section">
        <h3>📊 Activité</h3>
        <div className="activity-info">
          <div className="activity-item">
            <span className="activity-label">Moyenne de consultations par mot :</span>
            <span className="activity-value">{stats.avgLookups}</span>
          </div>
          {stats.total_words_reviewed > 0 && (
            <>
              <div className="activity-item">
                <span className="activity-label">Moyenne de mots par session :</span>
                <span className="activity-value">
                  {(stats.total_words_reviewed / stats.total_sessions).toFixed(1)}
                </span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Taux de réussite global :</span>
                <span className="activity-value">{stats.successRate}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conseils */}
      <div className="stats-tips">
        <h4>💡 Conseils</h4>
        <ul>
          {stats.streak_days === 0 && (
            <li>🎯 Commencez une série en révisant vos mots aujourd'hui !</li>
          )}
          {stats.streak_days > 0 && stats.streak_days < 7 && (
            <li>🔥 Continuez votre série de {stats.streak_days} jour{stats.streak_days > 1 ? 's' : ''} !</li>
          )}
          {stats.streak_days >= 7 && (
            <li>🏆 Excellente série de {stats.streak_days} jours ! Continuez comme ça !</li>
          )}
          {stats.newWords > 10 && (
            <li>📚 Vous avez {stats.newWords} nouveaux mots à réviser. Lancez une session !</li>
          )}
          {stats.successRate < 70 && stats.total_words_reviewed > 10 && (
            <li>💪 Révisez plus régulièrement pour améliorer votre taux de réussite.</li>
          )}
          {stats.successRate >= 90 && stats.total_words_reviewed > 20 && (
            <li>🌟 Excellent taux de réussite ! Vous maîtrisez bien votre vocabulaire !</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Statistics;
