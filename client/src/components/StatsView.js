import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StatsView.css';

function StatsView({ apiUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/history/statistics`);
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>Aucune statistique disponible</h3>
        <p>Commencez à réviser pour voir vos progrès !</p>
      </div>
    );
  }

  const totalAttempts = stats.total_correct + stats.total_incorrect;
  const successRate = totalAttempts > 0 ? (stats.total_correct / totalAttempts) * 100 : 0;

  return (
    <div className="stats-view">
      <h2>📊 Statistiques de progression</h2>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.total_words || 0}</div>
          <div className="stat-label">Mots dans l'historique</div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">🧠</div>
          <div className="stat-value">{stats.total_sessions || 0}</div>
          <div className="stat-label">Sessions de révision</div>
        </div>

        <div className="stat-card tertiary">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.total_words_reviewed || 0}</div>
          <div className="stat-label">Mots révisés (total)</div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.total_correct || 0}</div>
          <div className="stat-label">Réponses correctes</div>
        </div>

        <div className="stat-card error">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{stats.total_incorrect || 0}</div>
          <div className="stat-label">Réponses incorrectes</div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{successRate.toFixed(1)}%</div>
          <div className="stat-label">Taux de réussite</div>
        </div>
      </div>

      {/* Success Rate Bar */}
      <div className="success-rate-section">
        <h3>Taux de réussite global</h3>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${successRate >= 70 ? 'great' : successRate >= 50 ? 'good' : 'okay'}`}
            style={{ width: `${successRate}%` }}
          >
            {successRate.toFixed(1)}%
          </div>
        </div>
        <div className="success-message">
          {successRate >= 70 && '🌟 Excellent ! Continue comme ça !'}
          {successRate >= 50 && successRate < 70 && '👍 Bien ! Tu progresses régulièrement.'}
          {successRate < 50 && totalAttempts > 0 && '💪 Continue ! Chaque révision compte.'}
        </div>
      </div>

      {/* Level Distribution */}
      {stats.level_distribution && (
        <div className="level-distribution">
          <h3>Distribution par niveau</h3>
          <div className="level-bars">
            {[5, 4, 3, 2, 1, 0].map(level => {
              const count = stats.level_distribution[level] || 0;
              const total = stats.total_words || 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={level} className="level-bar-row">
                  <div className="level-label">
                    <span className="stars">{'★'.repeat(level) + '☆'.repeat(5 - level)}</span>
                    <span className="level-count">{count} mots</span>
                  </div>
                  <div className="level-bar-container">
                    <div 
                      className="level-bar"
                      style={{ 
                        width: `${percentage}%`,
                        background: `hsl(${level * 40}, 70%, 50%)`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Session */}
      {stats.last_session && (
        <div className="last-session">
          <h3>Dernière session</h3>
          <p>{new Date(stats.last_session).toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short'
          })}</p>
        </div>
      )}
    </div>
  );
}

export default StatsView;
