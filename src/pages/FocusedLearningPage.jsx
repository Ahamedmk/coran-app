// src/pages/FocusedLearningPage.jsx
// Page focalisée sur UNE sourate à apprendre - AVEC AUDIO, RÉCITATEURS et TRADUCTION

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  ArrowLeft, 
  Info, 
  Sparkles, 
  Volume2, 
  User, 
  ChevronDown, 
  Play, 
  Pause 
} from 'lucide-react';
import { quranAPI } from '../services/quranAPI';
import { reciterService } from '../services/reciterService';
import ProgressBar from '../components/ProgressBar';
import { getSurahTopic } from '../data/surahTopics';


const FocusedLearningPage = ({ 
  surah, 
  progress, 
  onLearnVerse, 
  onChangeSurah, 
  onComplete,
  userId
}) => {
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // récitateurs
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [loadingReciters, setLoadingReciters] = useState(true);
  
  // audio
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingVerseId, setPlayingVerseId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const [surahPlaybackIndex, setSurahPlaybackIndex] = useState(0);
  
  // pages
  const [surahPages, setSurahPages] = useState({ startPage: 1, endPage: 1 });

  // refs audio
  const isPlayingSurahRef = useRef(false);
  const currentAudioRef = useRef(null);
  const surahDataRef = useRef(null);
  const selectedReciterRef = useRef(null);

  // refs répétition
  const repeatCountRef = useRef(1);
  const currentRepeatRef = useRef(0);

  // 🔵 ETATS TRADUCTION
  // pour ouvrir / fermer la traduction d’un seul verset
  const [openTranslations, setOpenTranslations] = useState({});
  // pour stocker toute la sourate traduite
  const [surahTranslation, setSurahTranslation] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  // bouton "tout afficher"
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  // garder refs à jour
  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  useEffect(() => {
    currentRepeatRef.current = currentRepeat;
  }, [currentRepeat]);

  useEffect(() => {
    surahDataRef.current = surahData;
  }, [surahData]);

  useEffect(() => {
    selectedReciterRef.current = selectedReciter;
  }, [selectedReciter]);

  // helper scroll
  const scrollToVerse = (verseNumber) => {
    const verseEl = document.getElementById(`verse-${verseNumber}`);
    if (verseEl) {
      verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const container = document.getElementById('verses-container');
    if (container && verseEl) {
      const containerRect = container.getBoundingClientRect();
      const verseRect = verseEl.getBoundingClientRect();
      const offset = verseRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2) + (verseRect.height / 2);
      container.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  // charger récitateurs
  useEffect(() => {
    const loadReciters = async () => {
      setLoadingReciters(true);
      const recitersData = await reciterService.getReciters();
      setReciters(recitersData);
      
      if (userId) {
        const preferredReciter = await reciterService.getPreferredReciter(userId);
        const found = recitersData.find(r => r.id === preferredReciter.id);
        setSelectedReciter(found || recitersData[0]);
      } else {
        setSelectedReciter(recitersData[0]);
      }
      
      setLoadingReciters(false);
    };
    
    loadReciters();
  }, [userId]);

  // charger sourate arabe
  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      surahDataRef.current = data;

      const pages = reciterService.getSurahPages(surah);
      setSurahPages(pages);

      // à chaque changement de sourate on réinitialise les traductions
      setSurahTranslation(null);
      setOpenTranslations({});
      setShowAllTranslations(false);
      
      setLoading(false);
    };
    loadSurahData();
  }, [surah.number, surah.englishName]);

  // nettoyage
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // scroll auto UNIQUEMENT lecture sourate
  useEffect(() => {
    if (playingVerseId && isPlayingSurahRef.current) {
      const container = document.getElementById('verses-container');
      const verseEl = document.getElementById(`verse-${playingVerseId}`);
      if (container && verseEl) {
        const containerRect = container.getBoundingClientRect();
        const verseRect = verseEl.getBoundingClientRect();
        const offset = verseRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2) + (verseRect.height / 2);
        container.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      } else if (verseEl) {
        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingVerseId]);

  // =================== TRADUCTION ===================

  // bouton FR sur 1 seul verset
  const handleToggleTranslation = async (verseNumber) => {
    // si on a déjà la sourate traduite → on lit dedans
    if (surahTranslation && surahTranslation.ayahs) {
      setOpenTranslations((prev) => ({
        ...prev,
        [verseNumber]: !prev[verseNumber]
      }));
      return;
    }

    // sinon on va chercher UNIQUEMENT ce verset
    try {
      const tr = await quranAPI.getVerseTranslation(surah.number, verseNumber, 'fr.hamidullah');
      if (!tr) return;
      setOpenTranslations((prev) => ({
        ...prev,
        [verseNumber]: !prev[verseNumber],
        // on peut aussi stocker le texte pour éviter de le redemander, mais on a déjà un service qui met en cache
      }));
    } catch (err) {
      console.error('Erreur de traduction :', err);
    }
  };

  // bouton "traduire toute la sourate"
  const handleToggleAllTranslations = async () => {
    // si on a déjà la trad → on fait juste afficher/masquer
    if (surahTranslation) {
      setShowAllTranslations((prev) => !prev);
      return;
    }
    // sinon on la télécharge
    setLoadingTranslation(true);
    const data = await quranAPI.getSurahTranslation(surah.number, 'fr.hamidullah');
    setSurahTranslation(data);
    setLoadingTranslation(false);
    setShowAllTranslations(true);
  };

  // =================================================
  //                   AUDIO
  // =================================================

  const handleReciterChange = async (reciter) => {
    setSelectedReciter(reciter);
    setShowReciterMenu(false);
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setCurrentAudio(null);
    setPlayingVerseId(null);
    setIsPlaying(false);
    setIsPlayingSurah(false);
    isPlayingSurahRef.current = false;
    
    if (userId) {
      try {
        await reciterService.savePreferredReciter(userId, reciter);
      } catch (error) {
        console.error('Erreur sauvegarde récitateur:', error);
      }
    }
  };

  const playVerseAudio = async (verseNumber, isAutoRepeat = false) => {
    // reset compteur si clic manuel
    if (!isAutoRepeat) {
      setCurrentRepeat(0);
      currentRepeatRef.current = 0;
    }

    // pause si même verset
    if (playingVerseId === verseNumber && isPlaying && !isAutoRepeat) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // reprendre si en pause
    if (playingVerseId === verseNumber && !isPlaying && !isAutoRepeat) {
      if (currentAudioRef.current) {
        currentAudioRef.current.play();
        setIsPlaying(true);
        return;
      }
    }

    // stop précédent
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // sortir du mode "sourate"
    setIsPlayingSurah(false);
    isPlayingSurahRef.current = false;

    const audioUrl = await reciterService.getVerseAudioUrl(
      selectedReciterRef.current.id,
      surah.number,
      verseNumber
    );

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    setCurrentAudio(audio);
    setPlayingVerseId(verseNumber);

    audio.onloadeddata = () => {
      audio.play();
      setIsPlaying(true);
    };

    audio.onended = () => {
      const currentRep = currentRepeatRef.current;
      const maxRep = repeatCountRef.current;
      const next = currentRep + 1;

      if (next < maxRep) {
        currentRepeatRef.current = next;
        setCurrentRepeat(next);
        setTimeout(() => {
          playVerseAudio(verseNumber, true);
        }, 200);
      } else {
        currentRepeatRef.current = 0;
        setCurrentRepeat(0);
        setPlayingVerseId(null);
        setIsPlaying(false);
        currentAudioRef.current = null;
      }
    };

    audio.onerror = (e) => {
      console.error('❌ Erreur audio:', e);
      alert(`Erreur lors du chargement de l'audio.\n\nURL: ${audioUrl}\n\nCe récitateur ne supporte peut-être pas tous les versets.\nEssaie Mishary Alafasy.`);
      setPlayingVerseId(null);
      setIsPlaying(false);
      setCurrentRepeat(0);
      currentRepeatRef.current = 0;
      currentAudioRef.current = null;
    };
  };

  // lecture sourate complète
  const playNextVerseInSurah = async (index) => {
    const data = surahDataRef.current;
    if (!isPlayingSurahRef.current) return;
    if (!data || !data.ayahs || index >= data.ayahs.length) {
      setIsPlayingSurah(false);
      isPlayingSurahRef.current = false;
      setPlayingVerseId(null);
      setIsPlaying(false);
      currentAudioRef.current = null;
      setSurahPlaybackIndex(0);
      return;
    }

    const verseNumber = index + 1;
    const audioUrl = await reciterService.getVerseAudioUrl(
      selectedReciterRef.current.id,
      surah.number,
      verseNumber
    );

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onloadeddata = () => {
      if (!isPlayingSurahRef.current) {
        audio.pause();
        return;
      }
      audio.play();
      setIsPlaying(true);
      setPlayingVerseId(verseNumber);
      setSurahPlaybackIndex(index);
    };

    audio.onended = () => {
      setTimeout(() => {
        if (isPlayingSurahRef.current) {
          playNextVerseInSurah(index + 1);
        }
      }, 200);
    };

    audio.onerror = (e) => {
      console.error('❌ Erreur audio verset:', verseNumber, e);
      setTimeout(() => {
        if (isPlayingSurahRef.current) {
          playNextVerseInSurah(index + 1);
        }
      }, 200);
    };
  };

  const playSurahAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingVerseId(null);
    setIsPlaying(false);
    setCurrentRepeat(0);
    
    if (isPlayingSurahRef.current) {
      setIsPlayingSurah(false);
      isPlayingSurahRef.current = false;
      setPlayingVerseId(null);
      setSurahPlaybackIndex(0);
      return;
    }

    // scroll direct vers le premier
    scrollToVerse(1);

    setPlayingVerseId(1);
    setIsPlayingSurah(true);
    isPlayingSurahRef.current = true;
    setSurahPlaybackIndex(0);
    playNextVerseInSurah(0);
  };

  // mémorisation
  const handleLearnVerse = () => {
    onLearnVerse();
    
    if (progress + 1 === surah.numberOfAyahs) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete();
      }, 3000);
    }
  };

  const progressPercentage = ((progress || 0) / surah.numberOfAyahs) * 100;
  const versesLeft = surah.numberOfAyahs - (progress || 0);

  if (loading || loadingReciters) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-12 text-center max-w-md animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold mb-4">Masha'Allah !</h2>
            <p className="text-xl mb-6">
              Tu as complété {surah.englishName} !
            </p>
            <p className="text-white/90">
              {surah.numberOfAyahs} versets mémorisés
            </p>
            <p className="text-sm mt-4 text-white/80">
              Ajouté aux révisions automatiquement ✨
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <button
            onClick={onChangeSurah}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Changer de sourate</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* écouter sourate */}
            <button
              onClick={playSurahAudio}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: isPlayingSurah ? '#22c55e' : 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                transition: 'all 0.3s',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                if (!isPlayingSurah) e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                if (!isPlayingSurah) e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              }}
            >
              {isPlayingSurah ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>
                {isPlayingSurah 
                  ? `Arrêter (${playingVerseId}/${surah.numberOfAyahs})` 
                  : 'Écouter sourate'}
              </span>
            </button>

            {/* 🔵 bouton traduction de toute la sourate */}
            <button
              onClick={handleToggleAllTranslations}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                backgroundColor: showAllTranslations ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {loadingTranslation ? 'Chargement...' : showAllTranslations ? 'Masquer FR' : 'Traduire la sourate'}
            </button>

            {/* Sélecteur de récitateur */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowReciterMenu(!showReciterMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  transition: 'all 0.3s',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'}
              >
                <User className="w-5 h-5" />
                <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>
                  {selectedReciter?.reciter_name || 'Récitateur'}
                </span>
                <ChevronDown style={{
                  width: '1rem',
                  height: '1rem',
                  transition: 'transform 0.3s',
                  transform: showReciterMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
              </button>

              {showReciterMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  maxHeight: '24rem',
                  overflowY: 'auto',
                  zIndex: 20,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  minWidth: '300px'
                }}>
                  {reciters.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => handleReciterChange(reciter)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        transition: 'background-color 0.2s',
                        color: '#1f2937',
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: '500' }}>{reciter.reciter_name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {reciter.style || 'Style standard'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">{surah.englishName}</h1>
          <div className="text-5xl mb-4">{surah.name}</div>
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="text-sm px-3 py-1 rounded-full bg-blue-500">
              {surah.numberOfAyahs} versets
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500">
              {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-amber-500">
              📄 Pages {surahPages.startPage}-{surahPages.endPage}
            </span>
          </div>
        </div>

        {/* progression */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Ta progression</span>
            <span className="text-green-400 font-bold">
              {progress || 0} / {surah.numberOfAyahs} versets
            </span>
          </div>
          <ProgressBar percentage={progressPercentage} gradient="from-green-400 to-emerald-500" />
          <div className="text-center mt-2 text-sm text-white/60">
            {versesLeft === 0 ? (
              <span className="text-green-400 font-bold">✨ Sourate complétée ! ✨</span>
            ) : (
              <span>Plus que {versesLeft} verset{versesLeft > 1 ? 's' : ''} !</span>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-white/70">Complété</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{progress || 0}</div>
            <div className="text-xs text-white/70">Mémorisés</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{versesLeft}</div>
            <div className="text-xs text-white/70">Restants</div>
          </div>
        </div>
      </div>

      {/* contexte */}
      {/* À propos de cette sourate */}
{(() => {
  const topic = getSurahTopic(surah.number);
  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
      <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
        <Info className="text-amber-400" />
        {topic.title}
      </h2>
      <p className="text-white/90 leading-relaxed">
        {topic.summary}
      </p>
    </div>
  );
})()}


      {/* bloc verset à apprendre */}
      {versesLeft > 0 && surahData?.ayahs && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-400" />
              Verset à mémoriser
            </h2>
            <span className="text-lg text-white/60">
              #{(progress || 0) + 1}
            </span>
          </div>

          <div className="bg-black/20 rounded-xl p-8 mb-6">
            <div className="text-4xl md:text-5xl leading-loose text-right mb-4">
              {surahData.ayahs[progress || 0]?.text}
            </div>
            <div className="flex items-center justify-between text-sm text-white/50 flex-wrap gap-3">
              <span>Verset {surahData.ayahs[progress || 0]?.numberInSurah} sur {surah.numberOfAyahs}</span>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* menu répétition */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowRepeatMenu(!showRepeatMenu)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      transition: 'all 0.3s',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'}
                  >
                    <span>Répéter {repeatCount}x</span>
                    <ChevronDown style={{
                      width: '1rem',
                      height: '1rem',
                      transition: 'transform 0.3s',
                      transform: showRepeatMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} />
                  </button>

                  {showRepeatMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      zIndex: 20,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      minWidth: '150px'
                    }}>
                      {[1, 2, 3, 5, 7, 10].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setRepeatCount(count);
                            setShowRepeatMenu(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.75rem 1rem',
                            transition: 'background-color 0.2s',
                            color: repeatCount === count ? '#7c3aed' : '#1f2937',
                            fontWeight: repeatCount === count ? '600' : '400',
                            borderBottom: '1px solid #f3f4f6',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {count === 1 ? '1 fois' : `${count} fois`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* bouton audio verset */}
                <button
                  onClick={() => {
                    setCurrentRepeat(0);
                    playVerseAudio((progress || 0) + 1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: playingVerseId === ((progress || 0) + 1) && isPlaying 
                      ? '#3b82f6' 
                      : 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!(playingVerseId === ((progress || 0) + 1) && isPlaying)) {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(playingVerseId === ((progress || 0) + 1) && isPlaying)) {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    }
                  }}
                >
                  {playingVerseId === ((progress || 0) + 1) && isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>{currentRepeat > 0 ? `${currentRepeat}/${repeatCount}` : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>Écouter</span>
                    </>
                  )}
                </button>

                {/* bouton FR du verset en cours */}
                <button
                  onClick={() => handleToggleTranslation((progress || 0) + 1)}
                  style={{
                    width: '2.4rem',
                    height: '2.4rem',
                    borderRadius: '9999px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    background: openTranslations[(progress || 0) + 1] ? 'white' : 'rgba(255,255,255,0.1)',
                    color: openTranslations[(progress || 0) + 1] ? '#1f2937' : 'white',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  FR
                </button>
              </div>
            </div>

            {/* ✅ affichage traduction pour le verset courant */}
            {(openTranslations[(progress || 0) + 1] || (showAllTranslations && surahTranslation)) && (
              <div
                style={{
                  marginTop: '1rem',
                  background: 'rgba(15, 23, 42, 0.35)',
                  borderLeft: '4px solid rgba(251, 191, 36, 1)',
                  borderRadius: '0.75rem',
                  padding: '0.9rem 1rem'
                }}
              >
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: '#fef9c3',
                    fontFamily: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    letterSpacing: '0.01em'
                  }}
                >
                  {showAllTranslations && surahTranslation
                    ? surahTranslation.ayahs[(progress || 0)]?.text
                    : null}
                  {!showAllTranslations && !surahTranslation
                    ? '...'
                    : null}
                </p>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
                  Traduction française • {surahTranslation?.edition?.name || 'fr.hamidullah'}
                </span>
              </div>
            )}
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="text-sm">
              <strong>💡 Astuce :</strong> Écoute le verset avec {selectedReciter?.reciter_name}, lis-le plusieurs fois à haute voix, puis essaie de le réciter de mémoire avant de valider.
            </div>
          </div>

          <button
            onClick={handleLearnVerse}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #22c55e, #10b981)',
              color: 'white',
              fontWeight: 'bold',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              transition: 'all 0.3s',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '1.25rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #059669)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #10b981)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✨ Verset mémorisé (+20 points)
          </button>
        </div>
      )}

      {/* TOUS LES VERSETS */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-400" />
          Tous les versets
        </h2>
        <p className="text-white/70 text-sm mb-4">
          Consulte l'ensemble de la sourate • Le verset en cours de lecture est mis en évidence
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2" id="verses-container">
          {surahData?.ayahs?.map((ayah, index) => {
            const isCurrentlyPlaying = playingVerseId === ayah.numberInSurah && isPlaying && !isPlayingSurah;
            const isSurahPlayingThisVerse = isPlayingSurah && playingVerseId === ayah.numberInSurah;
            const isTranslationOpen =
              showAllTranslations ||
              openTranslations[ayah.numberInSurah];

            return (
              <div
                key={index}
                id={`verse-${ayah.numberInSurah}`}
                style={{
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '2px solid',
                  transition: 'all 0.3s',
                  borderColor: (isCurrentlyPlaying || isSurahPlayingThisVerse)
                    ? '#3b82f6'
                    : index < (progress || 0)
                    ? 'rgba(34, 197, 94, 0.3)'
                    : index === (progress || 0)
                    ? '#a855f7'
                    : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: (isCurrentlyPlaying || isSurahPlayingThisVerse)
                    ? 'rgba(59, 130, 246, 0.3)'
                    : index < (progress || 0)
                    ? 'rgba(34, 197, 94, 0.1)'
                    : index === (progress || 0)
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: (isCurrentlyPlaying || isSurahPlayingThisVerse)
                    ? '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.4)' 
                    : index === (progress || 0) 
                    ? '0 0 0 2px #a855f7' 
                    : 'none',
                  transform: (isCurrentlyPlaying || isSurahPlayingThisVerse) ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: (isCurrentlyPlaying || isSurahPlayingThisVerse) ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontWeight: (isCurrentlyPlaying || isSurahPlayingThisVerse) ? 'bold' : 'normal'
                    }}>
                      Verset {ayah.numberInSurah}
                    </span>
                    {isCurrentlyPlaying && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}>
                        🔊 En lecture {currentRepeat > 0 ? `${currentRepeat}/${repeatCount}` : ''}
                      </span>
                    )}
                    {isSurahPlayingThisVerse && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}>
                        🔊 Sourate {ayah.numberInSurah}/{surah.numberOfAyahs}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* bouton FR par verset */}
                    <button
                      onClick={() => handleToggleTranslation(ayah.numberInSurah)}
                      style={{
                        width: '2.4rem',
                        height: '2.4rem',
                        borderRadius: '9999px',
                        border: '2px solid rgba(255,255,255,0.35)',
                        background: isTranslationOpen ? 'white' : 'rgba(255,255,255,0.1)',
                        color: isTranslationOpen ? '#1f2937' : 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      FR
                    </button>
                    {index < (progress || 0) && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    {index === (progress || 0) && !isCurrentlyPlaying && !isSurahPlayingThisVerse && (
                      <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="text-2xl md:text-3xl leading-loose text-right" style={{ color: 'white' }}>
                  {ayah.text}
                </div>

                {/* ✅ bloc traduction stylé */}
                {isTranslationOpen && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.35)',
                      borderLeft: '4px solid rgba(251, 191, 36, 1)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.9rem',
                        lineHeight: 1.55,
                        color: '#fef9c3',
                        fontFamily: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        letterSpacing: '0.01em'
                      }}
                    >
                      {surahTranslation?.ayahs
                        ? surahTranslation.ayahs[index]?.text
                        : 'Chargement...'}
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                      Traduction française • {surahTranslation?.edition?.name || 'fr.hamidullah'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// helper contexte


export default FocusedLearningPage;
