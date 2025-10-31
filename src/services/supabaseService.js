// src/services/supabaseService.js

import { supabase } from '../config/supabase';

export const supabaseService = {
  getUserProgress: async (userId) => {
    const { data, error } = await supabase.from('user_progress').select('*');
    if (error) {
      console.error('Erreur récupération progression:', error);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  },
  
  updateProgress: async (userId, progressData) => {
    const { data, error } = await supabase.from('user_progress')
      .update(progressData)
      .eq('user_id', userId);
    return { data, error };
  },
  
  getSurahProgress: async (userId) => {
    const { data, error } = await supabase.from('surah_progress').select('*');
    if (error) {
      console.error('Erreur récupération sourates:', error);
      return [];
    }
    return data || [];
  },
  
  updateSurahProgress: async (userId, surahId, versesLearned) => {
    const { data, error } = await supabase.from('surah_progress').insert({
      user_id: userId,
      surah_id: surahId,
      verses_learned: versesLearned
    });
    return { data, error };
  }
};