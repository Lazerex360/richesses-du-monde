const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PAWN_MAP, getPawn, getDice, getTitle, getCosmetic } = require('./shop');
const { getPromo } = require('./promo');
const {
  computeLevel,
  computePassProgress,
  computeMatchReward,
  BATTLE_PASS,
  PASS_PREMIUM_PRICE,
} = require('./progression');

const DATA_DIR = process.env.RDM_USER_DATA || path.join(__dirname, '..', '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const PROMO_FILE = path.join(DATA_DIR, 'promo_usage.json');

let accounts = {}; // id -> account
let sessions = {}; // token -> userId
let providerIndex = {}; // `${provider}:${externalId}` -> userId
let displayNameIndex = {}; // pseudo normalisé (minuscule) -> userId
let promoUsage = {}; // code -> nombre d'utilisations

function normalizeDisplayName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').slice(0, 20);
}

function displayNameKey(name) {
  const n = normalizeDisplayName(name);
  return n.length >= 2 ? n.toLowerCase() : '';
}

function isDisplayNameTaken(name, excludeAccountId = null) {
  const key = displayNameKey(name);
  if (!key) return false;
  const owner = displayNameIndex[key];
  return !!owner && owner !== excludeAccountId;
}

function registerDisplayName(account) {
  const key = displayNameKey(account.displayName);
  if (key) displayNameIndex[key] = account.id;
}

function unregisterDisplayName(account) {
  const key = displayNameKey(account.displayName);
  if (key && displayNameIndex[key] === account.id) delete displayNameIndex[key];
}

function seedDataFile(filename, fallback) {
  const dest = path.join(DATA_DIR, filename);
  if (fs.existsSync(dest)) return;
  const bundleDir = process.env.RDM_BUNDLE_DATA || path.join(__dirname, '..', '..', 'data');
  const src = path.join(bundleDir, filename);
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  else fs.writeFileSync(dest, JSON.stringify(fallback, null, 2));
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (process.env.RDM_USER_DATA) {
    seedDataFile('accounts.json', {});
    seedDataFile('sessions.json', {});
    seedDataFile('promo_usage.json', {});
  }
}

function load() {
  ensureDir();
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')) || {};
    }
  } catch (_) {
    accounts = {};
  }
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8')) || {};
    }
  } catch (_) {
    sessions = {};
  }
  try {
    if (fs.existsSync(PROMO_FILE)) {
      promoUsage = JSON.parse(fs.readFileSync(PROMO_FILE, 'utf8')) || {};
    }
  } catch (_) {
    promoUsage = {};
  }
  providerIndex = {};
  displayNameIndex = {};
  for (const acc of Object.values(accounts)) {
    if (acc.provider && acc.externalId) {
      providerIndex[`${acc.provider}:${acc.externalId}`] = acc.id;
    }
    registerDisplayName(acc);
  }
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    ensureDir();
    try {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      fs.writeFileSync(PROMO_FILE, JSON.stringify(promoUsage, null, 2));
    } catch (e) {
      console.error('Erreur sauvegarde comptes:', e.message);
    }
  }, 250);
}

const AVATARS = ['🦁', '🐺', '🦅', '🐉', '🦊', '🐻', '🦈', '🐅', '🦉', '🐬'];
const RENAME_LIMIT_PER_MONTH = 2;

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getRenameCount(account) {
  if (!account?.renameHistory) return 0;
  return account.renameHistory[currentMonthKey()] || 0;
}

function getRenamesRemaining(account) {
  return Math.max(0, RENAME_LIMIT_PER_MONTH - getRenameCount(account));
}

function createAccount({ provider, externalId, displayName }) {
  const id = crypto.randomUUID();
  const account = {
    id,
    provider: provider || 'guest',
    externalId: externalId || id,
    displayName: normalizeDisplayName(displayName || 'Joueur'),
    pseudoChosen: provider !== 'google',
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    coins: 1500,
    xp: 0,
    seasonXp: 0,
    ownedPawns: ['classic'],
    equippedPawn: 'classic',
    ownedDice: ['classic_dice'],
    equippedDice: 'classic_dice',
    ownedTitles: ['title_none'],
    equippedTitle: 'title_none',
    battlePass: {
      premium: false,
      claimedFree: [],
      claimedPremium: [],
    },
    stats: { wins: 0, played: 0, streak: 0, bestStreak: 0 },
    redeemedCodes: [],
    createdAt: Date.now(),
  };
  accounts[id] = account;
  if (provider && externalId) providerIndex[`${provider}:${externalId}`] = id;
  registerDisplayName(account);
  save();
  return account;
}

function getByProvider(provider, externalId) {
  const id = providerIndex[`${provider}:${externalId}`];
  return id ? accounts[id] || null : null;
}

