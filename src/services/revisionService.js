// src/services/revisionService.js
// Service pour gérer les révisions avec Supabase


import { supabase } from '../config/supabase';
import { 
  calculateNextInterval, 
  calculateNextReviewDate,
  getReviewStatus,
  REVIEW_STATUS,
  calculateRetentionScore
} from './revisionSystem';

export const revisionService = {
  /**
   * Récupérer toutes les révisions d'un utilisateur
   */
  getUserReviews: async (userId) => {
    try {
      const { data, error } = await supabase.from('surah_reviews').select('*');
      
      if (error) {
        console.error('Erreur récupération révisions:', error);
        return [];
      }
      
      // Filtrer par user_id côté client (car notre supabase custom ne supporte pas les filtres avancés)
      const userReviews = data ? data.filter(r => r.user_id === userId) : [];
      return userReviews;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  /**
   * Récupérer les révisions dues aujourd'hui
   */
  getDueReviews: async (userId) => {
    try {
      const allReviews = await revisionService.getUserReviews(userId);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      return allReviews.filter(review => {
        const nextReview = new Date(review.next_review_date);
        nextReview.setHours(0, 0, 0, 0);
        return nextReview <= now;
      });
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  /**
   * Créer une nouvelle révision quand une sourate est complétée
   */
  createReview: async (userId, surahId) => {
    try {
      // Vérifier si la révision existe déjà
      const existing = await revisionService.getUserReviews(userId);
      if (existing.find(r => r.surah_id === surahId)) {
        console.log('Révision déjà existante pour cette sourate');
        return { success: true, message: 'Already exists' };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const reviewData = {
        user_id: userId,
        surah_id: surahId,
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        last_review_date: new Date().toISOString(),
        next_review_date: tomorrow.toISOString(),
        average_difficulty: 2.0,
        total_reviews: 0,
        perfect_count: 0,
        forgot_count: 0,
        status: REVIEW_STATUS.NEW
      };

      const { data, error } = await supabase.from('surah_reviews').insert(reviewData);

      if (error) {
        console.error('Erreur création révision:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
  },

  /**
   * Mettre à jour une révision après avoir révisé
   */
  updateReview: async (userId, surahId, difficulty) => {
    try {
      // Récupérer la révision actuelle
      const allReviews = await revisionService.getUserReviews(userId);
      const currentReview = allReviews.find(r => r.surah_id === surahId);

      if (!currentReview) {
        console.error('Révision non trouvée');
        return { success: false, error: 'Révision non trouvée' };
      }

      // Calculer le nouvel intervalle en utilisant revisionSystem
      const newInterval = calculateNextInterval(
        currentReview.interval_days,
        difficulty,
        currentReview.repetitions
      );

      // Calculer la prochaine date de révision
      const nextReviewDate = calculateNextReviewDate(newInterval);

      // Calculer le nouveau ease_factor (SM-2)
      let newEaseFactor = currentReview.ease_factor || 2.5;
      if (difficulty >= 2) {
        const q = difficulty;
        newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)));
      } else {
        newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
      }

      // Mettre à jour les compteurs
      const newRepetitions = difficulty >= 2 ? currentReview.repetitions + 1 : 0;
      const newTotalReviews = currentReview.total_reviews + 1;
      const newPerfectCount = currentReview.perfect_count + (difficulty === 4 ? 1 : 0);
      const newForgotCount = currentReview.forgot_count + (difficulty === 0 ? 1 : 0);

      // Calculer la nouvelle difficulté moyenne
      const newAverageDifficulty = (
        (currentReview.average_difficulty * currentReview.total_reviews) + difficulty
      ) / newTotalReviews;

      // Déterminer le nouveau statut en utilisant revisionSystem
      const newStatus = getReviewStatus(newRepetitions, newInterval);

      // Données à mettre à jour
      const updateData = {
        repetitions: newRepetitions,
        interval_days: newInterval,
        ease_factor: parseFloat(newEaseFactor.toFixed(2)),
        last_review_date: new Date().toISOString(),
        next_review_date: nextReviewDate.toISOString(),
        average_difficulty: parseFloat(newAverageDifficulty.toFixed(2)),
        total_reviews: newTotalReviews,
        perfect_count: newPerfectCount,
        forgot_count: newForgotCount,
        status: newStatus
      };

      // Mettre à jour dans Supabase
      // Notre client custom nécessite une approche différente
      const updateResult = await supabase.from('surah_reviews').update(updateData);
      const { data, error } = await updateResult.eq('id', currentReview.id);

      if (error) {
        console.error('Erreur mise à jour révision:', error);
        return { success: false, error };
      }

      // Ajouter dans l'historique
      await revisionService.addToHistory(
        userId,
        surahId,
        difficulty,
        currentReview.interval_days,
        newInterval
      );

      return { 
        success: true, 
        data: updateData,
        nextReviewDate: nextReviewDate,
        newInterval: newInterval
      };
    } catch (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
  },

  /**
   * Ajouter une entrée dans l'historique des révisions
   */
  addToHistory: async (userId, surahId, difficulty, intervalBefore, intervalAfter) => {
    try {
      const historyData = {
        user_id: userId,
        surah_id: surahId,
        difficulty: difficulty,
        interval_before: intervalBefore,
        interval_after: intervalAfter,
        review_date: new Date().toISOString()
      };

      const { data, error } = await supabase.from('review_history').insert(historyData);

      if (error) {
        console.error('Erreur ajout historique:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
  },

  /**
   * Obtenir l'historique des révisions d'une sourate
   */
  getReviewHistory: async (userId, surahId, limit = 10) => {
    try {
      const { data, error } = await supabase.from('review_history').select('*');
      
      if (error) {
        console.error('Erreur historique:', error);
        return [];
      }

      // Filtrer et trier côté client
      const history = data
        ? data
            .filter(h => h.user_id === userId && h.surah_id === surahId)
            .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))
            .slice(0, limit)
        : [];

      return history;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  /**
   * Obtenir les statistiques de révision globales
   */
  getReviewStats: async (userId) => {
    try {
      const reviews = await revisionService.getUserReviews(userId);
      
      if (!reviews || reviews.length === 0) {
        return {
          total: 0,
          dueToday: 0,
          learning: 0,
          reviewing: 0,
          mastered: 0,
          averageDifficulty: 0,
          totalReviewsDone: 0
        };
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const stats = {
        total: reviews.length,
        dueToday: reviews.filter(r => {
          const nextReview = new Date(r.next_review_date);
          nextReview.setHours(0, 0, 0, 0);
          return nextReview <= now;
        }).length,
        learning: reviews.filter(r => r.status === REVIEW_STATUS.LEARNING).length,
        reviewing: reviews.filter(r => r.status === REVIEW_STATUS.REVIEWING).length,
        mastered: reviews.filter(r => r.status === REVIEW_STATUS.MASTERED).length,
        averageDifficulty: reviews.reduce((sum, r) => sum + (r.average_difficulty || 0), 0) / reviews.length,
        totalReviewsDone: reviews.reduce((sum, r) => sum + (r.total_reviews || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Erreur:', error);
      return {
        total: 0,
        dueToday: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
        averageDifficulty: 0,
        totalReviewsDone: 0
      };
    }
  },

  /**
   * Réinitialiser une révision (recommencer depuis le début)
   */
  resetReview: async (userId, surahId) => {
    try {
      const allReviews = await revisionService.getUserReviews(userId);
      const review = allReviews.find(r => r.surah_id === surahId);
      
      if (!review) {
        return { success: false, error: 'Révision non trouvée' };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const resetData = {
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_date: tomorrow.toISOString(),
        status: REVIEW_STATUS.NEW
      };

      const updateResult = await supabase.from('surah_reviews').update(resetData);
      const { data, error } = await updateResult.eq('id', review.id);

      if (error) {
        console.error('Erreur réinitialisation:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
  }
};

export default revisionService;