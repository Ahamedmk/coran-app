// src/services/authService.js
// Service d'authentification avec Supabase Auth

import { supabase } from '../config/supabase';

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email, password, name) {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        console.error('Erreur Auth:', authError);
        return { 
          success: false, 
          error: this.getErrorMessage(authError.message) 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Erreur lors de la création du compte' 
        };
      }

      // 2. Créer le profil utilisateur dans la table users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: email,
          name: name,
          onboarding_completed: false,
          streak: 0,
          total_points: 0,
          level: 1,
          daily_goal: 10,
          last_activity_date: new Date().toISOString().split('T')[0]
        }]);

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        // Ne pas bloquer si le profil existe déjà
      }

      // 3. Créer les stats du jour
      await this.createDailyStats(authData.user.id);

      const user = {
        id: authData.user.id,
        email: email,
        name: name,
        onboarding_completed: false
      };

      localStorage.setItem('coran_user', JSON.stringify(user));

      return { 
        success: true, 
        user: user,
        message: 'Compte créé avec succès !' 
      };

    } catch (error) {
      console.error('Erreur signUp:', error);
      return { 
        success: false, 
        error: 'Une erreur est survenue lors de l\'inscription' 
      };
    }
  }

  /**
   * Connexion d'un utilisateur existant
   */
  async signIn(email, password) {
    try {
      // 1. Authentification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Erreur connexion:', authError);
        return { 
          success: false, 
          error: this.getErrorMessage(authError.message) 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Email ou mot de passe incorrect' 
        };
      }

      // 2. Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Erreur récupération profil:', profileError);
        
        // Si le profil n'existe pas, le créer
        if (profileError.code === 'PGRST116') {
          const name = authData.user.user_metadata?.name || 'Utilisateur';
          await supabase.from('users').insert([{
            id: authData.user.id,
            email: email,
            name: name,
            onboarding_completed: false
          }]);
          
          return {
            success: true,
            user: {
              id: authData.user.id,
              email: email,
              name: name,
              onboarding_completed: false
            }
          };
        }
      }

      // 3. Mettre à jour la dernière activité et le streak
      await this.updateStreak(authData.user.id);

      const user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        onboarding_completed: profile.onboarding_completed || false,
        streak: profile.streak || 0,
        total_points: profile.total_points || 0,
        level: profile.level || 1
      };

      localStorage.setItem('coran_user', JSON.stringify(user));

      return { 
        success: true, 
        user: user 
      };

    } catch (error) {
      console.error('Erreur signIn:', error);
      return { 
        success: false, 
        error: 'Une erreur est survenue lors de la connexion' 
      };
    }
  }

  /**
   * Déconnexion
   */
  async signOut() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('coran_user');
      return { success: true };
    } catch (error) {
      console.error('Erreur signOut:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser() {
    const userString = localStorage.getItem('coran_user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifier la session Supabase
   */
  async checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Erreur checkSession:', error);
      return null;
    }
  }

  /**
   * Compléter l'onboarding
   */
  async completeOnboarding(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur completeOnboarding:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour le streak
   */
  async updateStreak(userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('last_activity_date, streak')
        .eq('id', userId)
        .single();

      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = user.last_activity_date;

      let newStreak = user.streak || 0;

      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Jour consécutif
          newStreak += 1;
        } else if (diffDays > 1) {
          // Streak cassé
          newStreak = 1;
        }
        // Si diffDays === 0, même jour, on ne change rien
      } else {
        newStreak = 1;
      }

      await supabase
        .from('users')
        .update({
          last_activity_date: today,
          streak: newStreak
        })
        .eq('id', userId);

      return newStreak;
    } catch (error) {
      console.error('Erreur updateStreak:', error);
      return 0;
    }
  }

  /**
   * Créer les stats du jour
   */
  async createDailyStats(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('daily_stats')
        .insert([{
          user_id: userId,
          date: today,
          verses_learned: 0,
          reviews_completed: 0,
          points_earned: 0
        }]);
    } catch (error) {
      // Ignorer si existe déjà
      console.log('Stats du jour déjà créées');
    }
  }

  /**
   * Récupérer le profil complet
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur getUserProfile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour les points et le niveau
   */
  async updatePoints(userId, pointsToAdd) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('total_points, level')
        .eq('id', userId)
        .single();

      const newPoints = (user.total_points || 0) + pointsToAdd;
      const newLevel = Math.floor(newPoints / 500) + 1;

      await supabase
        .from('users')
        .update({
          total_points: newPoints,
          level: newLevel
        })
        .eq('id', userId);

      return { success: true, newPoints, newLevel };
    } catch (error) {
      console.error('Erreur updatePoints:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) throw error;
      return { 
        success: true, 
        message: 'Email de réinitialisation envoyé' 
      };
    } catch (error) {
      console.error('Erreur resetPassword:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.message) 
      };
    }
  }

  /**
   * Traduire les messages d'erreur
   */
  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'User already registered': 'Cet email est déjà utilisé',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Unable to validate email address: invalid format': 'Format d\'email invalide',
      'Email not confirmed': 'Veuillez confirmer votre email',
      'Invalid email or password': 'Email ou mot de passe incorrect'
    };

    return errorMessages[error] || error;
  }
}

export const authService = new AuthService();