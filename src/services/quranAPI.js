// src/services/quranAPI.js

// on fait un petit cache en mémoire pour ne pas rappeler l'API 36 fois
const translationCache = {};

export const quranAPI = {
  // 🔹 1. ta fonction existante : sourate en arabe (ici avec la récitation alafasy)
  getSurah: async (number) => {
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`
      );
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erreur API Coran (ar) :', error);
      return null;
    }
  },

  // 🔹 2. ta fonction existante : liste des sourates
  getAllSurahs: async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erreur API Coran (liste) :', error);
      return [];
    }
  },

  // 🔹 3. ❗ NOUVEAU : récupérer TOUTE la sourate en français
  // on la garde en cache pour éviter de refaire l'appel
  getSurahTranslation: async (number, lang = 'fr.hamidullah') => {
    const cacheKey = `${number}-${lang}`;

    // si on a déjà la traduction → on la renvoie
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${number}/${lang}`
      );
      const result = await response.json();

      if (!result || result.status !== 'OK') {
        throw new Error('Réponse API invalide');
      }

      // on stocke en cache
      translationCache[cacheKey] = result.data;
      return result.data;
    } catch (error) {
      console.error('Erreur API Coran (traduction) :', error);
      return null;
    }
  },

  // 🔹 4. ❗ NOUVEAU : récupérer UNIQUEMENT la traduction d’un verset
  // on s’appuie sur la fonction juste au-dessus
  getVerseTranslation: async (surahNumber, verseNumber, lang = 'fr.hamidullah') => {
    // on récupère (ou on télécharge) la sourate traduite
    const surahTr = await quranAPI.getSurahTranslation(surahNumber, lang);
    if (!surahTr || !surahTr.ayahs) {
      return null;
    }

    // dans l'API, les versets sont dans un tableau 0-based
    const ayah = surahTr.ayahs[verseNumber - 1];
    if (!ayah) {
      return null;
    }

    // pour être cohérent avec ce que tu attends dans le composant
    return {
      text: ayah.text,
      numberInSurah: ayah.numberInSurah,
      edition: surahTr.edition
    };
  }
};
