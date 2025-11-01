// src/pages/FocusedLearningPage.jsx
// Page focalisée sur UNE sourate à apprendre

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, ArrowLeft, Info, Sparkles } from 'lucide-react';
import { quranAPI } from '../services/quranAPI';
import ProgressBar from '../components/ProgressBar';

const FocusedLearningPage = ({ 
  surah, 
  progress, 
  onLearnVerse, 
  onChangeSurah, 
  onComplete 
}) => {
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      setLoading(false);
    };
    loadSurahData();
  }, [surah.number]);

  const handleLearnVerse = () => {
    onLearnVerse();
    
    // Célébration si sourate complétée
    if (progress + 1 === surah.numberOfAyahs) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete();
      }, 3000);
    }
  };

  const progressPercentage = ((progress || 0) / surah.numberOfAyahs) * 100;
  const versesLeft = surah.numberOfAyahs - (progress || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl">Chargement de la sourate...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-linear-to-br from-green-500 to-emerald-500 rounded-2xl p-12 text-center max-w-md animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold mb-4">Masha'Allah !</h2>
            <p className="text-xl mb-6">
              Tu as complété {surah.englishName} !
            </p>
            <p className="text-white/90">
              {surah.numberOfAyahs} versets mémorisés
            </p>
            <p className="text-sm mt-4 text-white/80">
              Ajouté aux révisions automatiquement ✨
            </p>
          </div>
        </div>
      )}

      {/* Header avec bouton changer */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <button
          onClick={onChangeSurah}
          style={{
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    transition: 'all 0.3s'
  }}
  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  
>
       
          <ArrowLeft className="w-5 h-5" />
          <span>Changer de sourate</span>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">{surah.englishName}</h1>
          <div className="text-5xl mb-4">{surah.name}</div>
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="text-sm px-3 py-1 rounded-full bg-blue-500">
              {surah.numberOfAyahs} versets
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500">
              {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
            </span>
          </div>
        </div>

        {/* Progression */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Ta progression</span>
            <span className="text-green-400 font-bold">
              {progress || 0} / {surah.numberOfAyahs} versets
            </span>
          </div>
          <ProgressBar percentage={progressPercentage} linear="from-green-400 to-emerald-500" />
          <div className="text-center mt-2 text-sm text-white/60">
            {versesLeft === 0 ? (
              <span className="text-green-400 font-bold">✨ Sourate complétée ! ✨</span>
            ) : (
              <span>Plus que {versesLeft} verset{versesLeft > 1 ? 's' : ''} !</span>
            )}
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-white/70">Complété</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{progress || 0}</div>
            <div className="text-xs text-white/70">Mémorisés</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{versesLeft}</div>
            <div className="text-xs text-white/70">Restants</div>
          </div>
        </div>
      </div>

      {/* Causes de révélation */}
      <div className="bg-linear-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <Info className="text-amber-400" />
          Contexte de Révélation
        </h2>
        <p className="text-white/90 leading-relaxed">
          {surahData?.englishNameTranslation && (
            <span className="font-semibold block mb-2">
              "{surahData.englishNameTranslation}"
            </span>
          )}
          {getSurahContext(surah.number)}
        </p>
      </div>

      {/* Verset actuel à apprendre */}
      {versesLeft > 0 && surahData?.ayahs && (
        <div className="bg-linear-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-400" />
              Verset à mémoriser
            </h2>
            <span className="text-lg text-white/60">
              #{(progress || 0) + 1}
            </span>
          </div>

          <div className="bg-black/20 rounded-xl p-8 mb-6">
            <div className="text-4xl md:text-5xl leading-loose text-right mb-4">
              {surahData.ayahs[progress || 0]?.text}
            </div>
            <div className="text-center text-sm text-white/50">
              Verset {surahData.ayahs[progress || 0]?.numberInSurah} sur {surah.numberOfAyahs}
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="text-sm">
              <strong>💡 Astuce :</strong> Lis le verset plusieurs fois à haute voix, puis essaie de le réciter de mémoire avant de cliquer sur "Verset mémorisé".
            </div>
          </div>

          <button
            onClick={handleLearnVerse}
            className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-5 rounded-xl transition-all hover:scale-105 shadow-lg text-xl"
          >
            ✨ Verset mémorisé (+20 points)
          </button>
        </div>
      )}

      {/* Tous les versets pour référence */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-400" />
          Tous les versets
        </h2>
        <p className="text-white/70 text-sm mb-4">
          Consulte l'ensemble de la sourate pour contexte
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {surahData?.ayahs?.map((ayah, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 border transition-all ${
                index < (progress || 0)
                  ? 'bg-green-500/10 border-green-500/30'
                  : index === (progress || 0)
                  ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                  Verset {ayah.numberInSurah}
                </span>
                {index < (progress || 0) && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {index === (progress || 0) && (
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                )}
              </div>
              <div className="text-2xl md:text-3xl leading-loose text-right">
                {ayah.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fonction helper pour le contexte (à enrichir)
const getSurahContext = (surahNumber) => {
  const contexts = {
    1: "Al-Fatiha est l'ouverture du Coran, révélée à La Mecque. C'est la sourate la plus récitée, présente dans chaque unité de prière. Elle résume l'essence de l'Islam : louange à Allah, reconnaissance de Sa souveraineté, et demande de guidance.",
    112: "Al-Ikhlas a été révélée en réponse aux polythéistes qui demandèrent au Prophète ﷺ de décrire son Seigneur. Cette courte sourate définit le Tawhid (monothéisme pur) et équivaut au tiers du Coran selon le Prophète ﷺ.",
    113: "Al-Falaq est la première des deux sourates protectrices. Révélée à La Mecque, elle enseigne à chercher refuge auprès d'Allah contre les maux de la création, l'obscurité, la sorcellerie et l'envie.",
    114: "An-Nas, dernière sourate du Coran, complète les sourates protectrices. Elle enseigne à chercher refuge contre les suggestions du diable et les mauvaises pensées. Le Prophète ﷺ recommandait sa récitation quotidienne.",
    // Ajouter plus de contextes pour les autres sourates
  };
  
  return contexts[surahNumber] || `Cette sourate fait partie du Coran et contient des enseignements précieux. ${
    surahNumber <= 9 ? "C'est une sourate longue qui nécessite patience et persévérance." :
    surahNumber <= 50 ? "C'est une sourate de taille moyenne." :
    "C'est une sourate courte, idéale pour commencer la mémorisation."
  }`;
};

export default FocusedLearningPage;