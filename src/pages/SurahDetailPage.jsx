// src/pages/SurahDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { quranAPI } from '../services/quranAPI';
import ProgressBar from '../components/ProgressBar';

const SurahDetailPage = ({ surah, progress, onBack, onLearn }) => {
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurahData = async () => {
      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      setLoading(false);
    };
    fetchSurahData();
  }, [surah.number]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl">Chargement...</div>
      </div>
    );
  }

  const progressPercent = ((progress || 0) / surah.numberOfAyahs) * 100;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <span className="text-2xl">←</span>
        <span>Retour aux sourates</span>
      </button>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
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

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <BookOpen className="text-blue-400" />
              Traduction du nom
            </h2>
            <p className="text-white/90 leading-relaxed text-lg">
              {surah.englishNameTranslation}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ta Progression</h2>
              <div className="text-3xl font-bold text-green-400">
                {progress || 0}/{surah.numberOfAyahs}
              </div>
            </div>
            <ProgressBar percentage={progressPercent} />
            <button
              onClick={onLearn}
              className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] text-lg"
            >
              Apprendre un verset ✨
            </button>
          </div>

          {surahData && surahData.ayahs && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-4">Premier verset</h2>
              <div className="text-3xl text-right leading-loose mb-4">
                {surahData.ayahs[0].text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurahDetailPage;