// src/components/ProgressBar.jsx

import React from 'react';

const ProgressBar = ({ percentage, gradient = "from-green-400 to-emerald-500" }) => (
  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
    <div 
      className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 rounded-full`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

export default ProgressBar;