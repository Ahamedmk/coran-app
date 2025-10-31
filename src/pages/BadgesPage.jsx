// src/pages/BadgesPage.jsx

import React from 'react';
import BadgeCard from '../components/BadgeCard';

const BadgesPage = ({ badges }) => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Mes Badges & Récompenses</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {badges.map((badge, idx) => (
        <BadgeCard key={idx} badge={badge} />
      ))}
    </div>
  </div>
);

export default BadgesPage;