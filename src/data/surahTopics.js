// src/data/surahTopics.js

// objet brut : tu pourras le compléter petit à petit
const SURAH_TOPICS = {
  1: {
    title: "Al-Fâtiha – L'ouverture",
    summary:
      "Sourate centrale qui enseigne comment parler à Allah : louange, adoration et demande de guidée. Elle pose les trois relations : avec Allah, avec le chemin droit, et avec ceux qu’Allah a comblés."
  },
  2: {
    title: "Al-Baqara – La vache",
    summary:
      "La plus longue sourate. Elle parle de la communauté idéale, du pacte avec Allah, de l’histoire de Banû Israïl, du changement de qibla, du mariage, des dépenses, du combat, et se termine par la foi et l’obéissance. Elle montre comment devenir la Oumma ‘au milieu’."
  },
  3: {
    title: "Âl ‘Imrân – La famille de ‘Imrân",
    summary:
      "Réponse aux gens du Livre, histoire de Maryam et ‘Isa, et surtout leçon de Uhud : rester constant même quand on perd. Elle complète Al-Baqara."
  },
  18: {
    title: "Al-Kahf – La caverne",
    summary:
      "Quatre récits qui protègent la foi : les jeunes de la caverne (fitna de la religion), l’homme aux deux jardins (fitna de l’argent), Mûsâ et Al-Khidr (fitna de la science), Dhul-Qarnayn (fitna du pouvoir)."
  },
  36: {
    title: "Yâ-Sîn",
    summary:
      "Appel au tawhîd, rappel de la résurrection, parabole des habitants de la cité, et preuve de la puissance d’Allah à travers la création."
  },
  55: {
    title: "Ar-Rahmân – Le Tout Miséricordieux",
    summary:
      "Sourate des bienfaits répétés « Lequel des bienfaits de votre Seigneur nierez-vous ? ». Elle montre le paradis, la balance, les deux jardins."
  },
  67: {
    title: "Al-Mulk – La royauté",
    summary:
      "Rappel de la souveraineté totale d’Allah, de la création de la mort et de la vie comme test, et de la réalité de l’Enfer."
  },
  112: {
    title: "Al-Ikhlâs – Le monothéisme pur",
    summary:
      "Définition d’Allah : Unique, Absolu, Il n’engendre pas et n’est pas engendré. C’est la sourate du tawhîd pur."
  },
  113: {
    title: "Al-Falaq – L’aube naissante",
    summary:
      "Chercher protection auprès d’Allah contre les maux extérieurs : nuit, sorcellerie, jalousie."
  },
  114: {
    title: "An-Nâs – Les hommes",
    summary:
      "Chercher protection auprès d’Allah contre le mal intérieur : le waswas du diable dans le cœur."
  },
};

// fonction d’accès
export const getSurahTopic = (surahNumber) => {
  const topic = SURAH_TOPICS[surahNumber];
  if (topic) return topic;

  // fallback si on n’a pas encore rempli la sourate
  return {
    title: "À propos de cette sourate",
    summary:
      "Cette sourate traite de thèmes de foi, de rappel et de mise sur le droit chemin. Tu peux compléter ce fichier pour ajouter une explication plus précise."
  };
};
