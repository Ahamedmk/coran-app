// src/services/quranAPI.js

export const quranAPI = {
  getSurah: async (number) => {
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erreur API Coran:', error);
      return null;
    }
  },
  
  getAllSurahs: async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erreur API Coran:', error);
      return [];
    }
  }
};