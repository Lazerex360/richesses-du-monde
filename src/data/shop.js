// Cosmétiques : pions et dés personnalisables.
// Raretés (4 niveaux) déterminées par le prix : commun < rare < épique < unique.

// Seuils de prix -> rareté (pions / dés)
function rarityFromPrice(price) {
  if (price >= 7000) return 'unique';
  if (price >= 3500) return 'épique';
  if (price >= 1500) return 'rare';
  return 'commun';
}

// Titres honorifiques : gamme de prix plus basse (max ~3200 pièces)
function rarityFromTitlePrice(price) {
  if (price >= 2200) return 'épique';
  if (price >= 1400) return 'rare';
  return 'commun';
}

// ---------------- PIONS ----------------
// source: 'default' (offert), 'shop' (achat), 'pass' (récompense de passe)
const RAW_PAWNS = [
  { id: 'classic', name: 'Jeton Classique', emoji: '🔘', price: 0, source: 'default' },
  { id: 'explorer', name: 'Explorateur', emoji: '🧭', price: 800, source: 'shop' },
  { id: 'ship', name: 'Navire Marchand', emoji: '⛵', price: 1200, source: 'shop' },
  { id: 'plane', name: 'Jet Privé', emoji: '✈️', price: 1500, source: 'shop' },
  { id: 'gem', name: 'Diamant', emoji: '💎', price: 2500, source: 'shop' },
  { id: 'crown', name: 'Couronne', emoji: '👑', price: 3000, source: 'shop' },
  { id: 'rocket', name: 'Fusée', emoji: '🚀', price: 3500, source: 'shop' },
  { id: 'castle', name: 'Château', emoji: '🏰', price: 4000, source: 'shop' },
  { id: 'robot', name: 'Robot', emoji: '🤖', price: 4500, source: 'shop' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', price: 6000, source: 'shop' },
  { id: 'ufo', name: 'OVNI', emoji: '🛸', price: 7000, source: 'shop' },
  { id: 'trophy', name: "Trophée d'Or", emoji: '🏆', price: 9000, source: 'shop' },
  // Exclusifs au passe (rareté fixée manuellement, prix 0)
  { id: 'fox', name: 'Renard Rusé', emoji: '🦊', price: 0, source: 'pass', rarity: 'rare' },
  { id: 'tiger', name: 'Tigre', emoji: '🐯', price: 0, source: 'pass', rarity: 'épique' },
  { id: 'unicorn', name: 'Licorne', emoji: '🦄', price: 0, source: 'pass', rarity: 'unique' },
  { id: 'phoenix', name: 'Phénix', emoji: '🔥', price: 0, source: 'pass', rarity: 'unique' },
];

// ---------------- DÉS ----------------
// style = apparence des faces (fond / couleur du chiffre / bordure)
const RAW_DICE = [
  { id: 'classic_dice', name: 'Dé Classique', price: 0, source: 'default', style: { bg: '#ffffff', color: '#1a1a2e', border: 'transparent' } },
  { id: 'ruby_dice', name: 'Dé Rubis', price: 1000, source: 'shop', style: { bg: '#e74c3c', color: '#ffffff', border: '#ff7a6b' } },
  { id: 'ocean_dice', name: 'Dé Océan', price: 1500, source: 'shop', style: { bg: '#2980b9', color: '#ffffff', border: '#5dade2' } },
  { id: 'emerald_dice', name: 'Dé Émeraude', price: 2000, source: 'shop', style: { bg: '#27ae60', color: '#ffffff', border: '#58d68d' } },
  { id: 'gold_dice', name: 'Dé Doré', price: 3500, source: 'shop', style: { bg: 'linear-gradient(135deg,#f0d78c,#b8860b)', color: '#1a1200', border: '#f0d78c' } },
  { id: 'shadow_dice', name: 'Dé de l\'Ombre', price: 4000, source: 'shop', style: { bg: '#1a1a2e', color: '#d4a853', border: '#6c3483' } },
  { id: 'neon_dice', name: 'Dé Néon', price: 6000, source: 'shop', style: { bg: 'linear-gradient(135deg,#00f5d4,#7a5cff)', color: '#0a1628', border: '#00f5d4' } },
  { id: 'galaxy_dice', name: 'Dé Galaxie', price: 8000, source: 'shop', style: { bg: 'linear-gradient(135deg,#6c3483,#3aa0ff)', color: '#ffffff', border: '#b06bff' } },
  // Exclusif au passe
  { id: 'prism_dice', name: 'Dé Prisme', price: 0, source: 'pass', rarity: 'unique', style: { bg: 'linear-gradient(135deg,#ff6b6b,#feca57,#48dbfb,#1dd1a1)', color: '#0a1628', border: '#ffffff' } },
];

// ---------------- TITRES PERSONNALISÉS (affichés en partie) ----------------
const RAW_TITLES = [
  { id: 'title_none', name: 'Sans titre', label: '', price: 0, source: 'default' },
  { id: 'title_boss', name: 'Le Boss', label: 'Le Boss', price: 1200, source: 'shop' },
  { id: 'title_rice', name: 'Le maniaque du riz', label: 'Le maniaque du riz', price: 1500, source: 'shop' },
  { id: 'title_wheat', name: 'Roi du blé', label: 'Roi du blé', price: 1600, source: 'shop' },
  { id: 'title_dealer', name: 'Le négociateur', label: 'Le négociateur', price: 1800, source: 'shop' },
  { id: 'title_oil', name: 'Baron du pétrole', label: 'Baron du pétrole', price: 2200, source: 'shop' },
  { id: 'title_bank', name: 'La terreur des banques', label: 'La terreur des banques', price: 2500, source: 'shop' },
  { id: 'title_auction', name: "L'as des enchères", label: "L'as des enchères", price: 2800, source: 'shop' },
  { id: 'title_mogul', name: 'Mogul mondial', label: 'Mogul mondial', price: 3200, source: 'shop' },
  { id: 'title_tycoon', name: 'Magnat en herbe', label: 'Magnat en herbe', price: 1000, source: 'shop' },
  { id: 'title_gaz', name: 'Duchesse du gaz', label: 'Duchesse du gaz', price: 2000, source: 'shop' },
  { id: 'title_legend', name: 'Légende Lansay', label: 'Légende Lansay', price: 0, source: 'pass', rarity: 'unique' },
];

function finalize(items, type) {
  const rarityFn = type === 'title' ? rarityFromTitlePrice : rarityFromPrice;
  return items.map((it) => ({
    ...it,
    type,
    rarity: it.rarity || rarityFn(it.price),
  }));
}

const PAWNS = finalize(RAW_PAWNS, 'pawn');
const DICE = finalize(RAW_DICE, 'dice');
const TITLES = finalize(RAW_TITLES, 'title');

const COSMETICS = [...PAWNS, ...DICE, ...TITLES];
const COSMETIC_MAP = Object.fromEntries(COSMETICS.map((c) => [c.id, c]));
const PAWN_MAP = Object.fromEntries(PAWNS.map((p) => [p.id, p]));
const DICE_MAP = Object.fromEntries(DICE.map((d) => [d.id, d]));
const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));

function getCosmetic(id) {
  return COSMETIC_MAP[id] || null;
}
function getPawn(id) {
  return PAWN_MAP[id] || PAWN_MAP.classic;
}
function getDice(id) {
  return DICE_MAP[id] || DICE_MAP.classic_dice;
}
function getTitle(id) {
  return TITLE_MAP[id] || TITLE_MAP.title_none;
}

module.exports = {
  PAWNS,
  DICE,
  TITLES,
  COSMETICS,
  COSMETIC_MAP,
  PAWN_MAP,
  DICE_MAP,
  TITLE_MAP,
  getCosmetic,
  getPawn,
  getDice,
  getTitle,
  rarityFromPrice,
  rarityFromTitlePrice,
};
