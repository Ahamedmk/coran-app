// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Trophy, Flame, CheckCircle, Target, Award, TrendingUp, Brain, LogOut,
} from 'lucide-react';

import { quranAPI } from './services/quranAPI';
import { revisionService } from './services/revisionService';
import { authService } from './services/authService';
import { progressService } from './services/progressService';

// Composants
import StatCard from './components/StatCard';
import ProgressBar from './components/ProgressBar';
import BadgesPage from './pages/BadgesPage';
import RevisionPage from './pages/RevisionPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import SurahSelectionPage from './pages/SurahSelectionPage';
import FocusedLearningPage from './pages/FocusedLearningPage';
import StatsPage from './pages/StatsPage';

const App = () => {
  /** ------------------------
   *  Auth & Onboarding
   *  ------------------------ */
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  /** ------------------------
   *  Navigation
   *  ------------------------ */
  const [currentTab, setCurrentTab] = useState('apprendre'); // 'apprendre' | 'reviser' | 'badges' | 'stats'
  const [currentView, setCurrentView] = useState('selection'); // 'selection' | 'learning'
  const [selectedSurah, setSelectedSurah] = useState(null);

  /** ------------------------
   *  Données
   *  ------------------------ */
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
    todayProgress: 0,
  });

  // Progression par sourate : { [surahNumber]: versesLearned }
  const [verseProgress, setVerseProgress] = useState({});
  const [learnedSurahs, setLearnedSurahs] = useState([]);

  /** ------------------------
   *  Révisions
   *  ------------------------ */
  const [surahReviews, setSurahReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    dueToday: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
    averageDifficulty: 0,
    totalReviewsDone: 0,
  });

  /** ------------------------
   *  UI (icônes responsive)
   *  ------------------------ */
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const iconSize = useMemo(() => (vw < 640 ? 16 : 20), [vw]);

  /** ------------------------
   *  Badges
   *  ------------------------ */
  const badges = useMemo(() => ([
    { name: 'Premier Pas', icon: '🌟', earned: userProgress.learnedVerses > 0, desc: 'Premier verset mémorisé' },
    { name: 'Assidu', icon: '🔥', earned: userProgress.streak >= 7, desc: '7 jours consécutifs' },
    { name: 'Érudit', icon: '📚', earned: userProgress.learnedVerses >= 100, desc: '100 versets appris' },
    { name: 'Champion', icon: '🏆', earned: userProgress.level >= 20, desc: 'Niveau 20 atteint' },
  ]), [userProgress]);

  /** ------------------------
   *  Auth au démarrage
   *  ------------------------ */
  useEffect(() => {
    const boot = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setShowOnboarding(!currentUser.onboarding_completed);
        }
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  /** ------------------------
   *  Chargement des données
   *  ------------------------ */
  useEffect(() => {
    if (user && !showOnboarding) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showOnboarding]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // 1) Sourates
      const surahsData = await quranAPI.getAllSurahs();
      setSurahs(surahsData || []);

      // 2) Progression persistée (Supabase)
      const progressData = await progressService.loadUserProgress(user.id);
      if (progressData.success) {
        setUserProgress(progressData.userProgress);
        setVerseProgress(progressData.verseProgress);
        setLearnedSurahs(progressData.learnedSurahs);
      }

      // 3) Révisions (Supabase)
      const reviews = await revisionService.getUserReviews(user.id);
      setSurahReviews(reviews);
      const stats = await revisionService.getReviewStats(user.id);
      setReviewStats(stats);
    } catch (e) {
      console.error('Erreur chargement données:', e);
    } finally {
      setLoading(false);
    }
  };

  /** ------------------------
   *  Handlers Auth/Onboarding
   *  ------------------------ */
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowOnboarding(!authenticatedUser.onboarding_completed);
  };

  const handleOnboardingComplete = async () => {
    if (user) {
      await authService.completeOnboarding(user.id);
      const updated = { ...user, onboarding_completed: true };
      setUser(updated);
      localStorage.setItem('coran_user', JSON.stringify(updated));
    }
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setCurrentTab('apprendre');
    setCurrentView('selection');
    setSelectedSurah(null);
    setUserProgress({
      streak: 0,
      totalVerses: 6236,
      learnedVerses: 0,
      points: 0,
      level: 1,
      dailyGoal: 10,
      todayProgress: 0,
    });
    setVerseProgress({});
    setLearnedSurahs([]);
    setSurahReviews([]);
    setReviewStats({
      total: 0, dueToday: 0, learning: 0, reviewing: 0, mastered: 0, averageDifficulty: 0, totalReviewsDone: 0,
    });
  };

  const refreshReviewStats = async () => {
    if (!user) return;
    const reviews = await revisionService.getUserReviews(user.id);
    setSurahReviews(reviews);
    const stats = await revisionService.getReviewStats(user.id);
    setReviewStats(stats);
  };

  /** ------------------------
   *  Apprentissage d’un verset (persistant)
   *  ------------------------ */
  const learnVerse = async () => {
    if (!selectedSurah || !user) return;

    try {
      const result = await progressService.learnVerse(
        user.id,
        selectedSurah.number,
        selectedSurah.numberOfAyahs,
      );

      if (!result.success) {
        console.error('Erreur sauvegarde progression:', result.error);
        alert('Erreur lors de la sauvegarde de ta progression');
        return;
      }

      // État local
      setVerseProgress((prev) => ({
        ...prev,
        [selectedSurah.number]: result.newVersesLearned,
      }));

      setUserProgress((prev) => {
        const learned = prev.learnedVerses + 1;
        const today = Math.min(prev.todayProgress + 1, prev.dailyGoal);
        return {
          ...prev,
          learnedVerses: learned,
          points: result.newPoints,
          level: result.newLevel,
          todayProgress: today,
        };
      });

      // Confetti simple tous les 10 versets appris
      if (((userProgress.learnedVerses + 1) % 10) === 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }

      // Sourate complétée → créer révision
      if (result.isCompleted) {
        setLearnedSurahs((prev) => [...new Set([...prev, selectedSurah.number])]);
        const reviewResult = await revisionService.createReview(user.id, selectedSurah.number);
        if (reviewResult.success) await refreshReviewStats();
      }
    } catch (e) {
      console.error('Erreur learnVerse:', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  /** ------------------------
   *  Révision
   *  ------------------------ */
  const handleStartRevision = async (surahId) => {
    console.log(`🧠 Début révision sourate ${surahId}`);
  };

  const handleReviewComplete = async (surahId, difficulty) => {
    if (!user) return;

    const result = await revisionService.updateReview(user.id, surahId, difficulty);
    if (!result.success) return;

    const gain = ({ 0: 5, 1: 10, 2: 20, 3: 30, 4: 40 })[difficulty] ?? 20;

    // Points & level côté UI
    setUserProgress((prev) => {
      const newPts = prev.points + gain;
      return {
        ...prev,
        points: newPts,
        level: Math.floor(newPts / 500) + 1,
      };
    });

    // 🔴 Ajout clé : persister la révision du jour (reviews_completed + points_earned)
    await progressService.addReviewResult(user.id, gain);

    // Rafraîchir stats de révision
    await refreshReviewStats();

    const msgs = {
      0: '❌ Pas de souci ! Tu vas la revoir bientôt.',
      1: '😰 C’est difficile mais tu progresses !',
      2: '🤔 Bien ! Continue comme ça.',
      3: '😊 Très bien ! La mémorisation se renforce.',
      4: '🌟 Parfait ! Excellente mémorisation !',
    };
    const surah = surahs.find((s) => s.number === surahId);
    alert(
      `${msgs[difficulty]}\n\n${surah?.englishName}\n+${gain} points\n\n📅 Prochaine révision : dans ${result.newInterval} jour${result.newInterval > 1 ? 's' : ''}`,
    );
  };

  /** ------------------------
   *  Helpers UI
   *  ------------------------ */
  const levelProgress = ((userProgress.points % 500) / 500) * 100;

  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setCurrentView('learning');
  };
  const handleChangeSurah = () => setCurrentView('selection');
  const handleSurahComplete = () => {
    setCurrentView('selection');
    setSelectedSurah(null);
  };

  /** ------------------------
   *  Rendus
   *  ------------------------ */
  if (!user) return <AuthPage onAuthSuccess={handleAuthSuccess} />;

  if (showOnboarding) {
    return (
      <OnboardingPage
        onComplete={handleOnboardingComplete}
        userName={user.name || 'Utilisateur'}
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(to bottom right, #312e81, #7e22ce, #ec4899)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '1rem' }}>📖</div>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}>Chargement…</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            Préparation de ton parcours
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #312e81, #7e22ce, #ec4899)',
        color: 'white',
        padding: 'clamp(0.5rem, 2vw, 1.5rem)',
        width: '100%',
      }}
    >
      {/* Confetti simple */}
      {showCelebration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}>🎉</div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: 'clamp(1rem, 2vw, 1.5rem)',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Salam {user.name} ! 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                Continue ton voyage spirituel
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold' }}>
                  <Trophy style={{ color: '#fbbf24', width: 'clamp(1.5rem, 4vw, 2rem)', height: 'clamp(1.5rem, 4vw, 2rem)' }} />
                  <span>{userProgress.points}</span>
                </div>
                <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: 'rgba(255,255,255,0.7)' }}>
                  Niveau {userProgress.level}
                </p>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                title="Déconnexion"
              >
                <LogOut style={{ width: 'clamp(1rem, 3vw, 1.25rem)', height: 'clamp(1rem, 3vw, 1.25rem)' }} />
              </button>
            </div>
          </div>

          {/* Alerte Révisions */}
          {reviewStats.dueToday > 0 && (
            <div
              style={{
                marginBottom: '1rem',
                backgroundColor: 'rgba(239,68,68,0.2)',
                border: '2px solid #ef4444',
                borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', flexWrap: 'wrap' }}>
                <Brain style={{ width: 'clamp(1.5rem, 4vw, 2rem)', height: 'clamp(1.5rem, 4vw, 2rem)', color: '#fca5a5', flexShrink: 0 }} />
                <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}>🔴 RÉVISIONS EN ATTENTE</div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    Tu as {reviewStats.dueToday} sourate{reviewStats.dueToday > 1 ? 's' : ''} à réviser aujourd’hui !
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('reviser')}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                    borderRadius: '0.5rem',
                    transition: 'all 0.3s',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Réviser
                </button>
              </div>
            </div>
          )}

          {/* KPI */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 4fr))',
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              marginBottom: '1rem',
            }}
          >
            <StatCard icon={Flame} value={userProgress.streak} label="Jours de suite" gradient="from-orange-500 to-red-500" />
            <StatCard icon={CheckCircle} value={userProgress.learnedVerses} label="Versets appris" gradient="from-green-500 to-emerald-500" />
            <StatCard icon={Target} value={`${userProgress.todayProgress}/${userProgress.dailyGoal}`} label="Objectif du jour" gradient="from-blue-500 to-cyan-500" />
            <StatCard
              icon={TrendingUp}
              value={`${Math.round((userProgress.learnedVerses / userProgress.totalVerses) * 100)}%`}
              label="Progression"
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          {/* Barre de niveau */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', marginBottom: '0.5rem' }}>
              <span>Niveau {userProgress.level}</span>
              <span>Niveau {userProgress.level + 1}</span>
            </div>
            <ProgressBar percentage={levelProgress} gradient="from-yellow-400 to-orange-500" />
          </div>
        </div>

        {/* Nav */}
        <div style={{ marginBottom: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <div
            style={{
              display: 'flex',
              gap: 'clamp(0.25rem, 1vw, 0.5rem)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setCurrentTab('apprendre')}
              style={{
                backgroundColor: currentTab === 'apprendre' ? 'white' : 'rgba(255,255,255,0.1)',
                color: currentTab === 'apprendre' ? '#581c87' : 'rgba(255,255,255,0.7)',
                flex: '1 1 auto',
                minWidth: '100px',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                borderRadius: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <BookOpen size={iconSize} />
              <span style={{ display: vw < 400 ? 'none' : 'inline' }}>Apprendre</span>
            </button>

            <button
              onClick={() => setCurrentTab('reviser')}
              style={{
                backgroundColor: currentTab === 'reviser' ? 'white' : 'rgba(255,255,255,0.1)',
                color: currentTab === 'reviser' ? '#581c87' : 'rgba(255,255,255,0.7)',
                flex: '1 1 auto',
                minWidth: '100px',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                borderRadius: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              <Brain size={iconSize} />
              <span style={{ display: vw < 400 ? 'none' : 'inline' }}>Réviser</span>
              {reviewStats.dueToday > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                    fontWeight: 'bold',
                    borderRadius: '9999px',
                    width: 'clamp(1.25rem, 3vw, 1.5rem)',
                    height: 'clamp(1.25rem, 3vw, 1.5rem)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                >
                  {reviewStats.dueToday}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('badges')}
              style={{
                backgroundColor: currentTab === 'badges' ? 'white' : 'rgba(255,255,255,0.1)',
                color: currentTab === 'badges' ? '#581c87' : 'rgba(255,255,255,0.7)',
                flex: '1 1 auto',
                minWidth: '100px',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                borderRadius: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Award size={iconSize} />
              <span style={{ display: vw < 400 ? 'none' : 'inline' }}>Badges</span>
            </button>

            <button
              onClick={() => setCurrentTab('stats')}
              style={{
                backgroundColor: currentTab === 'stats' ? 'white' : 'rgba(255,255,255,0.1)',
                color: currentTab === 'stats' ? '#581c87' : 'rgba(255,255,255,0.7)',
                flex: '1 1 auto',
                minWidth: '100px',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                borderRadius: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <TrendingUp size={iconSize} />
              <span style={{ display: vw < 400 ? 'none' : 'inline' }}>Stats</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div>
          {currentTab === 'apprendre' && currentView === 'selection' && (
            <SurahSelectionPage
              surahs={surahs}
              learnedSurahs={learnedSurahs}
              onSelectSurah={handleSelectSurah}
              hideLearned={false}        // ⬅️ on enlève les sourates déjà apprises
   showLearnedBadge={true} // (optionnel) utile seulement si hideLearned={false}
            />
          )}

          {currentTab === 'apprendre' && currentView === 'learning' && selectedSurah && (
            <FocusedLearningPage
              surah={selectedSurah}
              progress={verseProgress[selectedSurah.number] || 0}
              onLearnVerse={learnVerse}
              onChangeSurah={handleChangeSurah}
              onComplete={handleSurahComplete}
              userId={user.id}
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

          {currentTab === 'badges' && <BadgesPage badges={badges} />}

          {currentTab === 'stats' && <StatsPage userId={user.id} />}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'clamp(2rem, 4vw, 3rem)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            padding: '0 1rem',
          }}
        >
          <p>Mon Parcours Coranique • Mémorise avec la répétition espacée</p>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              marginTop: '0.5rem',
              textDecoration: 'underline',
              color: 'rgba(255,255,255,0.5)',
              transition: 'color 0.3s',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            Revoir le tutoriel
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
