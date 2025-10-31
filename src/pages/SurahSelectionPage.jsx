// src/pages/SurahSelectionPage.jsx
// Page pour choisir une sourate à apprendre

import React, { useState } from 'react';
import { Search, Filter, BookOpen, CheckCircle, Star, Zap } from 'lucide-react';

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

  // Filtrer les sourates
  const filteredSurahs = surahs.filter(surah => {
    const matchesSearch = surah.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         surah.name.includes(searchTerm);
    
    const difficulty = getDifficulty(surah.numberOfAyahs);
    const matchesDifficulty = difficultyFilter === 'all' || difficulty === difficultyFilter;
    
    const isLearned = learnedSurahs.includes(surah.number);
    const matchesLearnedFilter = showLearned ? isLearned : !isLearned;
    
    return matchesSearch && matchesDifficulty && matchesLearnedFilter;
  });

  // Recommandations
  const recommendedSurahs = surahs
    .filter(s => getDifficulty(s.numberOfAyahs) === 'facile' && !learnedSurahs.includes(s.number))
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '1rem',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem'
  }}
  onMouseEnter={(e) => e.target.style.color = 'rgba(255, 255, 255, 1)'}
  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
>
  <span style={{ fontSize: '1.5rem' }}>←</span>
  <span>Retour</span>
</button>

        <h1 className="text-3xl font-bold mb-2">Choisis ta Sourate</h1>
        <p className="text-white/70">
          {showLearned
            ? `${learnedSurahs.length} sourate${learnedSurahs.length > 1 ? 's' : ''} déjà apprise${learnedSurahs.length > 1 ? 's' : ''}`
            : "Sélectionne la sourate que tu veux mémoriser"}
        </p>
      </div>

      {/* Recommendations (si pas de filtre learned) */}
      {!showLearned && recommendedSurahs.length > 0 && (
        <div className="bg-linear-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Star className="text-yellow-400" />
            Recommandations pour débuter
          </h2>
          <p className="text-white/70 text-sm mb-4">
            Commence par ces sourates courtes et faciles !
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {recommendedSurahs.map(surah => (
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une sourate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">Toutes difficultés</option>
              <option value="facile">✅ Facile (≤10 versets)</option>
              <option value="moyen">⚡ Moyen (11-50 versets)</option>
              <option value="difficile">🔥 Avancé (sup à 50 versets)</option>
            </select>

            <button
  onClick={() => setShowLearned(!showLearned)}
  style={{
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    backgroundColor: showLearned ? '#22c55e' : 'rgba(255, 255, 255, 0.1)',
    color: showLearned ? 'white' : 'rgba(255, 255, 255, 0.7)',
    border: 'none',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    if (!showLearned) {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    }
  }}
  onMouseLeave={(e) => {
    if (!showLearned) {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
  }}
>
  {showLearned ? (
    <>
      <CheckCircle style={{ display: 'inline', width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', verticalAlign: 'middle' }} />
      Apprises
    </>
  ) : (
    <>
      <BookOpen style={{ display: 'inline', width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', verticalAlign: 'middle' }} />
      À apprendre
    </>
  )}
</button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {filteredSurahs.length} sourate{filteredSurahs.length > 1 ? 's' : ''} trouvée{filteredSurahs.length > 1 ? 's' : ''}
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
            {filteredSurahs.map(surah => {
              const isLearned = learnedSurahs.includes(surah.number);
              
              return (
                <div
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className={`rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.02] border ${
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
                        {isLearned && (
                          <CheckCircle className="text-green-400 w-6 h-6" />
                        )}
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
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/60 mb-1">
                        {surah.englishNameTranslation}
                      </div>
                      {isLearned ? (
                        <div className="text-green-400 font-bold text-sm">
                          ✓ Mémorisée
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSurah(surah);
                          }}
                          className="bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 text-sm"
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
                        <div className="h-full bg-linear-to-r from-green-400 to-emerald-500 w-full" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/30 text-center">
          <div className="text-3xl font-bold mb-1">{learnedSurahs.length}</div>
          <div className="text-sm text-white/70">Sourates apprises</div>
        </div>
        <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30 text-center">
          <div className="text-3xl font-bold mb-1">
            {surahs.filter(s => getDifficulty(s.numberOfAyahs) === 'facile').length}
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