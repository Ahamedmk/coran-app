// src/pages/FocusedLearningPage.jsx
// Basmala en-tête (sauf sourate 9), lecture avec pause/reprise par verset,
// traductions FR indépendantes (par-verset et sourate), boutons en CSS inline.

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const BASMALA_AR = '﷽';
const BASMALA_TEXT = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

const FocusedLearningPage = ({
  surah,
  progress = 0,
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
  const [playingVerseId, setPlayingVerseId] = useState(null); // numberInSurah
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const [surahPlaybackIndex, setSurahPlaybackIndex] = useState(0); // index dans la liste filtrée
  const currentAudioRef = useRef(null);
  const isPlayingSurahRef = useRef(false);
  const surahDataRef = useRef(null);
  const selectedReciterRef = useRef(null);
  const repeatCountRef = useRef(1);
  const currentRepeatRef = useRef(0);

  // Traductions
  const [surahTranslation, setSurahTranslation] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [openTranslations, setOpenTranslations] = useState({});
  const [verseTranslations, setVerseTranslations] = useState({}); // { numberInSurah: {text, edition} }

  // refs up-to-date
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  useEffect(() => { currentRepeatRef.current = currentRepeat; }, [currentRepeat]);
  useEffect(() => { surahDataRef.current = surahData; }, [surahData]);
  useEffect(() => { selectedReciterRef.current = selectedReciter; }, [selectedReciter]);


  // Bloquer le scroll quand le sélecteur de répétition est ouvert
useEffect(() => {
  if (showRepeatMenu) {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }
}, [showRepeatMenu]);

  // charge récitateurs
  useEffect(() => {
    const loadReciters = async () => {
      setLoadingReciters(true);
      const list = await reciterService.getReciters();
      setReciters(list);
      if (userId) {
        const pref = await reciterService.getPreferredReciter(userId);
        const found = list.find(r => r.id === pref?.id);
        setSelectedReciter(found || list[0]);
      } else {
        setSelectedReciter(list[0]);
      }
      setLoadingReciters(false);
    };
    loadReciters();
  }, [userId]);

  // charge sourate arabe
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // reset états trad
      setOpenTranslations({});
      setVerseTranslations({});
      setSurahTranslation(null);
      setShowAllTranslations(false);

      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      surahDataRef.current = data;

      setLoading(false);
    };
    load();
  }, [surah.number]);

  // nettoyage audio
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // ========= BASMALA & LISTE FILTRÉE =========
  const hasBasmalaHeader = surah.number !== 9; // sauf at-Tawbah
  const ayahsFiltered = useMemo(() => {
    if (!surahData?.ayahs) return [];
    return surahData.ayahs.filter(a => {
      if (hasBasmalaHeader && a.numberInSurah === 1) {
        const t = (a.text || '').replace(/\s+/g, '');
        if (
          t.startsWith('بِسْمِاللَّهِالرَّحْمَٰنِالرَّحِيمِ') ||
          t.startsWith('بسماللهالرحمنالرحيم')
        ) {
          return false;
        }
      }
      return true;
    });
  }, [surahData, hasBasmalaHeader]);

  const verseNumberAtIndex = (idx) => ayahsFiltered[idx]?.numberInSurah;
  const effectiveAyahCount = ayahsFiltered.length;

  const smartHighlight = (verseNumberInSurah) => {
    const el = document.getElementById(`verse-${verseNumberInSurah}`);
    if (!el) return;
    el.classList.add('verse-glow');
    setTimeout(() => el.classList.remove('verse-glow'), 1200);
  };

  const progressClamped = Math.min(progress, effectiveAyahCount);
  const versesLeft = Math.max(effectiveAyahCount - progressClamped, 0);
  const progressPercentage = effectiveAyahCount > 0 ? (progressClamped / effectiveAyahCount) * 100 : 0;

  // =================== TRADUCTIONS ===================
  const handleToggleTranslation = async (verseNumberInSurah) => {
    setOpenTranslations(prev => ({ ...prev, [verseNumberInSurah]: !prev[verseNumberInSurah] }));
    if (!verseTranslations[verseNumberInSurah]) {
      try {
        const tr = await quranAPI.getVerseTranslation(surah.number, verseNumberInSurah, 'fr.hamidullah');
        if (tr?.text) {
          setVerseTranslations(prev => ({ ...prev, [verseNumberInSurah]: { text: tr.text, edition: tr.edition } }));
        }
      } catch (e) {
        console.error('Erreur de traduction par verset:', e);
      }
    }
  };

  const handleToggleAllTranslations = async () => {
    if (surahTranslation) {
      setShowAllTranslations(prev => !prev);
      return;
    }
    setLoadingTranslation(true);
    const data = await quranAPI.getSurahTranslation(surah.number, 'fr.hamidullah');
    setSurahTranslation(data || null);
    setLoadingTranslation(false);
    setShowAllTranslations(true);
  };

  const scrollToVerse = (verseNumberInSurah) => {
    const el = document.getElementById(`verse-${verseNumberInSurah}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // =================== AUDIO ===================
  const stopAnyAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingVerseId(null);
  };

  const handleReciterChange = async (reciter) => {
    setSelectedReciter(reciter);
    setShowReciterMenu(false);
    stopAnyAudio();
    setIsPlayingSurah(false);
    isPlayingSurahRef.current = false;
    setSurahPlaybackIndex(0);
    try {
      if (userId) await reciterService.savePreferredReciter(userId, reciter);
    } catch {}
  };

  // ✅ FIX: utiliser `verseNumber` partout (plus de variable fantôme)
  const playVerseAudio = async (verseNumber, opts = {}) => {
    const { isAutoRepeat = false, allowScroll = true } = opts;

    if (!isAutoRepeat) {
      setCurrentRepeat(0);
      currentRepeatRef.current = 0;
    }

    // toggle pause sur le même verset
    if (playingVerseId === verseNumber && isPlaying && !isAutoRepeat) {
      currentAudioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    // reprise lecture même verset
    if (playingVerseId === verseNumber && !isPlaying && !isAutoRepeat) {
      currentAudioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    // stop précédent & sortir du mode sourate
    stopAnyAudio();
    setIsPlayingSurah(false);
    isPlayingSurahRef.current = false;

    const reciterId = selectedReciterRef.current?.id;
    if (!reciterId) return;

    const audioUrl = await reciterService.getVerseAudioUrl(
      reciterId,
      surah.number,
      verseNumber
    );

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    setPlayingVerseId(verseNumber);

    audio.onloadeddata = () => {
      audio.play();
      setIsPlaying(true);
      if (allowScroll) {
        scrollToVerse(verseNumber);
        smartHighlight(verseNumber);
      }
    };

    audio.onended = () => {
      const cur = currentRepeatRef.current;
      const max = repeatCountRef.current;
      const next = cur + 1;
      if (next < max) {
        currentRepeatRef.current = next;
        setCurrentRepeat(next);
        setTimeout(() => {
          playVerseAudio(verseNumber, { isAutoRepeat: true, allowScroll });
        }, 200);
      } else {
        currentRepeatRef.current = 0;
        setCurrentRepeat(0);
        setIsPlaying(false);
        setPlayingVerseId(null);
        currentAudioRef.current = null;
      }
    };

    audio.onerror = () => {
      alert('Erreur audio. Essaie un autre récitateur.');
      setIsPlaying(false);
      setPlayingVerseId(null);
      currentAudioRef.current = null;
    };
  };

  // joue la sourate à partir d'un index filtré (pause/reprise)
  const playFromIndex = async (startIndex) => {
    const list = ayahsFiltered;
    if (!list.length) return;

    setSurahPlaybackIndex(startIndex);

    const item = list[startIndex];
    if (!item) {
      setIsPlayingSurah(false);
      isPlayingSurahRef.current = false;
      stopAnyAudio();
      setSurahPlaybackIndex(0);
      return;
    }

    const verseNo = item.numberInSurah;
    const reciterId = selectedReciterRef.current?.id;
    if (!reciterId) return;

    const audioUrl = await reciterService.getVerseAudioUrl(
      reciterId,
      surah.number,
      verseNo
    );

    currentAudioRef.current?.pause();
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onloadeddata = () => {
      if (!isPlayingSurahRef.current) { audio.pause(); return; }
      audio.play();
      setIsPlaying(true);
      setPlayingVerseId(verseNo);
      scrollToVerse(verseNo);
      smartHighlight(verseNo);
    };

    audio.onended = () => {
      if (isPlayingSurahRef.current) {
        setTimeout(() => playFromIndex(startIndex + 1), 120);
      }
    };

    audio.onerror = () => {
      if (isPlayingSurahRef.current) {
        setTimeout(() => playFromIndex(startIndex + 1), 120);
      }
    };
  };

  const togglePlaySurah = () => {
    if (isPlayingSurahRef.current) {
      // pause globale
      isPlayingSurahRef.current = false;
      setIsPlayingSurah(false);
      currentAudioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    // lancer/reprendre depuis l’index courant
    isPlayingSurahRef.current = true;
    setIsPlayingSurah(true);
    const firstVerse = ayahsFiltered[surahPlaybackIndex]?.numberInSurah || 1;
    scrollToVerse(firstVerse);
    smartHighlight(firstVerse);
    playFromIndex(surahPlaybackIndex);
  };

  const pauseAtThisVerse = (verseNumberInSurah) => {
    if (!isPlayingSurahRef.current) return;
    if (playingVerseId === verseNumberInSurah && isPlaying) {
      currentAudioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    const idx = ayahsFiltered.findIndex(a => a.numberInSurah === verseNumberInSurah);
    if (idx >= 0) {
      isPlayingSurahRef.current = true;
      setIsPlayingSurah(true);
      playFromIndex(idx);
    }
  };

  // mémorisation
  const handleLearnVerse = () => {
    onLearnVerse();
    if (progressClamped + 1 >= effectiveAyahCount) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete?.();
      }, 2500);
    }
  };

  // pages (mushaf)
  const surahPages = useMemo(() => reciterService.getSurahPages(surah), [surah]);

  if (loading || loadingReciters) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'64vh', width:'100vw', overflowX:'hidden' }}>
        <div style={{ fontSize:'1.25rem' }}>Chargement...</div>
      </div>
    );
  }

  const currentVerseNo = verseNumberAtIndex(progressClamped);

  return (
    <div style={{ width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box' }}>
      {/* Célébration */}
      {showCelebration && (
        <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'linear-gradient(135deg,#22c55e,#10b981)', borderRadius:'1rem', padding:'3rem', textAlign:'center', maxWidth:'28rem', width:'90vw' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🎉</div>
            <h2 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'1rem' }}>Masha'Allah !</h2>
            <p style={{ fontSize:'1.25rem', marginBottom:'1.5rem' }}>Tu as complété {surah.englishName} !</p>
            <p style={{ color:'rgba(255,255,255,0.9)' }}>{effectiveAyahCount} versets mémorisés</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', borderRadius:'1rem', padding:'1.5rem', border:'1px solid rgba(255,255,255,0.2)', width:'100%', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', minWidth:0 }}>
          <button
            onClick={onChangeSurah}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', backgroundColor:'rgba(255,255,255,0.1)', transition:'all 0.3s', border:'none', color:'#fff', cursor:'pointer', maxWidth:'100%' }}
            onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.2)'}
            onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Changer de sourate</span>
          </button>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <button
              onClick={togglePlaySurah}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', backgroundColor:isPlayingSurah?'#22c55e':'rgba(34,197,94,0.2)', border:'1px solid rgba(34,197,94,0.3)', transition:'all 0.3s', color:'#fff', cursor:'pointer', fontWeight:500 }}
              onMouseEnter={(e)=>{ if(!isPlayingSurah) e.currentTarget.style.backgroundColor='rgba(34,197,94,0.3)'; }}
              onMouseLeave={(e)=>{ if(!isPlayingSurah) e.currentTarget.style.backgroundColor='rgba(34,197,94,0.2)'; }}
            >
              {isPlayingSurah ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlayingSurah ? `Pause sourate (${playingVerseId || currentVerseNo || 1}/${effectiveAyahCount})` : 'Écouter sourate'}</span>
            </button>

            <button
              onClick={handleToggleAllTranslations}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'9999px', backgroundColor: showAllTranslations ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#fff', fontWeight:500, cursor:'pointer' }}
            >
              {loadingTranslation ? 'Chargement...' : showAllTranslations ? 'Masquer FR' : 'Traduire la sourate'}
            </button>

            <div style={{ position:'relative' }}>
              <button
                onClick={()=>setShowReciterMenu(!showReciterMenu)}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', backgroundColor:'rgba(168,85,247,0.2)', border:'1px solid rgba(168,85,247,0.3)', transition:'all 0.3s', color:'#fff', cursor:'pointer' }}
                onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='rgba(168,85,247,0.3)'}
                onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='rgba(168,85,247,0.2)'}
              >
                <User className="w-5 h-5" />
                <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>
                  {selectedReciter?.reciter_name || 'Récitateur'}
                </span>
                <ChevronDown style={{ width:'1rem', height:'1rem', transition:'transform 0.3s', transform: showReciterMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {showReciterMenu && (
                <div style={{ position:'absolute', top:'100%', right:0, marginTop:'0.5rem', backgroundColor:'rgba(255,255,255,0.98)', backdropFilter:'blur(12px)', borderRadius:'0.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.35)', maxHeight:'24rem', overflowY:'auto', zIndex:20, border:'1px solid rgba(0,0,0,0.08)', width:'min(92vw, 320px)' }}>
                  {reciters.map(r=>(
                    <button key={r.id} onClick={()=>handleReciterChange(r)}
                      style={{ width:'100%', textAlign:'left', padding:'0.75rem 1rem', color:'#1f2937', borderBottom:'1px solid #f3f4f6', background:'transparent', border:'none', cursor:'pointer' }}
                      onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='#f3e8ff'}
                      onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='transparent'}
                    >
                      <div style={{ fontWeight:500 }}>{r.reciter_name}</div>
                      <div style={{ fontSize:'0.875rem', color:'#6b7280' }}>{r.style || 'Style standard'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* titre & badges */}
        <div style={{ textAlign:'center', margin:'1.5rem 0' }}>
          <h1 style={{ fontSize:'2rem', fontWeight:800, marginBottom:'0.5rem' }}>{surah.englishName}</h1>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{surah.name}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.875rem', padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#3b82f6', color:'#fff' }}>
              {effectiveAyahCount} versets
            </span>
            <span style={{ fontSize:'0.875rem', padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#a855f7', color:'#fff' }}>
              {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
            </span>
            <span style={{ fontSize:'0.875rem', padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#f59e0b', color:'#fff' }}>
              📄 Pages {surahPages.startPage}-{surahPages.endPage}
            </span>
          </div>
        </div>

        {/* BASMALA */}
        {hasBasmalaHeader && (
          <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem' }}>
            <div style={{ textAlign:'center', fontSize:'1.75rem', lineHeight:1.8 }}>{BASMALA_AR}</div>
          </div>
        )}

        {/* progression */}
        <div style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem', marginBottom:'0.5rem' }}>
            <span style={{ fontWeight:600 }}>Ta progression</span>
            <span style={{ color:'#4ade80', fontWeight:700 }}>
              {progressClamped} / {effectiveAyahCount} versets
            </span>
          </div>
          <ProgressBar percentage={progressPercentage} gradient="from-green-400 to-emerald-500" />
          <div style={{ textAlign:'center', marginTop:'0.5rem', fontSize:'0.875rem', color:'rgba(255,255,255,0.7)' }}>
            {versesLeft === 0 ? (
              <span style={{ color:'#4ade80', fontWeight:700 }}>✨ Sourate complétée ! ✨</span>
            ) : (
              <span>Plus que {versesLeft} verset{versesLeft>1?'s':''} !</span>
            )}
          </div>
        </div>
      </div>

      {/* À propos */}
      {(() => {
        const topic = getSurahTopic(surah.number);
        return (
          <div style={{ background:'linear-gradient(90deg, rgba(245,158,11,0.2), rgba(234,179,8,0.2))', backdropFilter:'blur(8px)', borderRadius:'1rem', padding:'1.5rem',marginTop:'1.5rem', border:'1px solid rgba(245,158,11,0.3)', width:'100%', boxSizing:'border-box' }}>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'#fbbf24' }}>
              <Info className="text-amber-400" /> {topic.title}
            </h2>
            <p style={{ color:'rgba(255,255,255,0.95)', lineHeight:1.65, wordBreak:'break-word', overflowWrap:'anywhere' }}>
              {topic.summary}
            </p>
          </div>
        );
      })()}

      {/* Bloc verset à mémoriser */}
      {versesLeft > 0 && ayahsFiltered.length > 0 && (
        <div style={{ background:'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))', backdropFilter:'blur(8px)', borderRadius:'1rem', padding:'2rem', marginTop:'1.5rem', border:'1px solid rgba(168,85,247,0.3)', boxSizing:'border-box', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Sparkles className="text-yellow-400" />
              Verset à mémoriser
            </h2>
            <span style={{ fontSize:'1.125rem', color:'rgba(255,255,255,0.7)' }}>
              #{currentVerseNo}
            </span>
          </div>

          <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:'0.75rem', padding:'2rem', marginBottom:'1.5rem', overflow:'hidden' }}>
            <div style={{ fontSize:'2rem', lineHeight:1.8, textAlign:'right', marginBottom:'1rem', wordBreak:'break-word', overflowWrap:'anywhere', color:'#fff' }}>
              {ayahsFiltered[progressClamped]?.text}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.875rem', color:'rgba(255,255,255,0.6)', flexWrap:'wrap', gap:'0.5rem' }}>
              <span>Verset {currentVerseNo} sur {effectiveAyahCount}</span>

              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                {/* menu répétition */}
                <div style={{ position:'relative' }}>
                  <button
                    onClick={()=>setShowRepeatMenu(!showRepeatMenu)}
                    style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', backgroundColor:'rgba(251,191,36,0.2)', border:'1px solid rgba(251,191,36,0.3)', transition:'all 0.3s', color:'#fff', cursor:'pointer', fontSize:'0.875rem' }}
                    onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='rgba(251,191,36,0.3)'}
                    onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='rgba(251,191,36,0.2)'}
                  >
                    <span>Répéter {repeatCount}x</span>
                    <ChevronDown style={{ width:'1rem', height:'1rem', transition:'transform 0.3s', transform: showRepeatMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>

                  {showRepeatMenu && (
  <div
    onClick={() => setShowRepeatMenu(false)}
    className="overlay-fade-in"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Sélecteur de répétition"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="modal-pop-in"
      style={{
        width: 'min(92vw, 420px)',
        background: 'rgba(17,24,39,0.95)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '0.9rem',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden'
      }}
    >
      {/* En-tête */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.9rem 1rem',
        background: 'rgba(251,191,36,0.12)',
        borderBottom: '1px solid rgba(251,191,36,0.25)'
      }}>
        <div style={{ fontWeight: 700 }}>Répéter le verset</div>
        <button
          onClick={() => setShowRepeatMenu(false)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#fff',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            lineHeight: 1
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      {/* Options */}
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '0.75rem' }}>
        {[1, 2, 3, 5, 7, 10].map((count) => {
          const active = repeatCount === count;
          return (
            <button
              key={count}
              onClick={() => { setRepeatCount(count); setShowRepeatMenu(false); }}
              style={{
                padding: '0.85rem 0.75rem',
                borderRadius: '0.7rem',
                border: active ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
                background: active ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
                color: active ? '#fde68a' : 'rgba(255,255,255,0.9)',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'transform 0.1s ease, background 0.2s ease',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {count === 1 ? '1 fois' : `${count} fois`}
            </button>
          );
        })}
      </div>

      {/* Astuce / footer */}
      <div style={{
        padding: '0.85rem 1rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.75)'
      }}>
        Astuce : choisis 3 à 5 répétitions pour bien ancrer le verset.
      </div>
    </div>
  </div>
)}

                </div>

                {/* audio verset courant (sans scroll auto ici) */}
                <button
                  onClick={()=>{ setCurrentRepeat(0); playVerseAudio(currentVerseNo, { allowScroll:false }); }}
                  style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', backgroundColor:(playingVerseId===currentVerseNo && isPlaying)?'#3b82f6':'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)', transition:'all 0.3s', color:'#fff', cursor:'pointer' }}
                  onMouseEnter={(e)=>{ if(!(playingVerseId===currentVerseNo && isPlaying)) e.currentTarget.style.backgroundColor='rgba(59,130,246,0.3)'; }}
                  onMouseLeave={(e)=>{ if(!(playingVerseId===currentVerseNo && isPlaying)) e.currentTarget.style.backgroundColor='rgba(59,130,246,0.2)'; }}
                >
                  {playingVerseId===currentVerseNo && isPlaying ? (<><Pause className="w-5 h-5"/><span>{currentRepeat>0?`${currentRepeat}/${repeatCount}`:'Pause'}</span></>) : (<><Volume2 className="w-5 h-5"/><span>Écouter</span></>)}
                </button>

                {/* FR verset courant */}
                <button
                  onClick={()=>handleToggleTranslation(currentVerseNo)}
                  style={{ width:'2.4rem', height:'2.4rem', borderRadius:'9999px', border:'2px solid rgba(255,255,255,0.4)', background: openTranslations[currentVerseNo] ? '#fff' : 'rgba(255,255,255,0.1)', color: openTranslations[currentVerseNo] ? '#1f2937' : '#fff', fontWeight:700, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 20px rgba(0,0,0,0.2)', cursor:'pointer' }}
                >
                  FR
                </button>

                {/* pause/reprendre à ce verset si lecture sourate active */}
                {isPlayingSurah && (
                  <button
                    onClick={()=>pauseAtThisVerse(currentVerseNo)}
                    style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.9rem', borderRadius:'0.5rem', backgroundColor:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.35)', color:'#fff', cursor:'pointer' }}
                  >
                    {isPlaying && playingVerseId===currentVerseNo ? <><Pause className="w-4 h-4"/><span>Pause ici</span></> : <><Play className="w-4 h-4"/><span>Reprendre ici</span></>}
                  </button>
                )}
              </div>
            </div>

            {/* bloc FR du verset courant */}
            {openTranslations[currentVerseNo] && (
              <div style={{ marginTop:'1rem', background:'rgba(15,23,42,0.35)', borderLeft:'4px solid rgba(251,191,36,1)', borderRadius:'0.75rem', padding:'0.9rem 1rem' }}>
                <p style={{ fontSize:'0.95rem', lineHeight:1.6, color:'#fef9c3', letterSpacing:'0.01em', wordBreak:'break-word', overflowWrap:'anywhere' }}>
                  {verseTranslations[currentVerseNo]?.text || '…'}
                </p>
                <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)' }}>
                  Traduction française • {verseTranslations[currentVerseNo]?.edition?.name || 'fr.hamidullah'}
                </span>
              </div>
            )}
          </div>

          <div style={{ background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.875rem' }}>
              <strong>💡 Astuce :</strong> Écoute le verset avec {selectedReciter?.reciter_name}, lis-le à haute voix plusieurs fois, puis récite-le de mémoire avant de valider.
            </div>
          </div>

          <button
            onClick={handleLearnVerse}
            style={{ width:'100%', background:'linear-gradient(to right,#22c55e,#10b981)', color:'#fff', fontWeight:'bold', padding:'1.25rem', borderRadius:'0.75rem', transition:'all 0.3s', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)', fontSize:'1.25rem', border:'none', cursor:'pointer' }}
            onMouseEnter={(e)=>{ e.currentTarget.style.background='linear-gradient(to right,#16a34a,#059669)'; e.currentTarget.style.transform='scale(1.05)'; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.background='linear-gradient(to right,#22c55e,#10b981)'; e.currentTarget.style.transform='scale(1)'; }}
          >
            ✨ Verset mémorisé (+20 points)
          </button>
        </div>
      )}

      {/* TOUS LES VERSETS */}
      <div style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', borderRadius:'1rem', padding:'1.5rem',marginTop:'1.5rem', border:'1px solid rgba(255,255,255,0.2)', width:'100%', boxSizing:'border-box' }}>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <BookOpen className="text-blue-400" />
          Tous les versets
        </h2>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.875rem', marginBottom:'1rem' }}>
          Parcours l’ensemble de la sourate. Quand la lecture est active, tu peux mettre en pause / reprendre à côté de chaque verset.
        </p>

        <div id="verses-container" style={{ maxHeight:'70vh', overflowY:'auto', overflowX:'hidden', paddingRight:'0.5rem', boxSizing:'border-box' }}>
          {ayahsFiltered.map((ayah, idx) => {
            const isPlayingThis = (playingVerseId === ayah.numberInSurah) && isPlaying && isPlayingSurah;
            const isTarget = (playingVerseId === ayah.numberInSurah) && isPlaying && !isPlayingSurah;
            const isCurrentToMemorize = idx === progressClamped;

            const isTranslationOpen = showAllTranslations || openTranslations[ayah.numberInSurah];
            const verseFR =
              showAllTranslations && surahTranslation?.ayahs
                ? surahTranslation.ayahs[ayah.numberInSurah - 1]?.text
                : verseTranslations[ayah.numberInSurah]?.text;

            return (
              <div key={idx}
                   id={`verse-${ayah.numberInSurah}`}
                   style={{
                     borderRadius:'0.75rem',
                     padding:'1rem',
                     border:'2px solid',
                     transition:'all 0.3s',
                     borderColor: isPlayingThis || isTarget ? '#3b82f6'
                               : idx < progressClamped   ? 'rgba(34,197,94,0.3)'
                               : isCurrentToMemorize     ? '#a855f7'
                               : 'rgba(255,255,255,0.1)',
                     backgroundColor: isPlayingThis || isTarget ? 'rgba(59,130,246,0.3)'
                                   : idx < progressClamped    ? 'rgba(34,197,94,0.1)'
                                   : isCurrentToMemorize      ? 'rgba(168,85,247,0.2)'
                                   : 'rgba(255,255,255,0.05)',
                     boxShadow: (isPlayingThis||isTarget) ? '0 0 0 3px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.4)'
                               : isCurrentToMemorize    ? '0 0 0 2px #a855f7'
                               : 'none',
                     marginBottom:'1rem'
                   }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.75rem', padding:'0.25rem 0.5rem', borderRadius:'9999px', backgroundColor:(isPlayingThis||isTarget)?'#3b82f6':'rgba(255,255,255,0.1)', color:'#fff', fontWeight:(isPlayingThis||isTarget)?'bold':'normal' }}>
                      Verset {ayah.numberInSurah}
                    </span>
                    {isPlayingThis && (
                      <span style={{ fontSize:'0.75rem', padding:'0.25rem 0.5rem', borderRadius:'9999px', background:'#10b981', color:'#fff', fontWeight:'bold' }}>
                        🔊 Sourate {ayah.numberInSurah}/{effectiveAyahCount}
                      </span>
                    )}
                    {idx < progressClamped && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {isCurrentToMemorize && !isPlayingThis && !isTarget && (
                      <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    )}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    {/* FR par verset */}
                    <button
                      onClick={()=>handleToggleTranslation(ayah.numberInSurah)}
                      style={{ width:'2.4rem', height:'2.4rem', borderRadius:'9999px', border:'2px solid rgba(255,255,255,0.35)', background: isTranslationOpen ? '#fff' : 'rgba(255,255,255,0.1)', color: isTranslationOpen ? '#1f2937' : '#fff', fontWeight:700, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                    >
                      FR
                    </button>

                    {/* pause/reprendre à ce verset (si lecture sourate active) */}
                    {isPlayingSurah && (
                      <button
                        onClick={()=>pauseAtThisVerse(ayah.numberInSurah)}
                        style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.8rem', borderRadius:'0.5rem', backgroundColor:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.35)', color:'#fff', cursor:'pointer' }}
                      >
                        {isPlaying && playingVerseId===ayah.numberInSurah ? <><Pause className="w-4 h-4"/><span>Pause</span></> : <><Play className="w-4 h-4"/><span>Reprendre ici</span></>}
                      </button>
                    )}

                    {/* écoute isolée de ce verset */}
                    <button
                      onClick={()=>playVerseAudio(ayah.numberInSurah)}
                      style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.8rem', borderRadius:'0.5rem', backgroundColor:(playingVerseId===ayah.numberInSurah && !isPlayingSurah && isPlaying)?'#3b82f6':'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)', color:'#fff', cursor:'pointer' }}
                    >
                      {playingVerseId===ayah.numberInSurah && !isPlayingSurah && isPlaying ? <><Pause className="w-4 h-4"/><span>Pause</span></> : <><Volume2 className="w-4 h-4"/><span>Écouter</span></>}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize:'1.5rem', lineHeight:1.8, textAlign:'right', color:'#fff', wordBreak:'break-word', overflowWrap:'anywhere' }}>
                  {ayah.text}
                </div>

                {/* bloc FR si ouvert */}
                {isTranslationOpen && (
                  <div style={{ marginTop:'0.75rem', background:'rgba(15,23,42,0.35)', borderLeft:'4px solid rgba(251,191,36,1)', borderRadius:'0.75rem', padding:'0.75rem 1rem' }}>
                    <p style={{ fontSize:'0.9rem', lineHeight:1.55, color:'#fef9c3', letterSpacing:'0.01em', wordBreak:'break-word', overflowWrap:'anywhere' }}>
                      {verseFR || '…'}
                    </p>
                    <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>
                      Traduction française • {surahTranslation?.edition?.name || verseTranslations[ayah.numberInSurah]?.edition?.name || 'fr.hamidullah'}
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

export default FocusedLearningPage;
