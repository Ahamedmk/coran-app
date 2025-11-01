// src/services/reciterService.js
// Service pour gérer les récitateurs et leurs préférences

export const reciterService = {
  // Liste des récitateurs populaires (API alquran.cloud - IDs vérifiés)
  getReciters: async () => {
    try {
      // Récitateurs vérifiés de l'API alquran.cloud
      return [
        { id: 'ar.alafasy', reciter_name: "Mishary Rashid Alafasy", style: "Murattal" },
        { id: 'ar.abdulbasit', reciter_name: "Abdul Basit Abdul Samad", style: "Murattal" },
        { id: 'ar.abdurrahmaansudais', reciter_name: "Abdurrahman As-Sudais", style: "Murattal" },
        { id: 'ar.abdullahbasfar', reciter_name: "Abdullah Basfar", style: "Murattal" },
        { id: 'ar.abdulsamad', reciter_name: "Abdul Basit (Mujawwad)", style: "Mujawwad" },
        { id: 'ar.husary', reciter_name: "Mahmoud Khalil Al-Hussary", style: "Murattal" },
        { id: 'ar.minshawi', reciter_name: "Mohamed Siddiq Al-Minshawi", style: "Murattal" },
        { id: 'ar.muhammadayyoub', reciter_name: "Muhammad Ayyub", style: "Murattal" },
        { id: 'ar.shaatree', reciter_name: "Abu Bakr Ash-Shaatree", style: "Murattal" }
      ];
    } catch (error) {
      console.error('Erreur chargement récitateurs:', error);
      return [
        { id: 'ar.alafasy', reciter_name: "Mishary Rashid Alafasy", style: "Murattal" }
      ];
    }
  },

  // Sauvegarder le récitateur préféré de l'utilisateur
  savePreferredReciter: async (userId, reciter) => {
    try {
      await window.storage.set(`reciter-${userId}`, JSON.stringify(reciter));
      return { success: true };
    } catch (error) {
      console.error('Erreur sauvegarde récitateur:', error);
      return { success: false };
    }
  },

  // Récupérer le récitateur préféré
  getPreferredReciter: async (userId) => {
    try {
      const result = await window.storage.get(`reciter-${userId}`);
      if (result) {
        return JSON.parse(result.value);
      }
      // Charger le récitateur préféré de l'utilisateur
      if (userId) {
        const preferredReciter = await reciterService.getPreferredReciter(userId);
        const found = recitersData.find(r => r.id === preferredReciter.id);
        setSelectedReciter(found || recitersData[0]);
      } else {
        setSelectedReciter(recitersData[0]);
      }
    } catch (error) {
      return { id: 7, reciter_name: "Mishary Rashid Alafasy", style: "Murattal" };
    }
  },

  // Construire l'URL audio pour un verset avec un récitateur
  getVerseAudioUrl: async (reciterEdition, surahNumber, verseNumber) => {
    try {
      // Utiliser l'API alquran.cloud pour obtenir l'URL exacte du verset
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/${reciterEdition}`);
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.audio) {
        return data.data.audio;
      }
      
      // Fallback: URL de la sourate complète
      return `https://cdn.islamic.network/quran/audio-surah/128/${reciterEdition}/${surahNumber}.mp3`;
    } catch (error) {
      console.error('Erreur récupération URL audio:', error);
      // Fallback
      return `https://cdn.islamic.network/quran/audio-surah/128/${reciterEdition}/${surahNumber}.mp3`;
    }
  },

  // Informations sur les pages du Mushaf
  getSurahPages: (surah) => {
    return {
      startPage: surah.pages?.[0] || calculateStartPage(surah.number),
      endPage: surah.pages?.[1] || calculateEndPage(surah.number),
    };
  },

  // Obtenir l'URL de la sourate complète
  getSurahAudioUrl: (reciterEdition, surahNumber) => {
    return `https://cdn.islamic.network/quran/audio-surah/128/${reciterEdition}/${surahNumber}.mp3`;
  }
};

// Fonction helper pour calculer approximativement les pages
// (À remplacer par des vraies données d'API si disponible)
const calculateStartPage = (surahNumber) => {
  const approximatePages = {
    1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151,
    8: 177, 9: 187, 10: 208, 11: 221, 12: 235, 13: 249,
    14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305,
    20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
    26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411,
    32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446,
    38: 453, 39: 458, 40: 467, 41: 477, 42: 483, 43: 489,
    44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
    50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531,
    56: 534, 57: 537, 58: 542, 59: 545, 60: 549, 61: 551,
    62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562,
    68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
    74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583,
    80: 585, 81: 586, 82: 587, 83: 587, 84: 589, 85: 590,
    86: 591, 87: 591, 88: 592, 89: 593, 90: 594, 91: 595,
    92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
    98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601,
    104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603,
    110: 603, 111: 603, 112: 604, 113: 604, 114: 604
  };
  return approximatePages[surahNumber] || 1;
};

const calculateEndPage = (surahNumber) => {
  const start = calculateStartPage(surahNumber);
  if (surahNumber === 114) return 604;
  return calculateStartPage(surahNumber + 1) - 1;
};