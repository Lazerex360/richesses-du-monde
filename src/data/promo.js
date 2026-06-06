// Codes promotionnels. maxUses = nombre total de personnes pouvant l'utiliser
// (les "premières personnes" qui jouent). Chaque compte ne peut utiliser un code qu'une fois.
const PROMO_CODES = {
  // Code fondateur : réservé aux premiers joueurs — débloque les ressources "payantes"
  FONDATEUR: {
    description: 'Pack Fondateur — passe premium + pièces + pions exclusifs',
    maxUses: 100,
    rewards: { coins: 20000, premiumPass: true, pawns: ['unicorn', 'phoenix', 'trophy'] },
  },
  // Code de lancement, plus large
  RICHESSE2026: {
    description: 'Cadeau de lancement — passe premium + pièces',
    maxUses: 1000,
    rewards: { coins: 8000, premiumPass: true },
  },
};

function getPromo(code) {
  return PROMO_CODES[(code || '').toUpperCase().trim()] || null;
}

module.exports = { PROMO_CODES, getPromo };
