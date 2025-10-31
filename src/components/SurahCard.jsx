// src/components/SurahCard.jsx

import React from 'react';
import ProgressBar from './ProgressBar';

const SurahCard = ({ surah, progress, onSelect, onLearn }) => {
  const learned = progress || 0;
  const progressPercent = (learned / surah.numberOfAyahs) * 100;
  
  const getDifficultyColor = (verses) => {
    if (verses <= 10) return 'bg-green-500';
    if (verses <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getDifficulty = (verses) => {
    if (verses <= 10) return 'Facile';
    if (verses <= 50) return 'Moyen';
    return 'Avancé';
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{surah.englishName}</h3>
          <div className="text-2xl mb-2 opacity-70">{surah.name}</div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(surah.numberOfAyahs)}`}>
              {getDifficulty(surah.numberOfAyahs)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500">
              {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
            </span>
            <span className="text-sm text-white/60">{surah.numberOfAyahs} versets</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{learned}/{surah.numberOfAyahs}</div>
          <div className="text-xs text-white/60">versets appris</div>
        </div>
      </div>
      
      <ProgressBar percentage={progressPercent} />
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLearn();
        }}
        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02]"
      >
        {learned === 0 ? 'Commencer' : 'Continuer'} ✨
      </button>
    </div>
  );
};

export default SurahCard;