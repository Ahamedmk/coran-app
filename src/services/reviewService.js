// Lecture des stats depuis Supabase (table: public.review_history)
import { supabase } from '../config/supabase';

export async function getReviewHistory(userId, { surahId } = {}) {
  if (!userId) return { data: [], error: null };

  let query = supabase
    .from('review_history')
    .select('*')
    .eq('user_id', userId)
    .order('review_date', { ascending: true });

  if (surahId) {
    query = query.eq('surah_id', surahId);
  }

  // ✅ CORRECTION : Ajout de await devant query
  const { data, error } = await query;
  
  return { data: data || [], error };
}

export function summarize(history) {
  if (!history?.length) return { total: 0, avgDifficulty: 0, avgInterval: 0, lastReview: null };
  const total = history.length;
  const avgDifficulty = history.reduce((s, r) => s + (r.difficulty ?? 0), 0) / total;
  const avgInterval  = history.reduce((s, r) => s + (r.interval_after ?? 0), 0) / total;
  return {
    total,
    avgDifficulty: +avgDifficulty.toFixed(2),
    avgInterval: +avgInterval.toFixed(1),
    lastReview: history[history.length - 1]?.review_date || null,
  };
}

export function distinctSurahs(history) {
  return Array.from(new Set(history.map(h => h.surah_id).filter(Boolean))).sort((a,b)=>a-b);
}