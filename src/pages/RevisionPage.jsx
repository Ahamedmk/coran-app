// src/pages/RevisionPage.jsx

import React, { useState, useEffect } from 'react';
import { Brain, Calendar, TrendingUp, Award, AlertCircle, CheckCircle2, XCircle, Zap } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { quranAPI } from '../services/quranAPI';
import { 
  DIFFICULTY_LEVELS, 
  REVIEW_STATUS,
  getReviewStatus,
  getMotivationalMessage,
  calculateRetentionScore,
  isDueForReview 
} from '../services/revisionSystem';

const RevisionPage = ({ 
  surahReviews, 
  surahs,
  onStartRevision,
  onReviewComplete 
}) => {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  // Charger les données de la sourate quand elle est sélectionnée
  useEffect(() => {
    const loadSurahData = async () => {
      if (selectedSurah) {
        setLoadingSurah(true);
        const data = await quranAPI.getSurah(selectedSurah.surah_id);
        setSurahData(data);
        setLoadingSurah(false);
      }
    };
    loadSurahData();
  }, [selectedSurah]);

  // Statistiques
  const dueToday = surahReviews.filter(r => isDueForReview(r.next_review_date));
  const learning = surahReviews.filter(r => getReviewStatus(r.repetitions, r.interval_days) === REVIEW_STATUS.LEARNING);
  const mastered = surahReviews.filter(r => getReviewStatus(r.repetitions, r.interval_days) === REVIEW_STATUS.MASTERED);

  const getStatusColor = (status) => {
    switch(status) {
      case REVIEW_STATUS.NEW: return 'bg-blue-500';
      case REVIEW_STATUS.LEARNING: return 'bg-yellow-500';
      case REVIEW_STATUS.REVIEWING: return 'bg-orange-500';
      case REVIEW_STATUS.MASTERED: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case REVIEW_STATUS.NEW: return '🌱';
      case REVIEW_STATUS.LEARNING: return '📚';
      case REVIEW_STATUS.REVIEWING: return '🔄';
      case REVIEW_STATUS.MASTERED: return '🌟';
      default: return '📖';
    }
  };

  const getDifficultyButton = (level, label, icon, color) => (
    <button
      onClick={() => handleReviewAnswer(level)}
      className={`flex-1 ${color} hover:opacity-80 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-105 shadow-lg`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm">{label}</div>
    </button>
  );

  const handleStartRevision = (surah) => {
    setSelectedSurah(surah);
    setCurrentVerseIndex(0);
    setShowAnswer(false);
    setSurahData(null);
    onStartRevision(surah.surah_id);
  };

  const handleReviewAnswer = (difficulty) => {
    onReviewComplete(selectedSurah.surah_id, difficulty);
    setSelectedSurah(null);
    setShowAnswer(false);
    setSurahData(null);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  if (selectedSurah) {
    const surahInfo = surahs.find(s => s.number === selectedSurah.surah_id);
    const retention = calculateRetentionScore(selectedSurah.repetitions, selectedSurah.average_difficulty || 2);

    if (loadingSurah) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-2xl">Chargement de la sourate...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <button
  onClick={() => {
    setSelectedSurah(null);
    setShowAnswer(false);
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'rgba(255, 255, 255, 0.8)',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem'
  }}
  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 1)'}
  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
>
  <span style={{ fontSize: '1.5rem' }}>←</span>
  <span>Retour aux révisions</span>
</button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">{surahInfo?.englishName}</h1>
            <div className="text-5xl mb-4">{surahInfo?.name}</div>
            
            <div className="flex justify-center gap-4 mb-6">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-sm opacity-70">Répétitions</div>
                <div className="text-2xl font-bold">{selectedSurah.repetitions}</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-sm opacity-70">Rétention</div>
                <div className="text-2xl font-bold">{retention}%</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-sm opacity-70">Intervalle</div>
                <div className="text-2xl font-bold">{selectedSurah.interval_days}j</div>
              </div>
            </div>
          </div>

          {!showAnswer ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 border border-purple-500/30 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h2 className="text-2xl font-bold mb-4">Test de mémorisation</h2>
                <p className="text-lg text-white/80 mb-6">
                  Essaie de réciter mentalement cette sourate avant de vérifier.
                </p>
                <p className="text-white/60 mb-8">
                  Prends ton temps, visualise chaque verset, puis clique quand tu es prêt(e).
                </p>
                <button
                  onClick={handleShowAnswer}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-lg text-lg"
                >
                  Afficher la sourate 👁️
                </button>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <strong>Astuce :</strong> Récite à haute voix ou dans ta tête avant de vérifier. 
                  La récitation active améliore la mémorisation !
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-500/30">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" />
                  Sourate complète
                </h3>
                <div className="bg-black/20 rounded-lg p-6 text-right max-h-96 overflow-y-auto">
                  {surahData && surahData.ayahs ? (
                    <div className="space-y-4">
                      {surahData.ayahs.map((ayah, index) => (
                        <div key={index} className="pb-4 border-b border-white/10 last:border-0">
                          <div className="text-2xl md:text-3xl leading-loose mb-2">
                            {ayah.text}
                          </div>
                          <div className="text-sm text-white/40">Verset {ayah.numberInSurah}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">
                      Chargement des versets...
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-xl font-bold mb-4 text-center">
                  Comment était ta mémorisation ?
                </h3>
                <p className="text-center text-white/70 mb-6">
                  Sois honnête avec toi-même, cela aide l'algorithme à optimiser tes révisions
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getDifficultyButton(
                    DIFFICULTY_LEVELS.FORGOT,
                    "Oublié",
                    "❌",
                    "bg-red-600"
                  )}
                  {getDifficultyButton(
                    DIFFICULTY_LEVELS.DIFFICULT,
                    "Difficile",
                    "😰",
                    "bg-orange-600"
                  )}
                  {getDifficultyButton(
                    DIFFICULTY_LEVELS.MEDIUM,
                    "Moyen",
                    "🤔",
                    "bg-yellow-600"
                  )}
                  {getDifficultyButton(
                    DIFFICULTY_LEVELS.EASY,
                    "Facile",
                    "😊",
                    "bg-blue-600"
                  )}
                  {getDifficultyButton(
                    DIFFICULTY_LEVELS.PERFECT,
                    "Parfait",
                    "🌟",
                    "bg-green-600"
                  )}
                </div>
              </div>

              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4 flex gap-3">
                <Zap className="text-cyan-400 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <strong>Répétition espacée :</strong>
                  <ul className="mt-2 space-y-1 text-white/80">
                    <li>• <strong>Oublié/Difficile :</strong> Révision rapprochée (1-2 jours)</li>
                    <li>• <strong>Moyen :</strong> Révision dans quelques jours</li>
                    <li>• <strong>Facile/Parfait :</strong> Révision espacée (semaines/mois)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-10 h-10 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold">Système de Révision</h1>
            <p className="text-white/70">Répétition espacée pour mémoriser à long terme</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{dueToday.length}</div>
            <div className="text-sm opacity-80">À réviser aujourd'hui</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{learning.length}</div>
            <div className="text-sm opacity-80">En apprentissage</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{mastered.length}</div>
            <div className="text-sm opacity-80">Maîtrisées</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{surahReviews.length}</div>
            <div className="text-sm opacity-80">Total sourates</div>
          </div>
        </div>
      </div>

      {dueToday.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="text-red-400" />
            Révisions du jour ({dueToday.length})
          </h2>
          <p className="text-white/80 mb-4">
            Ces sourates doivent être révisées aujourd'hui pour maintenir ta mémorisation
          </p>

          <div className="grid gap-4">
            {dueToday.map(review => {
              const surah = surahs.find(s => s.number === review.surah_id);
              if (!surah) return null;

              const status = getReviewStatus(review.repetitions, review.interval_days);
              const retention = calculateRetentionScore(review.repetitions, review.average_difficulty || 2);
              const daysOverdue = Math.floor((new Date() - new Date(review.next_review_date)) / (1000 * 60 * 60 * 24));

              return (
                <div 
                  key={review.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getStatusIcon(status)}</span>
                        <h3 className="text-xl font-bold">{surah.englishName}</h3>
                      </div>
                      <div className="text-2xl opacity-70 mb-2">{surah.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        {daysOverdue > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500">
                            En retard de {daysOverdue}j
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-400">{retention}%</div>
                      <div className="text-xs text-white/60">Rétention</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Répétitions : {review.repetitions}</span>
                      <span>Intervalle : {review.interval_days} jours</span>
                    </div>
                    <ProgressBar percentage={retention} gradient="from-purple-400 to-pink-400" />
                  </div>

                  <button
                    onClick={() => handleStartRevision(review)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all hover:scale-105 shadow-lg"
                  >
                    Réviser maintenant 🧠
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-4">Toutes les sourates en révision</h2>
        
        <div className="grid gap-4">
          {surahReviews
            .filter(r => !isDueForReview(r.next_review_date))
            .sort((a, b) => new Date(a.next_review_date) - new Date(b.next_review_date))
            .map(review => {
              const surah = surahs.find(s => s.number === review.surah_id);
              if (!surah) return null;

              const status = getReviewStatus(review.repetitions, review.interval_days);
              const retention = calculateRetentionScore(review.repetitions, review.average_difficulty || 2);
              const nextReview = new Date(review.next_review_date);
              const daysUntil = Math.ceil((nextReview - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div 
                  key={review.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getStatusIcon(status)}</span>
                        <h3 className="text-xl font-bold">{surah.englishName}</h3>
                      </div>
                      <div className="text-xl opacity-70 mb-2">{surah.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500">
                          Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{retention}%</div>
                      <div className="text-xs text-white/60">{review.repetitions} répétitions</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Brain className="text-blue-400" />
          Comment fonctionne la répétition espacée ?
        </h3>
        <div className="space-y-3 text-white/90">
          <p>
            <strong>🧠 Science :</strong> Basé sur la courbe d'oubli d'Ebbinghaus et l'algorithme SM-2 (SuperMemo)
          </p>
          <p>
            <strong>⏰ Principe :</strong> Réviser juste avant d'oublier renforce la mémorisation
          </p>
          <p>
            <strong>📈 Résultat :</strong> Intervalles qui s'allongent progressivement (1j → 3j → 7j → 15j → 30j → 60j...)
          </p>
          <p>
            <strong>✅ Efficacité :</strong> Méthode prouvée scientifiquement pour la mémorisation à long terme
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevisionPage;