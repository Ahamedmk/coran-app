// src/pages/FocusedLearningPage.jsx
// Corrigé : plus aucun débordement horizontal sur mobile

import React, { useState, useEffect, useRef } from "react";
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
  Pause,
} from "lucide-react";
import { quranAPI } from "../services/quranAPI";
import { reciterService } from "../services/reciterService";
import ProgressBar from "../components/ProgressBar";
import { getSurahTopic } from "../data/surahTopics";

const FocusedLearningPage = ({
  surah,
  progress,
  onLearnVerse,
  onChangeSurah,
  onComplete,
  userId,
}) => {
  // ===================== États principaux =====================
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [loadingReciters, setLoadingReciters] = useState(true);

  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingVerseId, setPlayingVerseId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const [surahPlaybackIndex, setSurahPlaybackIndex] = useState(0);

  const [surahPages, setSurahPages] = useState({ startPage: 1, endPage: 1 });

  const [openTranslations, setOpenTranslations] = useState({});
  const [surahTranslation, setSurahTranslation] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  // ===================== Refs audio =====================
  const isPlayingSurahRef = useRef(false);
  const currentAudioRef = useRef(null);
  const surahDataRef = useRef(null);
  const selectedReciterRef = useRef(null);
  const repeatCountRef = useRef(1);
  const currentRepeatRef = useRef(0);

  // Garder refs à jour
  useEffect(() => {
    repeatCountRef.current = repeatCount;
    currentRepeatRef.current = currentRepeat;
    surahDataRef.current = surahData;
    selectedReciterRef.current = selectedReciter;
  }, [repeatCount, currentRepeat, surahData, selectedReciter]);

  // ===================== Données =====================
  useEffect(() => {
    const loadReciters = async () => {
      setLoadingReciters(true);
      const recitersData = await reciterService.getReciters();
      setReciters(recitersData);
      const defaultReciter = recitersData[0];
      setSelectedReciter(defaultReciter);
      setLoadingReciters(false);
    };
    loadReciters();
  }, []);

  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      const data = await quranAPI.getSurah(surah.number);
      setSurahData(data);
      surahDataRef.current = data;
      setSurahPages(reciterService.getSurahPages(surah));
      setShowAllTranslations(false);
      setSurahTranslation(null);
      setOpenTranslations({});
      setLoading(false);
    };
    loadSurahData();
  }, [surah.number]);

  // Nettoyage audio
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // ===================== Scroll helper =====================
  const scrollToVerse = (verseNumber) => {
    const verseEl = document.getElementById(`verse-${verseNumber}`);
    if (verseEl) {
      verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ===================== Traductions =====================
  const handleToggleTranslation = async (verseNumber) => {
    setOpenTranslations((prev) => ({
      ...prev,
      [verseNumber]: !prev[verseNumber],
    }));
  };

  const handleToggleAllTranslations = async () => {
    if (surahTranslation) {
      setShowAllTranslations((prev) => !prev);
      return;
    }
    setLoadingTranslation(true);
    const data = await quranAPI.getSurahTranslation(surah.number, "fr.hamidullah");
    setSurahTranslation(data);
    setLoadingTranslation(false);
    setShowAllTranslations(true);
  };

  // ===================== Audio =====================
  const playSurahAudio = () => {
    if (isPlayingSurahRef.current) {
      setIsPlayingSurah(false);
      isPlayingSurahRef.current = false;
      if (currentAudioRef.current) currentAudioRef.current.pause();
      return;
    }
    scrollToVerse(1);
    setIsPlayingSurah(true);
    isPlayingSurahRef.current = true;
  };

  // ===================== Progression =====================
  const progressPercentage = ((progress || 0) / surah.numberOfAyahs) * 100;
  const versesLeft = surah.numberOfAyahs - (progress || 0);

  if (loading || loadingReciters) {
    return (
      <div className="flex items-center justify-center h-screen w-screen overflow-x-hidden">
        <p className="text-white text-xl">Chargement...</p>
      </div>
    );
  }

  // ===================== PAGE =====================
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 md:px-8 py-6 space-y-6 mx-auto">
      {/* Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-8 text-center w-[90%] max-w-md">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-3">Masha'Allah !</h2>
            <p className="text-lg">Tu as complété {surah.englishName} !</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 w-full overflow-x-hidden">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={onChangeSurah}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Changer de sourate</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={playSurahAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
                isPlayingSurah
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-500/30 hover:bg-green-500/50"
              }`}
            >
              {isPlayingSurah ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlayingSurah ? "Arrêter" : "Écouter sourate"}
            </button>

            <button
              onClick={handleToggleAllTranslations}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                showAllTranslations
                  ? "bg-blue-500/30 hover:bg-blue-500/40 text-white"
                  : "bg-blue-500/15 hover:bg-blue-500/25 text-white"
              }`}
            >
              {loadingTranslation
                ? "Chargement..."
                : showAllTranslations
                ? "Masquer FR"
                : "Traduire sourate"}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <h1 className="text-3xl sm:text-4xl font-bold">{surah.englishName}</h1>
          <div className="text-4xl sm:text-5xl mt-2">{surah.name}</div>
          <div className="flex justify-center flex-wrap gap-2 mt-3">
            <span className="bg-blue-500 px-3 py-1 rounded-full text-sm text-white">
              {surah.numberOfAyahs} versets
            </span>
            <span className="bg-purple-500 px-3 py-1 rounded-full text-sm text-white">
              {surah.revelationType === "Meccan" ? "Mecquoise" : "Médinoise"}
            </span>
            <span className="bg-amber-500 px-3 py-1 rounded-full text-sm text-white">
              📄 {surahPages.startPage}–{surahPages.endPage}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar percentage={progressPercentage} gradient="from-green-400 to-emerald-500" />
          <p className="text-center text-sm mt-2 text-white/60">
            {versesLeft === 0
              ? "✨ Sourate complétée !"
              : `Plus que ${versesLeft} verset${versesLeft > 1 ? "s" : ""} à apprendre`}
          </p>
        </div>
      </div>

      {/* Thème de la sourate */}
      {(() => {
        const topic = getSurahTopic(surah.number);
        return (
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl p-6 border border-amber-500/30 overflow-hidden w-full">
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-300 mb-3">
              <Info /> {topic.title}
            </h2>
            <p className="text-white/90 leading-relaxed">{topic.summary}</p>
          </div>
        );
      })()}

      {/* Bloc versets */}
      <div
        id="verses-container"
        className="bg-white/10 rounded-2xl p-6 border border-white/20 max-h-[70vh] overflow-y-auto w-full"
      >
        {surahData?.ayahs?.map((ayah) => {
          const isTranslationOpen = showAllTranslations || openTranslations[ayah.numberInSurah];
          return (
            <div
              key={ayah.numberInSurah}
              id={`verse-${ayah.numberInSurah}`}
              className="p-4 mb-4 rounded-xl border border-white/10 bg-white/5"
            >
              <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                <span className="text-sm text-white/70">Verset {ayah.numberInSurah}</span>
                <button
                  onClick={() => handleToggleTranslation(ayah.numberInSurah)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-xs ${
                    isTranslationOpen
                      ? "bg-white text-gray-900 border-white"
                      : "bg-white/10 text-white border-white/30"
                  }`}
                >
                  FR
                </button>
              </div>
              <p className="text-2xl md:text-3xl text-right text-white leading-loose break-words">
                {ayah.text}
              </p>

              {isTranslationOpen && (
                <div className="mt-3 bg-slate-900/40 border-l-4 border-yellow-400 p-3 rounded-lg">
                  <p className="text-yellow-100 text-sm leading-relaxed">
                    {surahTranslation?.ayahs
                      ? surahTranslation.ayahs[ayah.numberInSurah - 1]?.text
                      : "Chargement..."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FocusedLearningPage;
