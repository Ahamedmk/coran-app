import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { RefreshCcw, BarChart3, BookOpen, TrendingUp, CalendarClock } from 'lucide-react';
import { getReviewHistory, summarize, distinctSurahs } from '../services/reviewService';
import { quranAPI } from '../services/quranAPI';
import { DifficultyChart, IntervalChart, DifficultyDistributionChart, RetentionChart } from '../components/ReviewCharts';

const Card = ({ children, className='' }) => (
  <div className={`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 ${className}`} style={{padding:'1rem'}}>
    {children}
  </div>
);

export default function StatsPage({ userId }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [filterSurahId, setFilterSurahId] = useState(null);
  const [surahList, setSurahList] = useState([]);

  useEffect(() => {
    (async () => { 
      const surahs = await quranAPI.getAllSurahs();
      setSurahList(surahs || []); 
    })();
  }, []);

  // ✅ Utilisation de useCallback pour éviter les re-créations inutiles
  const load = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await getReviewHistory(userId, { 
        surahId: filterSurahId || undefined 
      });
      
      if (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setHistory([]);
      } else {
        setHistory(data || []);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [userId, filterSurahId]);

  // ✅ Maintenant load est dans les dépendances
  useEffect(() => { 
    load(); 
  }, [load]);

  const summary = useMemo(() => summarize(history), [history]);
  
  const surahName = useCallback((id) => {
    const s = surahList.find(x => x.number === id);
    return s ? `${s.englishName} (${s.name})` : `Sourate ${id}`;
  }, [surahList]);

  return (
    <div className="space-y-6" style={{width:'100%', maxWidth:'100vw', overflowX:'hidden'}}>
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-300" />
            <div>
              <h1 className="text-2xl font-bold">Statistiques de Révision</h1>
              <p className="text-white/70 text-sm">Analyse tes progrès et ta rétention.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-white/70" />
            <select
              value={filterSurahId || ''}
              onChange={(e)=>setFilterSurahId(e.target.value ? Number(e.target.value) : null)}
              style={{
                minWidth: 240,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="" style={{background: '#1f2937', color: '#fff'}}>
                Toutes les sourates
              </option>
              {distinctSurahs(history).map(id=>(
                <option key={id} value={id} style={{background: '#1f2937', color: '#fff'}}>
                  {surahName(id)}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              disabled={loading}
              style={{
                display:'flex',
                alignItems:'center',
                gap:'0.5rem',
                padding:'0.5rem 0.8rem',
                borderRadius:'0.5rem',
                background:'rgba(59,130,246,0.2)',
                border:'1px solid rgba(59,130,246,0.35)',
                color:'#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
              Actualiser
            </button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-white/60">Total révisions</div>
          <div className="text-3xl font-bold">{summary.total}</div>
        </Card>
        <Card>
          <div className="text-sm text-white/60">Difficulté moyenne (0–4)</div>
          <div className="text-3xl font-bold">{summary.avgDifficulty}</div>
        </Card>
        <Card>
          <div className="text-sm text-white/60">Intervalle moyen (j)</div>
          <div className="text-3xl font-bold">{summary.avgInterval}</div>
        </Card>
        <Card>
          <div className="text-sm text-white/60">Dernière révision</div>
          <div className="text-xl font-semibold">
            {summary.lastReview ? new Date(summary.lastReview).toLocaleDateString('fr-FR') : '—'}
          </div>
        </Card>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-pulse">Chargement des graphiques…</div>
          </div>
        </Card>
      ) : history.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-white/70">
            {userId ? 'Aucune donnée pour l\'instant.' : 'Veuillez vous connecter.'}
          </div>
        </Card>
      ) : (
        <>
          <DifficultyChart reviewHistory={history} />
          <IntervalChart reviewHistory={history} />
          <DifficultyDistributionChart reviewHistory={history} />
          <RetentionChart reviewHistory={history} />
        </>
      )}

      <Card>
        <div className="flex items-center gap-2">
          <TrendingUp className="text-green-300" />
          <p className="text-white/80 text-sm">
            Tip : vise une difficulté moyenne ≥ 3 et des intervalles qui montent (7 → 14 → 30 → 60 → 90 j).
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <CalendarClock className="text-amber-300" />
          <p className="text-white/60 text-xs">
            Basé sur <code>public.review_history</code>. Enregistre chaque révision pour des stats fiables.
          </p>
        </div>
      </Card>
    </div>
  );
}