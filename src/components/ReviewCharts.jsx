// src/components/ReviewCharts.jsx
// Composant pour les graphiques de progression des révisions

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Graphique de difficulté au fil du temps
export const DifficultyChart = ({ reviewHistory }) => {
  // Transformer l'historique en données pour le graphique
  const data = reviewHistory.map((review, index) => ({
    revision: index + 1,
    difficulte: review.difficulty,
    date: new Date(review.review_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }));

  const getDifficultyLabel = (value) => {
    const labels = {
      0: 'Oublié',
      1: 'Difficile',
      2: 'Moyen',
      3: 'Facile',
      4: 'Parfait'
    };
    return labels[value] || '';
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">📊 Évolution de ta Mémorisation</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value) => [getDifficultyLabel(value), 'Difficulté']}
          />
          <Line 
            type="monotone" 
            dataKey="difficulte" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-red-500/20 rounded p-2">
          <div className="font-bold">0</div>
          <div className="text-white/60">Oublié</div>
        </div>
        <div className="bg-orange-500/20 rounded p-2">
          <div className="font-bold">1</div>
          <div className="text-white/60">Difficile</div>
        </div>
        <div className="bg-yellow-500/20 rounded p-2">
          <div className="font-bold">2</div>
          <div className="text-white/60">Moyen</div>
        </div>
        <div className="bg-blue-500/20 rounded p-2">
          <div className="font-bold">3</div>
          <div className="text-white/60">Facile</div>
        </div>
        <div className="bg-green-500/20 rounded p-2">
          <div className="font-bold">4</div>
          <div className="text-white/60">Parfait</div>
        </div>
      </div>
    </div>
  );
};

// Graphique d'évolution des intervalles
export const IntervalChart = ({ reviewHistory }) => {
  const data = reviewHistory.map((review, index) => ({
    revision: `R${index + 1}`,
    intervalle: review.interval_after,
    date: new Date(review.review_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">📈 Progression des Intervalles</h3>
      <p className="text-white/70 text-sm mb-4">
        Plus les intervalles augmentent, mieux tu mémorises !
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorInterval" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="revision" 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Jours', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value) => [`${value} jours`, 'Intervalle']}
          />
          <Area 
            type="monotone" 
            dataKey="intervalle" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorInterval)" 
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 bg-green-500/20 rounded-lg p-4 border border-green-500/30">
        <div className="text-sm">
          <strong>🎯 Objectif :</strong> Atteindre des intervalles de 30, 60, puis 90 jours pour une mémorisation permanente !
        </div>
      </div>
    </div>
  );
};

// Graphique de distribution des difficultés
export const DifficultyDistributionChart = ({ reviewHistory }) => {
  // Calculer la distribution
  const distribution = reviewHistory.reduce((acc, review) => {
    acc[review.difficulty] = (acc[review.difficulty] || 0) + 1;
    return acc;
  }, {});

  const data = [
    { name: 'Oublié', count: distribution[0] || 0, color: '#ef4444' },
    { name: 'Difficile', count: distribution[1] || 0, color: '#f97316' },
    { name: 'Moyen', count: distribution[2] || 0, color: '#eab308' },
    { name: 'Facile', count: distribution[3] || 0, color: '#3b82f6' },
    { name: 'Parfait', count: distribution[4] || 0, color: '#10b981' }
  ];

  const total = reviewHistory.length;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">🎯 Répartition de tes Révisions</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value) => [`${value} révisions (${Math.round(value/total*100)}%)`, 'Nombre']}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <rect key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
          <div className="text-2xl font-bold">{distribution[3] + distribution[4] || 0}</div>
          <div className="text-xs text-white/70">Révisions réussies</div>
          <div className="text-xs text-white/50">
            ({Math.round(((distribution[3] || 0) + (distribution[4] || 0)) / total * 100)}%)
          </div>
        </div>
        <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
          <div className="text-2xl font-bold">
            {reviewHistory.length > 0 ? (reviewHistory.reduce((sum, r) => sum + r.difficulty, 0) / reviewHistory.length).toFixed(1) : 0}
          </div>
          <div className="text-xs text-white/70">Difficulté moyenne</div>
          <div className="text-xs text-white/50">(sur 4)</div>
        </div>
      </div>
    </div>
  );
};

// Graphique de taux de rétention au fil du temps
export const RetentionChart = ({ reviewHistory }) => {
  // Calculer le taux de rétention cumulé
  const data = reviewHistory.map((review, index) => {
    const upToNow = reviewHistory.slice(0, index + 1);
    const avgDifficulty = upToNow.reduce((sum, r) => sum + r.difficulty, 0) / upToNow.length;
    const retention = (avgDifficulty / 4) * 100;
    
    return {
      revision: index + 1,
      retention: Math.round(retention),
      date: new Date(review.review_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    };
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">💪 Taux de Rétention Global</h3>
      <p className="text-white/70 text-sm mb-4">
        Mesure à quel point tu retiens cette sourate au fil du temps
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="revision" 
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Révisions', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
            label={{ value: '%', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value) => [`${value}%`, 'Rétention']}
          />
          <Area 
            type="monotone" 
            dataKey="retention" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRetention)" 
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-red-500/20 rounded-lg p-3">
          <div className="text-sm font-bold">0-50%</div>
          <div className="text-xs text-white/60">Fragile</div>
        </div>
        <div className="bg-yellow-500/20 rounded-lg p-3">
          <div className="text-sm font-bold">50-80%</div>
          <div className="text-xs text-white/60">En cours</div>
        </div>
        