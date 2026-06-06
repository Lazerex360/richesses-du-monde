// Système de progression : niveaux, récompenses de partie et battle pass.

// --- Niveaux ---
// XP nécessaire pour passer du niveau L au niveau L+1.
// Courbe progressive : plus le niveau est élevé, plus il faut d'XP (croissance quadratique).
function xpForLevel(level) {
  return Math.round(250 + 100 * level + 30 * level * level);
}

// Calcule le niveau et l'XP résiduelle à partir d'un total d'XP de compte.
function computeLevel(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForLevel(level) };
}

// --- Récompenses de partie ---
const REWARDS = {
  win: { coins: 600, xp: 350 },
  participation: { coins: 120, xp: 120 },
  perOpponent: { coins: 40, xp: 25 }, // bonus par adversaire (parties plus peuplées = plus de récompense)
  premiumXpMultiplier: 1.5,
  premiumCoinMultiplier: 1.25,
  streakXpPerWin: 70, // XP bonus par victoire consécutive
  maxStreak: 5, // plafond du bonus de série (au-delà, plus d'XP supplémentaire)
  botXpFactor: 0.08, // XP dérisoire dans les parties avec des bots
  botCoinFactor: 0.3, // pièces réduites dans les parties avec des bots
};

// streak : série de victoires APRÈS ce match (1 = première victoire).
// hasBots : true si la partie contient au moins un bot (récompenses dérisoires).
// Les parties ne rapportent PAS de pièces : uniquement de l'XP (les pièces
// proviennent du passe et des codes promo).
function computeMatchReward({ isWinner, opponents, isPremium, streak = 0, hasBots = false }) {
  const base = isWinner ? REWARDS.win : REWARDS.participation;
  let xp = base.xp + REWARDS.perOpponent.xp * opponents;

  // Bonus de série de victoires, plafonné à maxStreak.
  const cappedStreak = Math.min(Math.max(0, streak), REWARDS.maxStreak);
  let streakBonus = 0;
  if (isWinner && cappedStreak > 0) {
    streakBonus = REWARDS.streakXpPerWin * cappedStreak;
    xp += streakBonus;
  }

  if (isPremium) {
    xp = Math.round(xp * REWARDS.premiumXpMultiplier);
    streakBonus = Math.round(streakBonus * REWARDS.premiumXpMultiplier);
  }

  // Parties avec bots : l'XP devient dérisoire.
  if (hasBots) {
    xp = Math.max(1, Math.round(xp * REWARDS.botXpFactor));
    streakBonus = Math.round(streakBonus * REWARDS.botXpFactor);
  }

  return { coins: 0, xp, streak: cappedStreak, streakBonus, hasBots, maxStreak: REWARDS.maxStreak };
}

// --- Battle Pass ---
// Le passe progresse avec l'XP de saison (gagnée comme l'XP de compte).
const PASS_XP_PER_TIER = 800;
const PASS_MAX_TIER = 30;

// Le passe premium coûte 3,99 € converti dans la monnaie HORS-PARTIE (les "pièces").
// Cette monnaie est distincte des billets utilisés pendant une partie : elle se gagne
// uniquement entre les parties (récompenses) et sert à la boutique et au passe.
const PASS_PREMIUM_EUR = 3.99;
const COINS_PER_EUR = 1000; // taux de conversion € -> pièces
const PASS_PREMIUM_PRICE = Math.round(PASS_PREMIUM_EUR * COINS_PER_EUR); // 3990 pièces

// Récompenses premium "majeures" à des paliers précis (pions/dés exclusifs).
const PREMIUM_MILESTONES = {
  7: { type: 'pawn', pawnId: 'fox' },
  14: { type: 'pawn', pawnId: 'tiger' },
  20: { type: 'dice', diceId: 'prism_dice' },
  26: { type: 'pawn', pawnId: 'unicorn' },
  30: { type: 'pawn', pawnId: 'phoenix' },
};

// Génère les paliers : récompense gratuite + premium pour chaque palier.
function buildBattlePass() {
  const tiers = [];
  for (let t = 1; t <= PASS_MAX_TIER; t++) {
    // Le dernier palier gratuit débloque le passe premium
    const free = t === PASS_MAX_TIER
      ? { type: 'premium_pass' }
      : { type: 'coins', amount: 150 + t * 10 };

    let premium;
    if (PREMIUM_MILESTONES[t]) {
      premium = PREMIUM_MILESTONES[t];
    } else if (t % 5 === 0) {
      premium = { type: 'coins', amount: 800 + t * 30 };
    } else {
      premium = { type: 'coins', amount: 300 + t * 20 };
    }

    tiers.push({ tier: t, free, premium });
  }
  return tiers;
}

const BATTLE_PASS = buildBattlePass();

function computePassProgress(seasonXp) {
  const tier = Math.min(PASS_MAX_TIER, Math.floor(seasonXp / PASS_XP_PER_TIER) + 1);
  const xpIntoTier = seasonXp % PASS_XP_PER_TIER;
  return { tier, xpIntoTier, xpPerTier: PASS_XP_PER_TIER, maxTier: PASS_MAX_TIER };
}

module.exports = {
  xpForLevel,
  computeLevel,
  REWARDS,
  computeMatchReward,
  BATTLE_PASS,
  PASS_XP_PER_TIER,
  PASS_MAX_TIER,
  PASS_PREMIUM_PRICE,
  PASS_PREMIUM_EUR,
  COINS_PER_EUR,
  computePassProgress,
};