function getOrCreateByProvider(provider, externalId, displayName) {
  const key = `${provider}:${externalId}`;
  const existingId = providerIndex[key];
  if (existingId && accounts[existingId]) {
    const acc = accounts[existingId];
    // Ne pas écraser un pseudo déjà choisi par l'utilisateur
    if (displayName && !acc.pseudoChosen) {
      const next = normalizeDisplayName(displayName);
      if (next !== acc.displayName) {
        if (isDisplayNameTaken(next, acc.id)) return { error: 'pseudo_taken' };
        unregisterDisplayName(acc);
        acc.displayName = next;
        registerDisplayName(acc);
        save();
      }
    }
    return { account: acc };
  }
  const name = normalizeDisplayName(displayName || 'Joueur');
  if (isDisplayNameTaken(name)) return { error: 'pseudo_taken' };
  return { account: createAccount({ provider, externalId, displayName: name }) };
}

function getById(id) {
  return accounts[id] || null;
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = userId;
  save();
  return token;
}

function getUserByToken(token) {
  const userId = sessions[token];
  if (!userId) return null;
  return accounts[userId] || null;
}

function destroySession(token) {
  delete sessions[token];
  save();
}

function setDisplayName(account, newName, { initial = false } = {}) {
  if (!account) return { error: 'not_found' };
  const name = normalizeDisplayName(newName);
  if (name.length < 2) return { error: 'name_short' };
  const isInitial = initial || !account.pseudoChosen;
  if (!isInitial) {
    if (name === account.displayName) return { error: 'same_name' };
    const used = getRenameCount(account);
    if (used >= RENAME_LIMIT_PER_MONTH) {
      return { error: 'rename_limit', remaining: 0, limit: RENAME_LIMIT_PER_MONTH };
    }
    if (!account.renameHistory) account.renameHistory = {};
    account.renameHistory[currentMonthKey()] = used + 1;
  }
  if (isDisplayNameTaken(name, account.id)) return { error: 'pseudo_taken' };
  unregisterDisplayName(account);
  account.displayName = name;
  account.pseudoChosen = true;
  registerDisplayName(account);
  save();
  return { account };
}

// --- Profil public (envoyé au client) ---
function getProfile(account) {
  if (!account) return null;
  const lvl = computeLevel(account.xp);
  const pass = computePassProgress(account.seasonXp);
  return {
    id: account.id,
    displayName: account.displayName,
    pseudoChosen: account.pseudoChosen !== false,
    provider: account.provider,
    avatar: account.avatar,
    coins: account.coins,
    xp: account.xp,
    level: lvl.level,
    xpIntoLevel: lvl.xpIntoLevel,
    xpForNext: lvl.xpForNext,
    ownedPawns: account.ownedPawns,
    equippedPawn: account.equippedPawn,
    equippedPawnEmoji: getPawn(account.equippedPawn).emoji,
    ownedDice: account.ownedDice || ['classic_dice'],
    equippedDice: account.equippedDice || 'classic_dice',
    equippedDiceStyle: getDice(account.equippedDice || 'classic_dice').style,
    ownedTitles: account.ownedTitles || ['title_none'],
    equippedTitle: account.equippedTitle || 'title_none',
    equippedTitleLabel: getTitle(account.equippedTitle || 'title_none').label || '',
    battlePass: {
      premium: account.battlePass.premium,
      tier: pass.tier,
      xpIntoTier: pass.xpIntoTier,
      xpPerTier: pass.xpPerTier,
      maxTier: pass.maxTier,
      claimedFree: account.battlePass.claimedFree,
      claimedPremium: account.battlePass.claimedPremium,
    },
    stats: account.stats,
    matchHistory: account.matchHistory || [],
    renamesRemaining: getRenamesRemaining(account),
    renamesLimit: RENAME_LIMIT_PER_MONTH,
  };
}

// --- Économie / boutique (pions + dés) ---
function ownedListFor(account, type) {
  if (type === 'dice') {
    if (!account.ownedDice) account.ownedDice = ['classic_dice'];
    return account.ownedDice;
  }
  if (type === 'title') {
    if (!account.ownedTitles) account.ownedTitles = ['title_none'];
    return account.ownedTitles;
  }
  return account.ownedPawns;
}

function buyCosmetic(account, itemId) {
  const item = getCosmetic(itemId);
  if (!item) return { error: 'Objet introuvable' };
  if (item.source === 'pass') return { error: 'Cet objet s\'obtient via le passe' };
  const owned = ownedListFor(account, item.type);
  if (owned.includes(itemId)) return { error: 'Déjà possédé' };
  if (account.coins < item.price) return { error: 'Pièces insuffisantes' };
  account.coins -= item.price;
  owned.push(itemId);
  save();
  return { success: true };
}

function equipCosmetic(account, itemId) {
  const item = getCosmetic(itemId);
  if (!item) return { error: 'Objet introuvable' };
  const owned = ownedListFor(account, item.type);
  if (!owned.includes(itemId)) return { error: 'Objet non possédé' };
  if (item.type === 'dice') account.equippedDice = itemId;
  else if (item.type === 'title') account.equippedTitle = itemId;
  else account.equippedPawn = itemId;
  save();
  return { success: true };
}

// Compat : anciennes signatures
function buyPawn(account, pawnId) { return buyCosmetic(account, pawnId); }
function equipPawn(account, pawnId) { return equipCosmetic(account, pawnId); }

