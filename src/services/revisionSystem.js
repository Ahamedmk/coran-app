// src/services/revisionSystem.js
// Système de Répétition Espacée (SRS) basé sur l'algorithme SM-2 (SuperMemo)

/**
 * Algorithme de répétition espacée
 * Basé sur la courbe d'oubli d'Ebbinghaus et l'algorithme SM-2
 * 
 * Intervalles de révision :
 * - Facile : 1j → 3j → 7j → 15j → 30j → 60j → 120j
 * - Moyen : 1j → 2j → 4j → 7j → 14j → 30j → 60j
 * - Difficile : Réinitialise à 1 jour
 * - Oublié : Recommence depuis le début
 */

export const DIFFICULTY_LEVELS = {
  FORGOT: 0,      // Complètement oublié
  DIFFICULT: 1,   // Très difficile
  MEDIUM: 2,      // Moyen
  EASY: 3,        // Facile
  PERFECT: 4      // Parfait
};

export const REVIEW_STATUS = {
  NEW: 'new',              // Jamais révisé
  LEARNING: 'learning',    // En apprentissage (< 3 révisions)
  REVIEWING: 'reviewing',  // En révision régulière
  MASTERED: 'mastered'     // Maîtrisé (> 10 révisions)
};

/**
 * Calcule le prochain intervalle de révision
 * @param {number} currentInterval - Intervalle actuel en jours
 * @param {number} difficulty - Niveau de difficulté (0-4)
 * @param {number} repetitions - Nombre de répétitions réussies
 * @returns {number} Prochain intervalle en jours
 */
export const calculateNextInterval = (currentInterval, difficulty, repetitions) => {
  if (difficulty === DIFFICULTY_LEVELS.FORGOT) {
    // Réinitialiser : revenir au début
    return 1;
  }

  if (difficulty === DIFFICULTY_LEVELS.DIFFICULT) {
    // Réduire l'intervalle de 50%
    return Math.max(1, Math.floor(currentInterval * 0.5));
  }

  // Facteurs de facilité basés sur SM-2
  const easeFactor = {
    [DIFFICULTY_LEVELS.MEDIUM]: 1.5,
    [DIFFICULTY_LEVELS.EASY]: 2.0,
    [DIFFICULTY_LEVELS.PERFECT]: 2.5
  }[difficulty] || 1.5;

  // Première révision : 1 jour
  if (repetitions === 0) return 1;
  
  // Deuxième révision : selon la difficulté
  if (repetitions === 1) {
    return difficulty === DIFFICULTY_LEVELS.PERFECT ? 3 : 2;
  }

  // Révisions suivantes : augmentation exponentielle
  return Math.round(currentInterval * easeFactor);
};

/**
 * Calcule la date de prochaine révision
 * @param {number} intervalDays - Intervalle en jours
 * @returns {Date} Date de prochaine révision
 */
export const calculateNextReviewDate = (intervalDays) => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  nextDate.setHours(9, 0, 0, 0); // 9h du matin
  return nextDate;
};

/**
 * Détermine le statut de révision
 * @param {number} repetitions - Nombre de répétitions
 * @param {number} interval - Intervalle actuel
 * @returns {string} Statut de révision
 */
export const getReviewStatus = (repetitions, interval) => {
  if (repetitions === 0) return REVIEW_STATUS.NEW;
  if (repetitions < 3) return REVIEW_STATUS.LEARNING;
  if (repetitions >= 10 && interval >= 30) return REVIEW_STATUS.MASTERED;
  return REVIEW_STATUS.REVIEWING;
};

/**
 * Vérifie si une sourate doit être révisée aujourd'hui
 * @param {Date} nextReviewDate - Date de prochaine révision
 * @returns {boolean}
 */
export const isDueForReview = (nextReviewDate) => {
  if (!nextReviewDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate <= today;
};

/**
 * Calcule le score de rétention (0-100%)
 * Basé sur le nombre de répétitions et la facilité moyenne
 * @param {number} repetitions - Nombre de répétitions
 * @param {number} averageDifficulty - Difficulté moyenne (0-4)
 * @returns {number} Score de rétention (0-100)
 */
export const calculateRetentionScore = (repetitions, averageDifficulty) => {
  if (repetitions === 0) return 0;
  
  const repetitionScore = Math.min(repetitions * 10, 70); // Max 70% pour les répétitions
  const difficultyScore = (averageDifficulty / 4) * 30; // Max 30% pour la facilité
  
  return Math.min(Math.round(repetitionScore + difficultyScore), 100);
};

/**
 * Obtient un message motivant selon le statut
 * @param {string} status - Statut de révision
 * @returns {string} Message motivant
 */
export const getMotivationalMessage = (status) => {
  const messages = {
    [REVIEW_STATUS.NEW]: "🌱 Nouvelle sourate ! C'est parti pour l'apprendre !",
    [REVIEW_STATUS.LEARNING]: "📚 Continue, tu es en plein apprentissage !",
    [REVIEW_STATUS.REVIEWING]: "🔄 Révise régulièrement pour ancrer la mémorisation !",
    [REVIEW_STATUS.MASTERED]: "🌟 Maîtrisée ! Continue les révisions pour ne jamais oublier !"
  };
  return messages[status] || "💪 Continue comme ça !";
};

/**
 * Obtient les sourates à réviser aujourd'hui
 * @param {Array} surahReviews - Liste des révisions de sourates
 * @returns {Array} Sourates à réviser
 */
export const getSurahsDueToday = (surahReviews) => {
  return surahReviews.filter(review => isDueForReview(review.next_review_date));
};

/**
 * Obtient les statistiques de révision globales
 * @param {Array} surahReviews - Liste des révisions
 * @returns {Object} Statistiques
 */
export const getReviewStats = (surahReviews) => {
  const total = surahReviews.length;
  const dueToday = getSurahsDueToday(surahReviews).length;
  
  const byStatus = {
    new: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0
  };

  surahReviews.forEach(review => {
    const status = getReviewStatus(review.repetitions, review.interval_days);
    byStatus[status]++;
  });

  return {
    total,
    dueToday,
    new: byStatus.new,
    learning: byStatus.learning,
    reviewing: byStatus.reviewing,
    mastered: byStatus.mastered
  };
};

export default {
  DIFFICULTY_LEVELS,
  REVIEW_STATUS,
  calculateNextInterval,
  calculateNextReviewDate,
  getReviewStatus,
  isDueForReview,
  calculateRetentionScore,
  getMotivationalMessage,
  getSurahsDueToday,
  getReviewStats
};