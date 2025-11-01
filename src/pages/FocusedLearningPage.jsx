// src/pages/FocusedLearningPage.jsx
// Page focalisée sur UNE sourate à apprendre - AVEC AUDIO ET RÉCITATEURS

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, ArrowLeft, Info, Sparkles, Volume2, User, ChevronDown, Play, Pause } from 'lucide-react';
import { quranAPI } from '../services/quranAPI';
import { reciterService } from '../services/reciterService';
import ProgressBar from '../components/ProgressBar';

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
  
  // États pour les récitateurs
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [loadingReciters, setLoadingReciters] = useState(true);
  
  // États pour l'audio
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingVerseId, setPlayingVerseId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const [surahPlaybackIndex, setSurahPlaybackIndex] = useState(0);
  
  // États pour les pages
  const [surahPages, setSurahPages] = useState({ startPage: 1, endPage: 1 });

  // refs
  const isPlayingSurahRef = useRef(false);
  const currentAudioRef = useRef(null);
  const surahDataRef = useRef(null);
  const selectedReciterRef = useRef(null);

   // 🔁 refs pour la répétition d’un verset
  const repeatCountRef = useRef(1);
  const currentRepeatRef = useRef(0);

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

  // 🔧 helper scroll
  const scrollToVerse = (verseNumber) => {
    const verseEl = document.getElementById(`verse-${verseNumber}`);
    // scroll de la page (comme avant)
    if (verseEl) {
      verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // scroll du container (si on est dans le bloc)
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

  // Charger les récitateurs au démarrage
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

  // Charger les données de la sourate
  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      surahDataRef.current = data;

      const pages = reciterService.getSurahPages(surah);
      setSurahPages(pages);
      
      setLoading(false);
    };
    loadSurahData();
  }, [surah.number]);

  // Nettoyer l'audio quand on quitte
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // 🔧 Scroll automatique quand UN verset est en lecture (lecture manuelle ou lecture sourate)
    // 🔧 Scroll automatique UNIQUEMENT quand la sourate est en lecture
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
    // si on rejoue manuellement un verset → on reset le compteur
    if (!isAutoRepeat) {
      setCurrentRepeat(0);
      currentRepeatRef.current = 0;
    }

    // si on est en train de jouer ce verset et que l'utilisateur reclique → pause
    if (playingVerseId === verseNumber && isPlaying && !isAutoRepeat) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // si on relance le même verset en pause → play
    if (playingVerseId === verseNumber && !isPlaying && !isAutoRepeat) {
      if (currentAudioRef.current) {
        currentAudioRef.current.play();
        setIsPlaying(true);
        return;
      }
    }

    // arrêter tout audio précédent
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // arrêter la lecture de la sourate si elle était en cours
    setIsPlayingSurah(false);
    isPlayingSurahRef.current = false;

    // ⚠️ PAS de scroll ici → tu l’as demandé
    // (on ne scrolle que dans la lecture complète)

    // récupérer l'audio
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
      // on lit les valeurs *fraîches* depuis les refs
      const currentRep = currentRepeatRef.current;
      const maxRep = repeatCountRef.current;

      const next = currentRep + 1;

      if (next < maxRep) {
        // on met à jour le ref + le state
        currentRepeatRef.current = next;
        setCurrentRepeat(next);

        setTimeout(() => {
          // on relance en mode auto
          playVerseAudio(verseNumber, true);
        }, 200);
      } else {
        // fin des répétitions
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


  // lecture sourate verset par verset
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
    // stop audio verset
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingVerseId(null);
    setIsPlaying(false);
    setCurrentRepeat(0);
    
    // si déjà en lecture → stop
    if (isPlayingSurahRef.current) {
      setIsPlayingSurah(false);
      isPlayingSurahRef.current = false;
      setPlayingVerseId(null);
      setSurahPlaybackIndex(0);
      return;
    }

    // 🔥 ICI : scroll immédiat vers le premier verset
    // on le fait AVANT de lancer la lecture
    scrollToVerse(1);

    // on dit tout de suite : "le verset en cours c'est 1"
    setPlayingVerseId(1);

    // démarrer
    setIsPlayingSurah(true);
    isPlayingSurahRef.current = true;
    setSurahPlaybackIndex(0);
    playNextVerseInSurah(0);
  };

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
    <div className="space-y-6">
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

      {/* Header */}
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
            {/* Bouton écouter sourate complète */}
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

        {/* Progression */}
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

        {/* Stats rapides */}
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

      {/* Contexte de révélation */}
      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <Info className="text-amber-400" />
          Contexte de Révélation
        </h2>
        <p className="text-white/90 leading-relaxed">
          {surahData?.englishNameTranslation && (
            <span className="font-semibold block mb-2">
              "{surahData.englishNameTranslation}"
            </span>
          )}
          {getSurahContext(surah.number)}
        </p>
      </div>

      {/* Verset actuel à apprendre */}
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
                {/* Menu de répétition */}
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

                {/* Bouton audio pour le verset actuel */}
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
              </div>
            </div>
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

      {/* Tous les versets */}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Fonction helper pour le contexte
const getSurahContext = (surahNumber) => {
  const contexts = {
    1: "Al-Fatiha est l'ouverture du Coran, révélée à La Mecque. C'est la sourate la plus récitée, présente dans chaque unité de prière. Elle résume l'essence de l'Islam : louange à Allah, reconnaissance de Sa souveraineté, et demande de guidance.",
    112: "Al-Ikhlas a été révélée en réponse aux polythéistes qui demandèrent au Prophète ﷺ de décrire son Seigneur. Cette courte sourate définit le Tawhid (monothéisme pur) et équivaut au tiers du Coran selon le Prophète ﷺ.",
    113: "Al-Falaq est la première des deux sourates protectrices. Révélée à La Mecque, elle enseigne à chercher refuge auprès d'Allah contre les maux de la création, l'obscurité, la sorcellerie et l'envie.",
    114: "An-Nas, dernière sourate du Coran, complète les sourates protectrices. Elle enseigne à chercher refuge contre les suggestions du diable et les mauvaises pensées. Le Prophète ﷺ recommandait sa récitation quotidienne.",
  };
  
  return contexts[surahNumber] || `Cette sourate fait partie du Coran et contient des enseignements précieux. ${
    surahNumber <= 9 ? "C'est une sourate longue qui nécessite patience et persévérance." :
    surahNumber <= 50 ? "C'est une sourate de taille moyenne." :
    "C'est une sourate courte, idéale pour commencer la mémorisation."
  }`;
};

export default FocusedLearningPage;