// --- Battle pass ---
function buyPremiumPass(account) {
  if (account.battlePass.premium) return { error: 'Passe premium déjà actif' };
  if (account.coins < PASS_PREMIUM_PRICE) return { error: 'Pièces insuffisantes' };
  account.coins -= PASS_PREMIUM_PRICE;
  account.battlePass.premium = true;
  save();
  return { success: true };
}

function grantReward(account, reward) {
  if (reward.type === 'coins') {
    account.coins += reward.amount;
  } else if (reward.type === 'pawn') {
    if (!account.ownedPawns.includes(reward.pawnId)) account.ownedPawns.push(reward.pawnId);
  } else if (reward.type === 'dice') {
    if (!account.ownedDice) account.ownedDice = ['classic_dice'];
    if (!account.ownedDice.includes(reward.diceId)) account.ownedDice.push(reward.diceId);
  } else if (reward.type === 'title') {
    if (!account.ownedTitles) account.ownedTitles = ['title_none'];
    if (!account.ownedTitles.includes(reward.titleId)) account.ownedTitles.push(reward.titleId);
  } else if (reward.type === 'premium_pass') {
    account.battlePass.premium = true;
  }
}

function claimPassReward(account, tier, track) {
  const tierDef = BATTLE_PASS.find((t) => t.tier === tier);
  if (!tierDef) return { error: 'Palier invalide' };

  const progress = computePassProgress(account.seasonXp);
  if (tier > progress.tier) return { error: 'Palier non atteint' };

  if (track === 'premium' && !account.battlePass.premium) {
    return { error: 'Passe premium requis' };
  }

  const claimedList = track === 'premium' ? account.battlePass.claimedPremium : account.battlePass.claimedFree;
  if (claimedList.includes(tier)) return { error: 'Récompense déjà réclamée' };

  const reward = track === 'premium' ? tierDef.premium : tierDef.free;
  grantReward(account, reward);
  claimedList.push(tier);
  save();
  return { success: true, reward };
}

// --- Fin de partie ---
function redeemPromo(account, code) {
  const normalized = (code || '').toUpperCase().trim();
  const def = getPromo(normalized);
  if (!def) return { error: 'Code invalide' };
  if (!account.redeemedCodes) account.redeemedCodes = [];
  if (account.redeemedCodes.includes(normalized)) return { error: 'Code déjà utilisé' };
  if (def.maxUses && (promoUsage[normalized] || 0) >= def.maxUses) {
    return { error: 'Ce code a atteint sa limite' };
  }

  const r = def.rewards;
  if (r.coins) account.coins += r.coins;
  if (r.premiumPass) account.battlePass.premium = true;
  if (Array.isArray(r.pawns)) {
    for (const pid of r.pawns) {
      if (PAWN_MAP[pid] && !account.ownedPawns.includes(pid)) account.ownedPawns.push(pid);
    }
  }

  account.redeemedCodes.push(normalized);
  promoUsage[normalized] = (promoUsage[normalized] || 0) + 1;
  save();
  return {
    success: true,
    description: def.description,
    rewards: r,
    remaining: def.maxUses ? Math.max(0, def.maxUses - promoUsage[normalized]) : null,
  };
}

const MATCH_HISTORY_LIMIT = 20;

function applyMatchResult(account, { isWinner, opponents, hasBots = false, rank = null, totalPlayers = null, standings = null }) {
  if (typeof account.stats.streak !== 'number') account.stats.streak = 0;
  if (typeof account.stats.bestStreak !== 'number') account.stats.bestStreak = 0;

  // Met à jour la série AVANT le calcul de la récompense (le bonus reflète la nouvelle série).
  if (isWinner) {
    account.stats.streak += 1;
    if (account.stats.streak > account.stats.bestStreak) account.stats.bestStreak = account.stats.streak;
  } else {
    account.stats.streak = 0;
  }

  const reward = computeMatchReward({
    isWinner,
    opponents,
    isPremium: account.battlePass.premium,
    streak: account.stats.streak,
    hasBots,
  });
  account.coins += reward.coins;
  account.xp += reward.xp;
  account.seasonXp += reward.xp;
  account.stats.played += 1;
  if (isWinner) account.stats.wins += 1;

  if (!account.matchHistory) account.matchHistory = [];
  account.matchHistory.unshift({
    date: Date.now(),
    isWinner,
    rank,
    totalPlayers,
    hasBots,
    standings,
  });
  if (account.matchHistory.length > MATCH_HISTORY_LIMIT) account.matchHistory.length = MATCH_HISTORY_LIMIT;

  save();
  return { ...reward, currentStreak: account.stats.streak, bestStreak: account.stats.bestStreak };
}

load();

module.exports = {
  getOrCreateByProvider,
  getByProvider,
  isDisplayNameTaken,
  isValidEmail: (email) => {
    const e = (email || '').toString().trim().toLowerCase();
    if (!e || e.length > 254) return false;
    return /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(e);
  },
  createAccount,
  getById,
  createSession,
  getUserByToken,
  destroySession,
  getProfile,
  setDisplayName,
  buyPawn,
  equipPawn,
  buyCosmetic,
  equipCosmetic,
  buyPremiumPass,
  claimPassReward,
  redeemPromo,
  applyMatchResult,
};
