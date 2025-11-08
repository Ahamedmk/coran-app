// src/pages/SurahSelectionPage.jsx
// Page pour choisir une sourate à apprendre – AVEC ruban "DÉJÀ APPRISE" et recherche par numéro

import React, { useState } from 'react';
import { Search, Filter, BookOpen, CheckCircle, Star, Zap } from 'lucide-react';
import { reciterService } from '../services/reciterService';

const SurahSelectionPage = ({ surahs, learnedSurahs, onSelectSurah, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  // nouveau : on montre tout par défaut, on peut masquer les mémorisées
  const [hideLearned, setHideLearned] = useState(false);

  // --- helpers difficulté ---
  const getDifficulty = (verses) => {
    if (verses <= 10) return 'facile';
    if (verses <= 50) return 'moyen';
    return 'difficile';
  };

  const getDifficultyColor = (verses) => {
    if (verses <= 10) return 'bg-green-500';
    if (verses <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyLabel = (verses) => {
    if (verses <= 10) return 'Facile';
    if (verses <= 50) return 'Moyen';
    return 'Avancé';
  };

  // --- filtrage ---
  const filteredSurahs = surahs.filter((surah) => {
    const term = searchTerm.trim();
    const isNumber = /^\d+$/.test(term);

    const matchesSearch =
      term.length === 0
        ? true
        : isNumber
        ? surah.number === parseInt(term, 10)
        : (
            surah.englishName.toLowerCase().includes(term.toLowerCase()) ||
            (surah.englishNameTranslation || '').toLowerCase().includes(term.toLowerCase()) ||
            (surah.name || '').includes(term)
          );

    const difficulty = getDifficulty(surah.numberOfAyahs);
    const matchesDifficulty = difficultyFilter === 'all' || difficulty === difficultyFilter;

    const isLearned = learnedSurahs.includes(surah.number);
    // on montre tout; si "masquer mémorisées" activé, on retire celles mémorisées
    const matchesLearnedFilter = hideLearned ? !isLearned : true;

    return matchesSearch && matchesDifficulty && matchesLearnedFilter;
  });

  // Recommandations (premières sourates faciles non apprises)
  const recommendedSurahs = surahs
    .filter((s) => getDifficulty(s.numberOfAyahs) === 'facile' && !learnedSurahs.includes(s.number))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* keyframes pour l'animation du ruban */}
      <style>{`
        @keyframes ribbonGlow {
          0% { filter: drop-shadow(0 0 0px rgba(236, 72, 153, 0.0)); }
          50% { filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.45)); }
          100% { filter: drop-shadow(0 0 0px rgba(236, 72, 153, 0.0)); }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            transition: 'all 0.3s',
            color: 'white',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)')}
        >
          <span className="text-2xl">←</span>
          <span>Retour</span>
        </button>

        <h1 className="text-3xl font-bold mb-2">Choisis ta Sourate</h1>
        <p className="text-white/70">
          Sélectionne la sourate que tu veux mémoriser. Tu peux aussi taper son <b>numéro</b> (ex. « 36 » →
          Yā-Sīn).
        </p>
      </div>

      {/* Recommandations */}
      {recommendedSurahs.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Star className="text-yellow-400" />
            Recommandations pour débuter
          </h2>
          <p className="text-white/70 text-sm mb-4">Commence par ces sourates courtes et faciles !</p>

          <div className="grid md:grid-cols-3 gap-4">
            {recommendedSurahs.map((surah) => {
              const pages = reciterService.getSurahPages(surah);
              return (
                <div
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className="bg-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-all hover:scale-105 border border-white/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl mb-2">{surah.name}</div>
                    <Zap className="text-yellow-400 w-5 h-5" />
                  </div>
                  <div className="font-bold mb-1">{surah.englishName}</div>
                  <div className="text-sm text-white/60">{surah.numberOfAyahs} versets • Facile</div>
                  <div className="text-xs text-white/50 mt-1">📄 Pages {pages.startPage}-{pages.endPage}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recherche (texte OU numéro) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une sourate… (nom, traduction, ou nº ex. 36)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Sélecteur de difficulté stylisé */}
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/20 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
            >
              <option value="all">Toutes difficultés</option>
              <option value="facile">✅ Facile (≤10 versets)</option>
              <option value="moyen">⚡ Moyen (11–50 versets)</option>
              <option value="difficile">🔥 Avancé (&gt;50 versets)</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none transition-transform duration-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {/* Masquer / afficher mémorisées */}
          <button
            onClick={() => setHideLearned((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(233, 225, 241, 0.2)',
              border: '1px solid rgba(14, 3, 24, 0.3)',
              transition: 'all 0.3s',
              color: 'white',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)')}
          >
            {hideLearned ? (
              <>
                <CheckCircle className="inline mr-2 w-5 h-5" />
                Afficher les mémorisées
              </>
            ) : (
              <>
                <BookOpen className="inline mr-2 w-5 h-5" />
                Masquer les mémorisées
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {filteredSurahs.length} sourate{filteredSurahs.length > 1 ? 's' : ''} trouvée
            {filteredSurahs.length > 1 ? 's' : ''}
          </h2>
          <Filter className="text-white/50 w-5 h-5" />
        </div>

        {filteredSurahs.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="text-6xl mb-4">🔍</div>
            <p>Aucune sourate trouvée avec ces critères</p>
          </div>
        ) : (
          <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredSurahs.map((surah) => {
              const isLearned = learnedSurahs.includes(surah.number);
              const pages = reciterService.getSurahPages(surah);

              return (
                <div
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className={`relative rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.02] border ${
                    isLearned ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
{isLearned && (
  <div
    style={{
      position: 'absolute',
      right: '-18px',                        // rapproché du bord
      top: '42%',                            // position verticale
      width: '180px',                        // ⬅️ plus petit
      height: '34px',
      transform: 'rotate(-35deg)',
      background:
        'linear-gradient(90deg, rgba(168,85,247,0.95), rgba(236,72,153,0.95))',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      animation: 'ribbonGlow 3s ease-in-out infinite',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      pointerEvents: 'none',                 // ne bloque pas les clics
      willChange: 'transform',
    }}
  >
    <span
      style={{
        fontWeight: 800,
        letterSpacing: '0.8px',
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
        textAlign: 'center',
        paddingInline: '8px',
        whiteSpace: 'nowrap',
      }}
    >
      DÉJÀ&nbsp;APPRISE
    </span>
  </div>
)}




                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-white/60">#{surah.number}</span>
                        <h3 className="text-2xl font-bold">{surah.englishName}</h3>
                        {isLearned && <CheckCircle className="text-green-400 w-6 h-6" />}
                      </div>
                      <div className="text-3xl mb-3">{surah.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(surah.numberOfAyahs)}`}>
                          {getDifficultyLabel(surah.numberOfAyahs)}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500">
                          {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-500">
                          {surah.numberOfAyahs} versets
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500">
                          📄 Pages {pages.startPage}-{pages.endPage}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white/60 mb-1">{surah.englishNameTranslation}</div>
                      {isLearned ? (
                        <div className="text-green-400 font-bold text-sm">✓ Mémorisée</div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSurah(surah);
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 text-sm"
                        >
                          Choisir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barre de progression si apprise */}
                  {isLearned && (
                    <div className="mt-4">
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/30 text-center">
          <div className="text-3xl font-bold mb-1">{learnedSurahs.length}</div>
          <div className="text-sm text-white/70">Sourates apprises</div>
        </div>
        <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30 text-center">
          <div className="text-3xl font-bold mb-1">
            {surahs.filter((s) => getDifficulty(s.numberOfAyahs) === 'facile').length}
          </div>
          <div className="text-sm text-white/70">Sourates faciles</div>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30 text-center">
          <div className="text-3xl font-bold mb-1">{surahs.length - learnedSurahs.length}</div>
          <div className="text-sm text-white/70">Restantes à apprendre</div>
        </div>
      </div>
    </div>
  );
};

export default SurahSelectionPage;
