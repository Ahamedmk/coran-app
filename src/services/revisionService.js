// src/services/revisionService.js
// Service pour gérer les révisions avec Supabase

import { supabase } from '../config/supabase';
import {
  calculateNextInterval,
  calculateNextReviewDate,
  getReviewStatus,
  REVIEW_STATUS,
  calculateRetentionScore, // si inutilisé chez toi, tu peux le retirer
} from './revisionSystem';

// --- Helper: récupérer UNE révision pour un user/sourate
async function fetchReview(userId, surahId) {
  const { data, error } = await supabase
    .from('surah_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('surah_id', surahId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export const revisionService = {
  /**
   * Récupérer toutes les révisions d'un utilisateur
   */
  async getUserReviews(userId) {
    try {
      const { data, error } = await supabase
        .from('surah_reviews')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur récupération révisions:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Erreur getUserReviews:', err);
      return [];
    }
  },

  /**
   * Récupérer les révisions dues aujourd'hui
   */
  async getDueReviews(userId) {
    try {
      const all = await this.getUserReviews(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return all.filter((r) => {
        const d = new Date(r.next_review_date);
        d.setHours(0, 0, 0, 0);
        return d <= today;
      });
    } catch (err) {
      console.error('Erreur getDueReviews:', err);
      return [];
    }
  },

  /**
   * Créer une nouvelle révision quand une sourate est complétée
   */
  async createReview(userId, surahId) {
    try {
      const existing = await fetchReview(userId, surahId);
      if (existing) {
        return { success: true, message: 'Already exists' };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const payload = {
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
        status: REVIEW_STATUS.NEW,
      };

      const { data, error } = await supabase
        .from('surah_reviews')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur création révision:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Erreur createReview:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Mettre à jour une révision après avoir révisé
   */
  async updateReview(userId, surahId, difficulty) {
    try {
      // 1) Révision courante
      const current = await fetchReview(userId, surahId);
      if (!current) return { success: false, error: 'Révision non trouvée' };

      // 2) Calculs
      const newInterval = calculateNextInterval(
        current.interval_days,
        difficulty,
        current.repetitions
      );
      const nextReviewDate = calculateNextReviewDate(newInterval);

      let newEase = current.ease_factor || 2.5;
      if (difficulty >= 2) {
        const q = difficulty;
        newEase = Math.max(
          1.3,
          newEase + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
        );
      } else {
        newEase = Math.max(1.3, newEase - 0.2);
      }

      const newReps = difficulty >= 2 ? (current.repetitions || 0) + 1 : 0;
      const newTotalReviews = (current.total_reviews || 0) + 1;
      const newPerfect = (current.perfect_count || 0) + (difficulty === 4 ? 1 : 0);
      const newForgot = (current.forgot_count || 0) + (difficulty === 0 ? 1 : 0);

      const newAvgDiff =
        (((current.average_difficulty || 0) * (current.total_reviews || 0)) + difficulty) /
        newTotalReviews;

      const newStatus = getReviewStatus(newReps, newInterval);

      const updateData = {
        repetitions: newReps,
        interval_days: newInterval,
        ease_factor: parseFloat(newEase.toFixed(2)),
        last_review_date: new Date().toISOString(),
        next_review_date: nextReviewDate.toISOString(),
        average_difficulty: parseFloat(newAvgDiff.toFixed(2)),
        total_reviews: newTotalReviews,
        perfect_count: newPerfect,
        forgot_count: newForgot,
        status: newStatus,
      };

      // 3) CORRECTION : filtres AVANT l'attente
      const { data, error } = await supabase
        .from('surah_reviews')
        .update(updateData)
        .match({ id: current.id, user_id: userId })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur mise à jour révision:', error);
        return { success: false, error };
      }

      // 4) Historique
      await this.addToHistory(
        userId,
        surahId,
        difficulty,
        current.interval_days,
        newInterval
      );

      return {
        success: true,
        data,
        nextReviewDate,
        newInterval,
      };
    } catch (err) {
      console.error('Erreur updateReview:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Réinitialiser une révision (recommencer depuis le début)
   */
  async resetReview(userId, surahId) {
    try {
      const review = await fetchReview(userId, surahId);
      if (!review) return { success: false, error: 'Révision non trouvée' };

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const resetData = {
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_date: tomorrow.toISOString(),
        status: REVIEW_STATUS.NEW,
      };

      const { data, error } = await supabase
        .from('surah_reviews')
        .update(resetData)
        .match({ id: review.id, user_id: userId })
        .select()
        .maybeSingle();

      if (error) return { success: false, error };
      return { success: true, data };
    } catch (err) {
      console.error('Erreur resetReview:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Ajouter une entrée d'historique
   */
  async addToHistory(userId, surahId, difficulty, intervalBefore, intervalAfter) {
    try {
      const payload = {
        user_id: userId,
        surah_id: surahId,
        difficulty,
        interval_before: intervalBefore,
        interval_after: intervalAfter,
        review_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('review_history')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur ajout historique:', error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Erreur addToHistory:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Obtenir l'historique pour une sourate
   */
  async getReviewHistory(userId, surahId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('review_history')
        .select('*')
        .eq('user_id', userId)
        .eq('surah_id', surahId)
        .order('review_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur historique:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Erreur getReviewHistory:', err);
      return [];
    }
  },

  /**
   * Obtenir des statistiques globales sur les révisions
   */
  async getReviewStats(userId) {
    try {
      const reviews = await this.getUserReviews(userId);
      if (!reviews || reviews.length === 0) {
        return {
          total: 0,
          dueToday: 0,
          learning: 0,
          reviewing: 0,
          mastered: 0,
          averageDifficulty: 0,
          totalReviewsDone: 0,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueToday = reviews.filter((r) => {
        const d = new Date(r.next_review_date);
        d.setHours(0, 0, 0, 0);
        return d <= today;
      }).length;

      return {
        total: reviews.length,
        dueToday,
        learning: reviews.filter((r) => r.status === REVIEW_STATUS.LEARNING).length,
        reviewing: reviews.filter((r) => r.status === REVIEW_STATUS.REVIEWING).length,
        mastered: reviews.filter((r) => r.status === REVIEW_STATUS.MASTERED).length,
        averageDifficulty:
          reviews.reduce((s, r) => s + (r.average_difficulty || 0), 0) / reviews.length,
        totalReviewsDone: reviews.reduce((s, r) => s + (r.total_reviews || 0), 0),
      };
    } catch (err) {
      console.error('Erreur getReviewStats:', err);
      return {
        total: 0,
        dueToday: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
        averageDifficulty: 0,
        totalReviewsDone: 0,
      };
    }
  },
};

export default revisionService;
