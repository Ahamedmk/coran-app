// src/pages/LearningPage.jsx
// Page focalisée sur l'apprentissage d'UNE sourate

import React, { useState, useEffect } from 'react';
import { BookOpen, Info, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { quranAPI } from '../services/quranAPI';
import ProgressBar from '../components/ProgressBar';

const LearningPage = ({ surah, progress = 0, onLearnVerse, onChangeSurah, onBack }) => {
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
      }, 3000);
    }
  };

  const progressPercentage = (progress / surah.numberOfAyahs) * 100;
  const isCompleted = progress === surah.numberOfAyahs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📖</div>
          <div className="text-2xl">Chargement de {surah.englishName}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      {/* Célébration sourate complète */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-green-500 to-emerald-500 rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold mb-4">Masha'Allah !</h2>
            <p className="text-xl mb-6">
              Tu as complété {surah.englishName} !<br />
              <strong>{surah.numberOfAyahs} versets mémorisés</strong>
            </p>
            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <p className="text-sm">
                📚 Cette sourate a été ajoutée à tes révisions<br />
                ⏰ Première révision : Demain à 9h00
              </p>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="bg-white text-green-600 font-bold px-8 py-3 rounded-lg hover:scale-105 transition-all"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Header avec progression */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 w-full max-w-full
">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <span className="text-2xl">←</span>
          <span>Retour</span>
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{surah.englishName}</h1>
            <div className="text-4xl mb-3">{surah.name}</div>
            <div className="flex gap-2">
              <span className="text-sm px-3 py-1 rounded-full bg-purple-500">
                {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-blue-500">
                {surah.numberOfAyahs} versets
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-5xl font-bold text-green-400 mb-1">
              {progress}/{surah.numberOfAyahs}
            </div>
            <div className="text-sm text-white/60">
              {isCompleted ? 'Complète !' : 'Versets mémorisés'}
            </div>
          </div>
        </div>

        <ProgressBar percentage={progressPercentage} gradient="from-green-400 to-emerald-500" />
        
        <div className="mt-4 flex justify-between text-sm">
          <span>{Math.round(progressPercentage)}% complété</span>
          <span>{surah.numberOfAyahs - progress} versets restants</span>
        </div>
      </div>

      {/* Contexte de la sourate */}
      <div className="bg-linear-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 w-full max-w-full
">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Info className="text-blue-400" />
          Contexte de la Révélation
        </h2>
        <div className="space-y-3 text-white/90">
          <p>
            <strong>Signification :</strong> {surah.englishNameTranslation}
          </p>
          <p>
            <strong>Lieu :</strong> Révélée à {surah.revelationType === 'Meccan' ? 'La Mecque' : 'Médine'}
          </p>
          <p className="text-sm leading-relaxed">
            {surah.revelationType === 'Meccan' 
              ? "Les sourates mecquoises se concentrent généralement sur la foi, l'unicité d'Allah et le Jour du Jugement."
              : "Les sourates médinoises traitent souvent des lois, de la communauté musulmane et des relations sociales."}
          </p>
        </div>
      </div>

      {/* Zone d'apprentissage */}
      {!isCompleted ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-full
">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Verset {progress + 1} / {surah.numberOfAyahs}
          </h2>

          {surahData && surahData.ayahs && surahData.ayahs[progress] && (
            <div className="space-y-6">
              {/* Verset en arabe */}
              <div className="bg-black/30 rounded-xl p-8 text-center">
                <div className="text-4xl md:text-5xl leading-loose text-right">
                  {surahData.ayahs[progress].text}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Award className="text-yellow-400" />
                  Comment mémoriser efficacement ?
                </h3>
                <ol className="space-y-2 text-sm text-white/90">
                  <li>1️⃣ Lis le verset à voix haute 3 fois</li>
                  <li>2️⃣ Écoute la récitation (si possible)</li>
                  <li>3️⃣ Répète sans regarder</li>
                  <li>4️⃣ Récite-le de mémoire 5 fois</li>
                  <li>5️⃣ Clique sur "Verset mémorisé" quand tu es prêt(e)</li>
                </ol>
              </div>

              {/* Bouton d'action */}
              <button
                onClick={handleLearnVerse}
                className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 rounded-xl transition-all hover:scale-105 shadow-lg text-xl flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-8 h-8" />
                Verset mémorisé (+20 points)
                <ArrowRight className="w-8 h-8" />
              </button>

              {/* Progression dans la session */}
              <div className="text-center text-sm text-white/60">
                Encore {surah.numberOfAyahs - progress - 1} verset{surah.numberOfAyahs - progress - 1 > 1 ? 's' : ''} avant de compléter cette sourate
              </div>
            </div>
          )}
        </div>
      ) : (
        // Sourate complétée
        <div className="bg-linear-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 text-center w-full max-w-full
">
          <div className="text-8xl mb-6">🌟</div>
          <h2 className="text-3xl font-bold mb-4">Sourate Complétée !</h2>
          <p className="text-xl text-white/90 mb-8">
            Masha'Allah ! Tu as mémorisé tous les {surah.numberOfAyahs} versets de {surah.englishName}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl mb-2">+{surah.numberOfAyahs * 20}</div>
              <div className="text-sm text-white/70">Points gagnés</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl mb-2">🧠</div>
              <div className="text-sm text-white/70">Ajoutée aux révisions</div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onChangeSurah}
              className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <BookOpen className="w-6 h-6" />
              Choisir une nouvelle sourate
            </button>

            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-xl transition-all"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )}

      {/* Révision de tous les versets appris */}
      {progress > 0 && !isCompleted && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 w-full max-w-full
">
          <h3 className="text-lg font-bold mb-4">Versets déjà mémorisés</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {surahData && surahData.ayahs && surahData.ayahs.slice(0, progress).map((ayah, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 text-right border border-white/10">
                <div className="text-sm text-white/50 mb-2">Verset {index + 1}</div>
                <div className="text-xl leading-relaxed">{ayah.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPage;