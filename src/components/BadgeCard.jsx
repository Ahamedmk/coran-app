// src/components/BadgeCard.jsx

import React from 'react';

const BadgeCard = ({ badge }) => (
  <div 
    className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border transition-all ${
      badge.earned 
        ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-500/20' 
        : 'border-white/20 opacity-60'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`text-6xl ${badge.earned ? 'animate-pulse' : 'grayscale'}`}>
        {badge.icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-1">{badge.name}</h3>
        <p className="text-white/70 text-sm">{badge.desc}</p>
        {badge.earned && (
          <div className="mt-2 text-yellow-400 font-semibold text-sm">✓ Débloqué !</div>
        )}
        {!badge.earned && (
          <div className="mt-2 text-white/50 text-sm">🔒 Verrouillé</div>
        )}
      </div>
    </div>
  </div>
);

export default BadgeCard;