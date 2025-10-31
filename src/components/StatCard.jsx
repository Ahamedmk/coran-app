// src/components/StatCard.jsx

import React from 'react';

const StatCard = ({ icon: Icon, value, label, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-center`}>
    <Icon className="w-8 h-8 mx-auto mb-2" />
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs opacity-80">{label}</div>
  </div>
);

export default StatCard;