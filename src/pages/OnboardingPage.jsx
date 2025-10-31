// src/pages/OnboardingPage.jsx
// Tutoriel pour expliquer l'application aux nouveaux utilisateurs

import React, { useState } from 'react';
import { BookOpen, Brain, Target, Trophy, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const OnboardingPage = ({ onComplete, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: BookOpen,
      title: `Bienvenue ${userName} ! 👋`,
      description: "Découvre comment mémoriser le Coran facilement avec notre application.",
      detail: "Nous utilisons la science de la répétition espacée pour t'aider à mémoriser durablement, verset par verset.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Choisis UNE Sourate",
      description: "Commence par une sourate courte et facile.",
      detail: "Pas besoin de te disperser ! Tu choisis UNE sourate, tu la mémorises complètement, puis tu passes à la suivante. Simplicité et focus ! 🎯",
      color: "from-green-500 to-emerald-500",
      example: (
        <div className="mt-4 bg-black/20 rounded-lg p-4">
          <div className="text-sm text-white/60 mb-2">Exemple : Al-Ikhlas</div>
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
            <div>
              <div className="font-bold">الإخلاص - Al-Ikhlas</div>
              <div className="text-sm text-white/60">4 versets • Facile</div>
            </div>
            <div className="text-green-400 font-bold">0/4</div>
          </div>
        </div>
      )
    },
    {
      icon: BookOpen,
      title: "Apprends Verset par Verset",
      description: "Clique sur 'Apprendre' pour chaque verset que tu mémorises.",
      detail: "Lis, récite, mémorise un verset, puis clique sur le bouton. L'app suit ta progression automatiquement ! +20 points par verset 🌟",
      color: "from-purple-500 to-pink-500",
      example: (
        <div className="mt-4 bg-black/20 rounded-lg p-4 text-center">
          <div className="text-2xl mb-3 leading-loose">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg">
            ✨ Verset mémorisé (+20 points)
          </div>
        </div>
      )
    },
    {
      icon: Brain,
      title: "Révise Intelligemment",
      description: "L'algorithme te dit QUAND réviser pour ne jamais oublier.",
      detail: "Grâce à la répétition espacée, tu révises juste avant d'oublier : 1j → 3j → 7j → 15j → 30j → 60j... Mémorisation à VIE ! 🧠",
      color: "from-red-500 to-orange-500",
      example: (
        <div className="mt-4 space-y-2">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center justify-between">
            <span>🔴 À réviser aujourd'hui</span>
            <span className="font-bold">3 sourates</span>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 flex items-center justify-between">
            <span>📚 Demain</span>
            <span className="font-bold">2 sourates</span>
          </div>
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 flex items-center justify-between">
            <span>🌟 Maîtrisées</span>
            <span className="font-bold">8 sourates</span>
          </div>
        </div>
      )
    },
    {
      icon: Trophy,
      title: "Gagne des Points & Badges",
      description: "Chaque verset appris et chaque révision te rapporte des points !",
      detail: "Monte de niveau, débloque des badges, maintiens ta série de jours consécutifs. Transforme la mémorisation en jeu ! 🏆",
      color: "from-yellow-500 to-amber-500",
      example: (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-linear-to-br from-orange-500 to-red-500 rounded-xl p-4 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs opacity-80">Jours de suite</div>
          </div>
          <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-bold">2840</div>
            <div className="text-xs opacity-80">Points</div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Indicateurs de progression */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-white'
                  : index < currentStep
                  ? 'w-2 bg-green-400'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Carte principale */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Icône */}
          <div className={`inline-block bg-linear-to-br ${currentStepData.color} rounded-full p-6 mb-6`}>
            <Icon className="w-12 h-12 text-white" />
          </div>

          {/* Contenu */}
          <h2 className="text-3xl font-bold text-white mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-xl text-white/90 mb-3">
            {currentStepData.description}
          </p>
          
          <p className="text-white/70 mb-6 leading-relaxed">
            {currentStepData.detail}
          </p>

          {/* Exemple visuel */}
          {currentStepData.example && (
            <div className="mb-6">
              {currentStepData.example}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            {currentStep > 0 && (
  <button
    onClick={handlePrev}
    style={{
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontWeight: '600',
      padding: '1rem',
      borderRadius: '0.5rem',
      transition: 'all 0.3s',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  >
    <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
    Précédent
  </button>
            )}
            
            <button
              onClick={handleNext}
              className={`flex-1 ${
                isLastStep
                  ? 'bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  : 'bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white font-bold py-4 rounded-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2`}
            >
              {isLastStep ? (
                <>
                  <Check className="w-5 h-5" />
                  Commencer !
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Skip */}
          {/* Bouton Passer le tutoriel */}
<button
  onClick={onComplete}
  style={{
    width: '100%',
    marginTop: '1rem',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.875rem',
    textDecoration: 'underline',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem'
  }}
  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 1)'}
  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
>
  Passer le tutoriel
</button>
        </div>

        {/* Étape actuelle */}
        <div className="text-center mt-6 text-white/60">
          Étape {currentStep + 1} sur {steps.length}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;