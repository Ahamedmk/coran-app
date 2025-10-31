// src/services/authService.js
// Service d'authentification avec Supabase

import { supabase } from '../config/supabase';

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  signUp: async (email, password, name) => {
    try {
      // Utiliser toujours le même ID pour les tests
      const userId = '00000000-0000-0000-0000-000000000001';
      
      const userData = {
        id: userId,
        email: email,
        name: name,
        created_at: new Date().toISOString(),
        onboarding_completed: false
      };

      localStorage.setItem('coran_user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur inscription:', error);
      return { success: false, error };
    }
  },

  /**
   * Connexion
   */
  signIn: async (email, password) => {
    try {
      // Toujours retourner l'utilisateur de test
      const userData = {
        id: '00000000-0000-0000-0000-000000000001',
        email: email,
        name: 'Utilisateur Test',
        onboarding_completed: false
      };
      
      localStorage.setItem('coran_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur connexion:', error);
      return { success: false, error };
    }
  },

  /**
   * Déconnexion - AJOUT MANQUANT
   */
  signOut: async () => {
    try {
      localStorage.removeItem('coran_user');
      return { success: true };
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      return { success: false, error };
    }
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('coran_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  },

  /**
   * Marquer l'onboarding comme complété
   */
  completeOnboarding: async (userId) => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        user.onboarding_completed = true;
        localStorage.setItem('coran_user', JSON.stringify(user));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur onboarding:', error);
      return { success: false, error };
    }
  },

  /**
   * Initialiser la progression d'un nouvel utilisateur
   */
  initializeUserProgress: async (userId) => {
    try {
      const initialProgress = {
        user_id: userId,
        streak: 0,
        total_verses: 6236,
        learned_verses: 0,
        points: 0,
        level: 1,
        daily_goal: 10,
        today_progress: 0,
        created_at: new Date().toISOString()
      };

      // Sauvegarder dans Supabase
      const { error } = await supabase.from('user_progress').insert(initialProgress);
      
      if (error) {
        console.error('Erreur Supabase:', error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erreur initialisation:', error);
      return { success: false, error };
    }
  },

  /**
   * Réinitialiser la progression (nouveau compte)
   */
  resetProgress: async (userId) => {
    try {
      // Supprimer toutes les données de l'utilisateur
      const deleteResult1 = await supabase.from('user_progress').delete();
      await deleteResult1.eq('user_id', userId);
      
      const deleteResult2 = await supabase.from('surah_progress').delete();
      await deleteResult2.eq('user_id', userId);
      
      const deleteResult3 = await supabase.from('surah_reviews').delete();
      await deleteResult3.eq('user_id', userId);
      
      const deleteResult4 = await supabase.from('review_history').delete();
      await deleteResult4.eq('user_id', userId);
      
      // Réinitialiser
      await authService.initializeUserProgress(userId);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      return { success: false, error };
    }
  }
};

export default authService;