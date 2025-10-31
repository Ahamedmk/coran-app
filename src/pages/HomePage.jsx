// src/pages/HomePage.jsx

import React from 'react';
import SurahCard from '../components/SurahCard';
import ProgressBar from '../components/ProgressBar';

const HomePage = ({ 
  userProgress, 
  surahs, 
  verseProgress, 
  onSelectSurah, 
  onLearnVerse 
}) => {
  const progressPercentage = (userProgress.todayProgress / userProgress.dailyGoal) * 100;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30 mb-6">
        <h3 className="text-xl font-bold mb-2">🎯 Objectif Quotidien</h3>
        <p className="text-white/80 mb-3">
          Plus que {userProgress.dailyGoal - userProgress.todayProgress} versets pour atteindre ton objectif !
        </p>
        <ProgressBar percentage={progressPercentage} gradient="from-green-400 to-emerald-500" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Sourates à Apprendre</h2>
      
      <div className="grid gap-4">
        {surahs.map(surah => (
          <SurahCard
            key={surah.number}
            surah={surah}
            progress={verseProgress[surah.number]}
            onSelect={() => onSelectSurah(surah)}
            onLearn={() => onLearnVerse(surah.number)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;