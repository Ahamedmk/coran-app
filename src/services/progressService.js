// src/services/progressService.js
// Service pour gérer la progression des utilisateurs dans Supabase

import { supabase } from '../config/supabase';

class ProgressService {
  /**
   * Charger toute la progression de l'utilisateur
   */
  async loadUserProgress(userId) {
    try {
      // 1) Profil user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, streak, total_points, level, daily_goal')
        .eq('id', userId)
        .maybeSingle();
      if (userError) throw userError;

      // 2) Progression par sourate
      const { data: surahProgress, error: progressError } = await supabase
        .from('surah_progress')
        .select('surah_id, verses_learned, is_completed')
        .eq('user_id', userId);
      if (progressError) throw progressError;

      // 3) Stats du jour (crée si absentes)
      const today = new Date().toISOString().split('T')[0];
      let { data: todayStats, error: statsError } = await supabase
        .from('daily_stats')
        .select('user_id, date, verses_learned, reviews_completed, points_earned')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      if (!todayStats) {
        const { data: newStats, error: insertErr } = await supabase
          .from('daily_stats')
          .insert([{ user_id: userId, date: today, verses_learned: 0, reviews_completed: 0, points_earned: 0 }])
          .select()
          .maybeSingle();
        if (insertErr) throw insertErr;
        todayStats = newStats;
      }

      // Agrégats
      const totalVerses = (surahProgress || []).reduce((sum, sp) => sum + (sp.verses_learned || 0), 0);

      // Structures pour l’UI
      const verseProgress = {};
      (surahProgress || []).forEach(sp => {
        verseProgress[sp.surah_id] = sp.verses_learned || 0;
      });

      const learnedSurahs = (surahProgress || [])
        .filter(sp => sp.is_completed === true)
        .map(sp => sp.surah_id);

      return {
        success: true,
        userProgress: {
          streak: user?.streak || 0,
          totalVerses: 6236,
          learnedVerses: totalVerses,
          points: user?.total_points || 0,
          level: user?.level || 1,
          dailyGoal: user?.daily_goal || 10,
          todayProgress: todayStats?.verses_learned || 0
        },
        verseProgress,
        learnedSurahs
      };
    } catch (error) {
      console.error('Erreur loadUserProgress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sauvegarder qu'un verset a été appris
   */
  async learnVerse(userId, surahId, surahTotalVerses) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1) Récupérer (ou créer) la ligne de progression pour la sourate
      const { data: existing, error: fetchErr } = await supabase
        .from('surah_progress')
        .select('id, verses_learned, is_completed')
        .eq('user_id', userId)
        .eq('surah_id', surahId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      let newVersesLearned = 1;
      let isCompleted = false;

      if (!existing) {
        // Créer la progression (sans last_verse_date / total_verses)
        const { data: inserted, error: insErr } = await supabase
          .from('surah_progress')
          .insert([{ user_id: userId, surah_id: surahId, verses_learned: 1, is_completed: false }])
          .select('verses_learned, is_completed')
          .maybeSingle();
        if (insErr) throw insErr;
        newVersesLearned = inserted?.verses_learned ?? 1;
        isCompleted = inserted?.is_completed ?? false;
      } else {
        // Incrémenter
        newVersesLearned = (existing.verses_learned || 0) + 1;
        isCompleted = newVersesLearned >= (surahTotalVerses || 0);

        const { error: updErr } = await supabase
          .from('surah_progress')
          .update({ verses_learned: newVersesLearned, is_completed: isCompleted })
          .eq('user_id', userId)
          .eq('surah_id', surahId);
        if (updErr) throw updErr;
      }

      // 2) Points & niveau utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('total_points, level')
        .eq('id', userId)
        .maybeSingle();

      const newPoints = (user?.total_points || 0) + 20;
      const newLevel = Math.floor(newPoints / 500) + 1;

      const { error: userUpdErr } = await supabase
        .from('users')
        .update({ total_points: newPoints, level: newLevel })
        .eq('id', userId);
      if (userUpdErr) throw userUpdErr;

      // 3) Stat du jour: +1 verset appris & +20 points
      const { data: statsRow } = await supabase
        .from('daily_stats')
        .select('verses_learned, points_earned')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (statsRow) {
        const { error: statsUpdErr } = await supabase
          .from('daily_stats')
          .update({
            verses_learned: (statsRow.verses_learned || 0) + 1,
            points_earned: (statsRow.points_earned || 0) + 20
          })
          .eq('user_id', userId)
          .eq('date', today);
        if (statsUpdErr) throw statsUpdErr;
      }

      return {
        success: true,
        newVersesLearned,
        isCompleted,
        newPoints,
        newLevel
      };
    } catch (error) {
      console.error('Erreur learnVerse:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Comptabiliser une révision (daily_stats)
   */
  async addReviewResult(userId, gainedPoints = 0) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: row, error: selErr } = await supabase
        .from('daily_stats')
        .select('reviews_completed, points_earned')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      if (selErr) throw selErr;

      if (!row) {
        const { error: insErr } = await supabase
          .from('daily_stats')
          .insert([{ user_id: userId, date: today, verses_learned: 0, reviews_completed: 1, points_earned: gainedPoints || 0 }]);
        if (insErr) throw insErr;
        return { success: true };
      }

      const { error: updErr } = await supabase
        .from('daily_stats')
        .update({
          reviews_completed: (row.reviews_completed || 0) + 1,
          points_earned: (row.points_earned || 0) + (gainedPoints || 0)
        })
        .eq('user_id', userId)
        .eq('date', today);
      if (updErr) throw updErr;

      return { success: true };
    } catch (error) {
      console.error('Erreur addReviewResult:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer la progression d'une sourate
   */
  async getSurahProgress(userId, surahId) {
    try {
      const { data, error } = await supabase
        .from('surah_progress')
        .select('verses_learned, is_completed')
        .eq('user_id', userId)
        .eq('surah_id', surahId)
        .maybeSingle();

      if (!data && !error) return { success: true, versesLearned: 0, completed: false };
      if (error) throw error;

      return { success: true, versesLearned: data.verses_learned || 0, completed: !!data.is_completed };
    } catch (error) {
      console.error('Erreur getSurahProgress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir toutes les sourates complétées
   */
  async getCompletedSurahs(userId) {
    try {
      const { data, error } = await supabase
        .from('surah_progress')
        .select('surah_id')
        .eq('user_id', userId)
        .eq('is_completed', true);
      if (error) throw error;

      return { success: true, completedSurahs: (data || []).map(s => s.surah_id) };
    } catch (error) {
      console.error('Erreur getCompletedSurahs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour l'objectif quotidien
   */
  async updateDailyGoal(userId, newGoal) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ daily_goal: newGoal })
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur updateDailyGoal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stats globales
   */
  async getGlobalStats(userId) {
    try {
      const { data: progressData } = await supabase
        .from('surah_progress')
        .select('verses_learned, is_completed')
        .eq('user_id', userId);

      const totalVerses = progressData?.reduce((sum, p) => sum + (p.verses_learned || 0), 0) || 0;
      const completedCount = progressData?.filter(p => p.is_completed === true).length || 0;

      const { data: reviewsData } = await supabase
        .from('surah_reviews')
        .select('total_reviews')
        .eq('user_id', userId);

      const totalReviews = reviewsData?.reduce((sum, r) => sum + (r.total_reviews || 0), 0) || 0;

      return { success: true, stats: { totalVerses, completedSurahs: completedCount, totalReviews } };
    } catch (error) {
      console.error('Erreur getGlobalStats:', error);
      return { success: false, error: error.message };
    }
  }
}

export const progressService = new ProgressService();
