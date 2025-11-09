// src/pages/SurahSelectionPage.jsx
import React, { useState } from 'react';
import { Search, Filter, BookOpen, CheckCircle, Star, Zap } from 'lucide-react';
import { reciterService } from '../services/reciterService';

// ✅ Check animé (on garde le symbole sans le texte)
const AnimatedCheck = ({ size = 26 }) => (
  <span
    className="check-pop inline-flex items-center justify-center rounded-full bg-green-500/20 ring-1 ring-green-400/50"
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <svg
      width={size - 6}
      height={size - 6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34d399"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Memorized"
    >
      <path className="check-draw" d="M20 6L9 17l-5-5" />
    </svg>
  </span>
);

const SurahSelectionPage = ({ surahs, learnedSurahs, onSelectSurah, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showLearned, setShowLearned] = useState(false);

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

  // 🔍 Filtrer par nom / arabe / numéro
  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch =
      surah.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surah.name.includes(searchTerm) ||
      surah.number.toString().includes(searchTerm);

    const difficulty = getDifficulty(surah.numberOfAyahs);
    const matchesDifficulty = difficultyFilter === 'all' || difficulty === difficultyFilter;

    const isLearned = learnedSurahs.includes(surah.number);
    const matchesLearnedFilter = showLearned ? isLearned : true;

    return matchesSearch && matchesDifficulty && matchesLearnedFilter;
  });

  // ⭐ Recommandations
  const recommendedSurahs = surahs
    .filter((s) => getDifficulty(s.numberOfAyahs) === 'facile' && !learnedSurahs.includes(s.number))
    .slice(0, 3);

  return (
    <div className="space-y-6">
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
          {showLearned
            ? `${learnedSurahs.length} sourate${learnedSurahs.length > 1 ? 's' : ''} déjà apprise${learnedSurahs.length > 1 ? 's' : ''}`
            : 'Sélectionne la sourate que tu veux mémoriser'}
        </p>
      </div>

      {/* 🌟 Recommandations */}
      {!showLearned && recommendedSurahs.length > 0 && (
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
                  <div className="text-sm text-white/60">
                    {surah.numberOfAyahs} versets • Facile
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    📄 Pages {pages.startPage}-{pages.endPage}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔎 Filtres */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une sourate (nom, arabe ou numéro)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Difficulté */}
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
              <option value="difficile">🔥 Avancé (>50 versets)</option>
            </select>
          </div>
        </div>

        {/* Bouton Apprises / À apprendre */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setShowLearned(!showLearned)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-white transition-all hover:bg-purple-500/30"
          >
            {showLearned ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Apprises
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                À apprendre
              </>
            )}
          </button>
        </div>
      </div>

      {/* 📜 Résultats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4">
          {filteredSurahs.length} sourate{filteredSurahs.length > 1 ? 's' : ''} trouvée
          {filteredSurahs.length > 1 ? 's' : ''}
        </h2>

        {filteredSurahs.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="text-6xl mb-4">🔍</div>
            <p>Aucune sourate trouvée</p>
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
                  className={`relative rounded-xl p-6 cursor-pointer transition-all border ${
                    isLearned
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-white/60">#{surah.number}</span>
                        <h3 className="text-2xl font-bold">{surah.englishName}</h3>
                        {isLearned && <AnimatedCheck />}
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

                    {!isLearned && (
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
    </div>
  );
};

export default SurahSelectionPage;
