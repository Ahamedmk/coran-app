// src/App.jsx - Version Complète V2 avec Auth, Onboarding et UX améliorée

import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Flame, CheckCircle, Target, Award, TrendingUp, Brain, LogOut } from 'lucide-react';
import { quranAPI } from './services/quranAPI';
import { revisionService } from './services/revisionService';
import { authService } from './services/authService';

// Composants
import StatCard from './components/StatCard';
import ProgressBar from './components/ProgressBar';
import BadgesPage from './pages/BadgesPage';
import RevisionPage from './pages/RevisionPage';

// Nouvelles pages
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import SurahSelectionPage from './pages/SurahSelectionPage';
import FocusedLearningPage from './pages/FocusedLearningPage';

const App = () => {
  // États d'authentification
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // États de navigation
  const [currentTab, setCurrentTab] = useState('apprendre');
  const [currentView, setCurrentView] = useState('selection'); // 'selection' | 'learning'
  const [selectedSurah, setSelectedSurah] = useState(null);
  
  // États de données
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [userProgress, setUserProgress] = useState({
    streak: 0,
    totalVerses: 6236,
    learnedVerses: 0,
    points: 0,
    level: 1,
    dailyGoal: 10,
    todayProgress: 0
  });

  const [verseProgress, setVerseProgress] = useState({});
  const [learnedSurahs, setLearnedSurahs] = useState([]);
  
  // États pour les révisions
  const [surahReviews, setSurahReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    dueToday: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0
  });

  const badges = [
    { name: "Premier Pas", icon: "🌟", earned: userProgress.learnedVerses > 0, desc: "Premier verset mémorisé" },
    { name: "Assidu", icon: "🔥", earned: userProgress.streak >= 7, desc: "7 jours consécutifs" },
    { name: "Érudit", icon: "📚", earned: userProgress.learnedVerses >= 100, desc: "100 versets appris" },
    { name: "Champion", icon: "🏆", earned: userProgress.level >= 20, desc: "Niveau 20 atteint" }
  ];

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setShowOnboarding(!currentUser.onboarding_completed);
    }
    setLoading(false);
  }, []);

  // Charger les données quand l'utilisateur est connecté
  useEffect(() => {
    if (user && !showOnboarding) {
      loadUserData();
    }
  }, [user, showOnboarding]);

  const loadUserData = async () => {
    setLoading(true);
    
    // Charger les sourates
    const surahsData = await quranAPI.getAllSurahs();
    setSurahs(surahsData);
    
    // Charger les révisions
    const reviews = await revisionService.getUserReviews(user.id);
    setSurahReviews(reviews);
    
    // Calculer les stats
    const stats = await revisionService.getReviewStats(user.id);
    setReviewStats(stats);
    
    // Calculer les sourates apprises (100%)
    const learned = Object.entries(verseProgress)
      .filter(([surahId, progress]) => {
        const surah = surahsData.find(s => s.number === parseInt(surahId));
        return surah && progress === surah.numberOfAyahs;
      })
      .map(([surahId]) => parseInt(surahId));
    
    setLearnedSurahs(learned);
    
    setLoading(false);
  };

  // Gestion de l'authentification
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowOnboarding(!authenticatedUser.onboarding_completed);
  };

  const handleOnboardingComplete = async () => {
    if (user) {
      await authService.completeOnboarding(user.id);
      const updatedUser = { ...user, onboarding_completed: true };
      setUser(updatedUser);
      localStorage.setItem('coran_user', JSON.stringify(updatedUser));
    }
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setUserProgress({
      streak: 0,
      totalVerses: 6236,
      learnedVerses: 0,
      points: 0,
      level: 1,
      dailyGoal: 10,
      todayProgress: 0
    });
    setVerseProgress({});
    setLearnedSurahs([]);
  };

  // Rafraîchir les stats de révision
  const refreshReviewStats = async () => {
    if (!user) return;
    const reviews = await revisionService.getUserReviews(user.id);
    setSurahReviews(reviews);
    const stats = await revisionService.getReviewStats(user.id);
    setReviewStats(stats);
  };

  // Fonction pour apprendre un verset
  const learnVerse = async () => {
    if (!selectedSurah) return;

    const newProgress = { ...verseProgress };
    const currentProgress = newProgress[selectedSurah.number] || 0;
    const newVerseCount = currentProgress + 1;
    newProgress[selectedSurah.number] = newVerseCount;
    setVerseProgress(newProgress);
    
    setUserProgress(prev => ({
      ...prev,
      learnedVerses: prev.learnedVerses + 1,
      points: prev.points + 20,
      level: Math.floor((prev.points + 20) / 500) + 1,
      todayProgress: Math.min(prev.todayProgress + 1, prev.dailyGoal)
    }));

    // Célébration tous les 10 versets
    if ((userProgress.learnedVerses + 1) % 10 === 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    // Si la sourate est complétée
    if (newVerseCount === selectedSurah.numberOfAyahs) {
      setLearnedSurahs([...learnedSurahs, selectedSurah.number]);
      
      // Créer automatiquement une révision
      const result = await revisionService.createReview(user.id, selectedSurah.number);
      if (result.success) {
        await refreshReviewStats();
      }
    }
  };

  const handleSurahComplete = () => {
    setCurrentView('selection');
    setSelectedSurah(null);
  };

  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setCurrentView('learning');
  };

  const handleChangeSurah = () => {
    setCurrentView('selection');
  };

  // Fonction pour commencer une révision
  const handleStartRevision = async (surahId) => {
    console.log(`🧠 Début révision sourate ${surahId}`);
  };

  // Fonction pour compléter une révision
  const handleReviewComplete = async (surahId, difficulty) => {
    if (!user) return;
    
    const result = await revisionService.updateReview(user.id, surahId, difficulty);
    
    if (result.success) {
      const revisionPoints = {
        0: 5, 1: 10, 2: 20, 3: 30, 4: 40
      }[difficulty] || 20;

      setUserProgress(prev => ({
        ...prev,
        points: prev.points + revisionPoints,
        level: Math.floor((prev.points + revisionPoints) / 500) + 1
      }));

      await refreshReviewStats();

      const messages = {
        0: "❌ Pas de souci ! Tu vas la revoir bientôt.",
        1: "😰 C'est difficile mais tu progresses !",
        2: "🤔 Bien ! Continue comme ça.",
        3: "😊 Très bien ! La mémorisation se renforce.",
        4: "🌟 Parfait ! Excellente mémorisation !"
      };

      const surah = surahs.find(s => s.number === surahId);
      alert(`${messages[difficulty]}\n\n${surah?.englishName}\n+${revisionPoints} points\n\n📅 Prochaine révision : dans ${result.newInterval} jour${result.newInterval > 1 ? 's' : ''}`);
    }
  };

  const levelProgress = ((userProgress.points % 500) / 500) * 100;

  // Si pas connecté, afficher la page d'authentification
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Si onboarding pas terminé, afficher l'onboarding
  if (showOnboarding) {
    return (
      <OnboardingPage 
        onComplete={handleOnboardingComplete} 
        userName={user.name || 'Utilisateur'}
      />
    );
  }

  // Chargement initial
 if (loading) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom right, #312e81, #7e22ce, #ec4899)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>📖</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>Chargement...</div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>Préparation de ton parcours</div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-4">
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce text-8xl">🎉</div>
        </div>
      )}

      {/* Header avec Stats */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Salam {user.name} ! 👋</h1>
              <p className="text-white/70">Continue ton voyage spirituel</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Trophy className="text-yellow-400" />
                  <span>{userProgress.points}</span>
                </div>
                <p className="text-sm text-white/70">Niveau {userProgress.level}</p>
              </div>
              {/* Bouton 2 : Déconnexion */}
<button
  onClick={handleLogout}
  style={{
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    transition: 'all 0.3s'
  }}
  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  title="Déconnexion"
>
  <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
</button>
            </div>
          </div>

          {/* Alerte Révisions */}
          {reviewStats.dueToday > 0 && (
            <div className="mb-4 bg-red-500/20 border-2 border-red-500 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-red-300" />
                <div className="flex-1">
                  <div className="font-bold text-lg">🔴 RÉVISIONS EN ATTENTE</div>
                  <div className="text-white/90">
                    Tu as {reviewStats.dueToday} sourate{reviewStats.dueToday > 1 ? 's' : ''} à réviser aujourd'hui !
                  </div>
                </div>
                {/* Bouton 3 : Réviser (dans l'alerte) */}
<button
  onClick={() => setCurrentTab('reviser')}
  style={{
    backgroundColor: '#ef4444',
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem 1.5rem',
    borderRadius: '0.5rem',
    transition: 'all 0.3s',
    transform: 'scale(1)'
  }}
  onMouseEnter={(e) => {
    e.target.style.backgroundColor = '#dc2626';
    e.target.style.transform = 'scale(1.05)';
  }}
  onMouseLeave={(e) => {
    e.target.style.backgroundColor = '#ef4444';
    e.target.style.transform = 'scale(1)';
  }}
>
  Réviser
</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
            <StatCard 
              icon={Flame} 
              value={userProgress.streak} 
              label="Jours de suite"
              gradient="from-orange-500 to-red-500"
            />
            <StatCard 
              icon={CheckCircle} 
              value={userProgress.learnedVerses} 
              label="Versets appris"
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard 
              icon={Target} 
              value={`${userProgress.todayProgress}/${userProgress.dailyGoal}`} 
              label="Objectif du jour"
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard 
              icon={TrendingUp} 
              value={`${Math.round((userProgress.learnedVerses / userProgress.totalVerses) * 100)}%`} 
              label="Progression"
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Niveau {userProgress.level}</span>
              <span>Niveau {userProgress.level + 1}</span>
            </div>
            <ProgressBar percentage={levelProgress} gradient="from-yellow-400 to-orange-500" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 bg-white/10 backdrop-blur-lg rounded-xl p-2">
          <button
      onClick={() => setCurrentTab('apprendre')}
      style={{
        backgroundColor: currentTab === 'apprendre' ? 'white' : 'rgba(255,255,255,0.1)',
        color: currentTab === 'apprendre' ? '#581c87' : 'rgba(255,255,255,0.7)'
      }}
      className="flex-1 py-3 rounded-lg font-semibold transition-all shadow-lg"
    >
      <BookOpen className="inline mr-2" size={20} />
      Apprendre
    </button>
          
           <button
      onClick={() => setCurrentTab('reviser')}
      style={{
        backgroundColor: currentTab === 'reviser' ? 'white' : 'rgba(255,255,255,0.1)',
        color: currentTab === 'reviser' ? '#581c87' : 'rgba(255,255,255,0.7)'
      }}
      className="flex-1 py-3 rounded-lg font-semibold transition-all shadow-lg relative"
    >
      <Brain className="inline mr-2" size={20} />
      Réviser
      {reviewStats.dueToday > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {reviewStats.dueToday}
        </span>
      )}
    </button>
          
          <button
      onClick={() => setCurrentTab('badges')}
      style={{
        backgroundColor: currentTab === 'badges' ? 'white' : 'rgba(255,255,255,0.1)',
        color: currentTab === 'badges' ? '#581c87' : 'rgba(255,255,255,0.7)'
      }}
      className="flex-1 py-3 rounded-lg font-semibold transition-all shadow-lg"
    >
      <Award className="inline mr-2" size={20} />
      Badges
    </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto">
        {currentTab === 'apprendre' && currentView === 'selection' && (
          <SurahSelectionPage
            surahs={surahs}
            learnedSurahs={learnedSurahs}
            onSelectSurah={handleSelectSurah}
            onBack={() => {}}
          />
        )}

        {currentTab === 'apprendre' && currentView === 'learning' && selectedSurah && (
          <FocusedLearningPage
            surah={selectedSurah}
            progress={verseProgress[selectedSurah.number] || 0}
            onLearnVerse={learnVerse}
            onChangeSurah={handleChangeSurah}
            onComplete={handleSurahComplete}
          />
        )}

        {currentTab === 'reviser' && (
          <RevisionPage
            surahReviews={surahReviews}
            surahs={surahs}
            onStartRevision={handleStartRevision}
            onReviewComplete={handleReviewComplete}
          />
        )}

        {currentTab === 'badges' && (
          <BadgesPage badges={badges} />
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-white/50 text-sm">
        <p>Mon Parcours Coranique • Mémorise avec la répétition espacée</p>
       {/* Bouton 1 : Revoir le tutoriel */}
{/* Bouton : Revoir le tutoriel */}
<button
  onClick={() => setShowOnboarding(true)}
  style={{
    marginTop: '0.5rem',
    textDecoration: 'underline',
    color: 'rgba(255, 255, 255, 0.5)',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem'
  }}
  onMouseEnter={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
>
  Revoir le tutoriel
</button>
      </div>
    </div>
  );
};

export default App;