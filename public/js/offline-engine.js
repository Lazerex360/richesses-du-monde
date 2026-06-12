/* GÉNÉRÉ par tools/build-offline.js — NE PAS ÉDITER À LA MAIN.
   Moteur de jeu serveur empaqueté pour le mode hors-ligne navigateur. */
(function () {
'use strict';
const __modules = {};
const __cache = {};
function __require(name) {
  const key = name.split('/').pop().replace(/\.js$/, '');
  if (key === 'crypto') {
    return {
      randomUUID: () => (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : 'loc-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2, 10),
    };
  }
  if (__cache[key]) return __cache[key].exports;
  const fn = __modules[key];
  if (!fn) throw new Error('Module hors-ligne introuvable : ' + name);
  const module = { exports: {} };
  __cache[key] = module;
  fn(module, module.exports, __require);
  return module.exports;
}

/* ── src/data/resources.js ─────────────────────────────── */
__modules["resources"] = function (module, exports, require) {
// 24 richesses mondiales - 144 titres d'exploitation (6 par richesse)
const RESOURCES = {
  aluminium: {
    name: 'Aluminium',
    color: '#3498db',
    titles: [
      { country: 'Australie', countryId: 'australie', percent: 5, price: 500000 },
      { country: 'Inde', countryId: 'inde', percent: 5, price: 500000 },
      { country: 'Canada', countryId: 'canada', percent: 10, price: 1000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 10, price: 1000000 },
      { country: 'Russie', countryId: 'russie', percent: 15, price: 1500000 },
      { country: 'Chine', countryId: 'chine', percent: 45, price: 3500000 },
    ],
  },
  ble: {
    name: 'Blé',
    color: '#f1c40f',
    titles: [
      { country: 'Australie', countryId: 'australie', percent: 5, price: 500000 },
      { country: 'Russie', countryId: 'russie', percent: 10, price: 1000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 15, price: 1500000 },
      { country: 'Inde', countryId: 'inde', percent: 15, price: 1500000 },
      { country: 'France', countryId: 'france', percent: 25, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 3000000 },
    ],
  },
  bois: {
    name: 'Bois',
    color: '#8B4513',
    titles: [
      { country: 'Nigeria', countryId: 'afrique_ouest', percent: 5, price: 500000 },
      { country: 'RDC', countryId: 'afrique_centrale', percent: 10, price: 1000000 },
      { country: 'Éthiopie', countryId: 'afrique_est', percent: 10, price: 1000000 },
      { country: 'Brésil', countryId: 'bresil', percent: 20, price: 1500000 },
      { country: 'Chine', countryId: 'chine', percent: 20, price: 1500000 },
      { country: 'Inde', countryId: 'inde', percent: 35, price: 3000000 },
    ],
  },
  cacao: {
    name: 'Cacao',
    color: '#6d4c41',
    titles: [
      { country: 'Cameroun', countryId: 'afrique_centrale', percent: 5, price: 500000 },
      { country: 'Brésil', countryId: 'bresil', percent: 5, price: 500000 },
      { country: 'Nigeria', countryId: 'afrique_ouest', percent: 10, price: 1000000 },
      { country: 'Indonésie', countryId: 'indonesie', percent: 15, price: 1500000 },
      { country: 'Ghana', countryId: 'afrique_ouest', percent: 30, price: 3000000 },
      { country: "Côte d'Ivoire", countryId: 'afrique_ouest', percent: 35, price: 3500000 },
    ],
  },
  cafe: {
    name: 'Café',
    color: '#795548',
    titles: [
      { country: 'Éthiopie', countryId: 'afrique_est', percent: 10, price: 1000000 },
      { country: 'Inde', countryId: 'inde', percent: 10, price: 1000000 },
      { country: 'Colombie', countryId: 'amerique_centrale', percent: 15, price: 1500000 },
      { country: 'Indonésie', countryId: 'indonesie', percent: 15, price: 1500000 },
      { country: 'Vietnam', countryId: 'asie_sud', percent: 20, price: 2000000 },
      { country: 'Brésil', countryId: 'bresil', percent: 30, price: 3000000 },
    ],
  },
  charbon: {
    name: 'Charbon',
    color: '#2c3e50',
    titles: [
      { country: 'Russie', countryId: 'russie', percent: 5, price: 500000 },
      { country: 'Australie', countryId: 'australie', percent: 10, price: 1000000 },
      { country: 'Indonésie', countryId: 'indonesie', percent: 10, price: 1000000 },
      { country: 'Inde', countryId: 'inde', percent: 10, price: 1000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 45, price: 3500000 },
    ],
  },
  cobalt: {
    name: 'Cobalt',
    color: '#1abc9c',
    titles: [
      { country: 'Nouvelle-Calédonie', countryId: 'oceanie', percent: 5, price: 500000 },
      { country: 'Russie', countryId: 'russie', percent: 5, price: 500000 },
      { country: 'Zambie', countryId: 'afrique_australe', percent: 10, price: 1000000 },
      { country: 'Australie', countryId: 'australie', percent: 20, price: 2000000 },
      { country: 'Cuba', countryId: 'cuba', percent: 25, price: 2500000 },
      { country: 'RDC', countryId: 'afrique_centrale', percent: 35, price: 5000000 },
    ],
  },
  coton: {
    name: 'Coton',
    color: '#ecf0f1',
    titles: [
      { country: 'Australie', countryId: 'australie', percent: 5, price: 500000 },
      { country: 'Pakistan', countryId: 'peninsule_indienne', percent: 15, price: 1500000 },
      { country: 'Brésil', countryId: 'bresil', percent: 15, price: 1500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 20, price: 2000000 },
      { country: 'Inde', countryId: 'inde', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 25, price: 2500000 },
    ],
  },
  cuivre: {
    name: 'Cuivre',
    color: '#e67e22',
    titles: [
      { country: 'Australie', countryId: 'australie', percent: 5, price: 500000 },
      { country: 'Russie', countryId: 'russie', percent: 5, price: 500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 10, price: 1000000 },
      { country: 'Pérou', countryId: 'pays_andins', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 20, price: 2000000 },
      { country: 'Chili', countryId: 'pays_andins', percent: 40, price: 3500000 },
    ],
  },
  eolien: {
    name: 'Éolien',
    color: '#16a085',
    titles: [
      { country: 'Royaume-Uni', countryId: 'royaume_uni', percent: 5, price: 500000 },
      { country: 'Espagne', countryId: 'europe_med', percent: 10, price: 500000 },
      { country: 'Inde', countryId: 'inde', percent: 10, price: 500000 },
      { country: 'Allemagne', countryId: 'allemagne', percent: 20, price: 1500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 25, price: 2500000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 2500000 },
    ],
  },
  fer: {
    name: 'Fer',
    color: '#7f8c8d',
    titles: [
      { country: 'Ukraine', countryId: 'europe_est', percent: 5, price: 500000 },
      { country: 'Inde', countryId: 'inde', percent: 10, price: 1000000 },
      { country: 'Russie', countryId: 'russie', percent: 10, price: 1000000 },
      { country: 'Brésil', countryId: 'bresil', percent: 20, price: 2000000 },
      { country: 'Australie', countryId: 'australie', percent: 25, price: 2500000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 3000000 },
    ],
  },
  gaz: {
    name: 'Gaz',
    color: '#9b59b6',
    titles: [
      { country: 'Chine', countryId: 'chine', percent: 5, price: 500000 },
      { country: 'Canada', countryId: 'canada', percent: 10, price: 1500000 },
      { country: 'Iran', countryId: 'moyen_orient', percent: 15, price: 1500000 },
      { country: 'Qatar', countryId: 'moyen_orient', percent: 15, price: 1500000 },
      { country: 'Russie', countryId: 'russie', percent: 25, price: 2000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 30, price: 2500000 },
    ],
  },
  hydraulique: {
    name: 'Hydraulique',
    color: '#2980b9',
    titles: [
      { country: 'Venezuela', countryId: 'amerique_centrale', percent: 10, price: 500000 },
      { country: 'Pérou', countryId: 'pays_andins', percent: 10, price: 1000000 },
      { country: 'Brésil', countryId: 'bresil', percent: 10, price: 1000000 },
      { country: 'Canada', countryId: 'canada', percent: 10, price: 1000000 },
      { country: 'Colombie', countryId: 'amerique_centrale', percent: 20, price: 2000000 },
      { country: 'Norvège', countryId: 'norvege', percent: 40, price: 4000000 },
    ],
  },
  laine: {
    name: 'Laine',
    color: '#bdc3c7',
    titles: [
      { country: 'Iran', countryId: 'moyen_orient', percent: 10, price: 1000000 },
      { country: 'Nouvelle-Zélande', countryId: 'oceanie', percent: 10, price: 1000000 },
      { country: 'Argentine', countryId: 'argentine', percent: 10, price: 1000000 },
      { country: 'Royaume-Uni', countryId: 'royaume_uni', percent: 10, price: 1000000 },
      { country: 'Australie', countryId: 'australie', percent: 30, price: 3500000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 3500000 },
    ],
  },
  mais: {
    name: 'Maïs',
    color: '#f39c12',
    titles: [
      { country: 'Argentine', countryId: 'argentine', percent: 5, price: 500000 },
      { country: 'Inde', countryId: 'inde', percent: 5, price: 500000 },
      { country: 'France', countryId: 'france', percent: 15, price: 1500000 },
      { country: 'Brésil', countryId: 'bresil', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 25, price: 2500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 30, price: 3000000 },
    ],
  },
  or: {
    name: 'Or',
    color: '#ffd700',
    titles: [
      { country: 'Pérou', countryId: 'pays_andins', percent: 5, price: 500000 },
      { country: 'Afrique du Sud', countryId: 'afrique_australe', percent: 5, price: 500000 },
      { country: 'Russie', countryId: 'russie', percent: 15, price: 1000000 },
      { country: 'Australie', countryId: 'australie', percent: 20, price: 2000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 4500000 },
    ],
  },
  petrole: {
    name: 'Pétrole',
    color: '#1a1a2e',
    titles: [
      { country: 'Iran', countryId: 'moyen_orient', percent: 5, price: 500000 },
      { country: 'Canada', countryId: 'canada', percent: 10, price: 1000000 },
      { country: 'Chine', countryId: 'chine', percent: 15, price: 1500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 20, price: 2500000 },
      { country: 'Arabie Saoudite', countryId: 'moyen_orient', percent: 25, price: 3000000 },
      { country: 'Russie', countryId: 'russie', percent: 25, price: 3000000 },
    ],
  },
  plomb: {
    name: 'Plomb',
    color: '#636e72',
    titles: [
      { country: 'Russie', countryId: 'russie', percent: 5, price: 500000 },
      { country: 'Pérou', countryId: 'pays_andins', percent: 10, price: 500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 10, price: 1000000 },
      { country: 'Mexique', countryId: 'mexique', percent: 10, price: 1000000 },
      { country: 'Australie', countryId: 'australie', percent: 25, price: 1500000 },
      { country: 'Chine', countryId: 'chine', percent: 40, price: 3500000 },
    ],
  },
  riz: {
    name: 'Riz',
    color: '#dfe6e9',
    titles: [
      { country: 'Vietnam', countryId: 'asie_sud', percent: 10, price: 1000000 },
      { country: 'Bangladesh', countryId: 'asie_sud', percent: 10, price: 1000000 },
      { country: 'Thaïlande', countryId: 'asie_sud', percent: 10, price: 1000000 },
      { country: 'Indonésie', countryId: 'indonesie', percent: 10, price: 1000000 },
      { country: 'Chine', countryId: 'chine', percent: 30, price: 3500000 },
      { country: 'Inde', countryId: 'inde', percent: 30, price: 3500000 },
    ],
  },
  solaire: {
    name: 'Solaire',
    color: '#f39c12',
    titles: [
      { country: 'Espagne', countryId: 'europe_med', percent: 5, price: 500000 },
      { country: 'États-Unis', countryId: 'usa', percent: 10, price: 1000000 },
      { country: 'Japon', countryId: 'japon', percent: 15, price: 1000000 },
      { country: 'Italie', countryId: 'europe_med', percent: 20, price: 2000000 },
      { country: 'Chine', countryId: 'chine', percent: 20, price: 2000000 },
      { country: 'Allemagne', countryId: 'allemagne', percent: 25, price: 2000000 },
    ],
  },
  sucre: {
    name: 'Sucre',
    color: '#fd79a8',
    titles: [
      { country: 'Pakistan', countryId: 'peninsule_indienne', percent: 5, price: 500000 },
      { country: 'Mexique', countryId: 'mexique', percent: 10, price: 2000000 },
      { country: 'Thaïlande', countryId: 'asie_sud', percent: 15, price: 2000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 15, price: 2000000 },
      { country: 'Brésil', countryId: 'bresil', percent: 25, price: 2500000 },
      { country: 'Inde', countryId: 'inde', percent: 25, price: 2500000 },
    ],
  },
  the: {
    name: 'Thé',
    color: '#27ae60',
    titles: [
      { country: 'Vietnam', countryId: 'asie_sud', percent: 5, price: 500000 },
      { country: 'Turquie', countryId: 'moyen_orient', percent: 5, price: 500000 },
      { country: 'Sri Lanka', countryId: 'peninsule_indienne', percent: 10, price: 1000000 },
      { country: 'Kenya', countryId: 'afrique_est', percent: 15, price: 1500000 },
      { country: 'Inde', countryId: 'inde', percent: 30, price: 3000000 },
      { country: 'Chine', countryId: 'chine', percent: 35, price: 3000000 },
    ],
  },
  tourisme: {
    name: 'Tourisme',
    color: '#e84393',
    titles: [
      { country: 'Italie', countryId: 'europe_med', percent: 10, price: 1000000 },
      { country: 'Turquie', countryId: 'moyen_orient', percent: 10, price: 1000000 },
      { country: 'Chine', countryId: 'chine', percent: 15, price: 1000000 },
      { country: 'Espagne', countryId: 'europe_med', percent: 20, price: 2000000 },
      { country: 'États-Unis', countryId: 'usa', percent: 20, price: 2000000 },
      { country: 'France', countryId: 'france', percent: 25, price: 2000000 },
    ],
  },
  uranium: {
    name: 'Uranium',
    color: '#00b894',
    titles: [
      { country: 'Russie', countryId: 'russie', percent: 5, price: 500000 },
      { country: 'Namibie', countryId: 'afrique_australe', percent: 10, price: 1000000 },
      { country: 'Niger', countryId: 'afrique_centrale', percent: 10, price: 1000000 },
      { country: 'Australie', countryId: 'australie', percent: 15, price: 1000000 },
      { country: 'Canada', countryId: 'canada', percent: 20, price: 2000000 },
      { country: 'Kazakhstan', countryId: 'peninsule_indienne', percent: 40, price: 3000000 },
    ],
  },
};

const CONTINENTS = {
  europe: ['france', 'allemagne', 'europe_med', 'royaume_uni', 'norvege', 'europe_est'],
  amerique: ['canada', 'bresil', 'amerique_centrale', 'cuba', 'pays_andins', 'argentine', 'mexique'],
  asie: ['asie_sud', 'chine', 'peninsule_indienne', 'japon', 'inde', 'indonesie', 'moyen_orient'],
  afrique: ['afrique_australe', 'afrique_centrale', 'afrique_est', 'afrique_ouest'],
  oceanie: ['australie', 'oceanie'],
};

const STARTING_MONEY = {
  2: 100000000,
  3: 66000000,
  4: 50000000,
  5: 40000000,
  6: 33000000,
};

// Royalties officielles Lansay — gain max au palier 90 % (barème imprimé sur les cartes)
const ROYALTY_THRESHOLDS = [30, 50, 70, 90];
/** Seuil de détention (%) pour activer le monopole sur une richesse */
const MONOPOLY_THRESHOLD = 90;

function hasResourceMonopoly(totalPercent) {
  return totalPercent >= MONOPOLY_THRESHOLD;
}
const ROYALTY_MAX_90 = {
  or: 8000000, cobalt: 8000000,
  plomb: 10000000, the: 10000000, laine: 10000000, cafe: 10000000,
  coton: 12000000,
  uranium: 14000000, charbon: 14000000,
  sucre: 16000000, gaz: 16000000, riz: 16000000,
  ble: 18000000, fer: 18000000, mais: 18000000, eolien: 18000000, tourisme: 18000000,
  bois: 20000000,
  hydraulique: 22000000,
  petrole: 24000000,
};
const ROYALTY_DEFAULT_MAX = 12000000; // aluminium, cacao, cuivre, solaire

function buildRoyaltiesForResource(resourceId) {
  const max90 = ROYALTY_MAX_90[resourceId] || ROYALTY_DEFAULT_MAX;
  return [
    { min: 30, amount: Math.round(max90 * 0.05) },
    { min: 50, amount: Math.round(max90 * 0.25) },
    { min: 70, amount: Math.round(max90 * 0.5) },
    { min: 90, amount: max90 },
  ];
}

function getResourceRoyalties(resourceId) {
  const resource = RESOURCES[resourceId];
  if (!resource) return [];
  return resource.royalties || buildRoyaltiesForResource(resourceId);
}

function getRoyaltyAmount(resourceId, totalPercent) {
  const tiers = getResourceRoyalties(resourceId);
  let amount = 0;
  for (const tier of tiers) {
    if (totalPercent >= tier.min) amount = tier.amount;
  }
  return amount;
}

for (const [id, resource] of Object.entries(RESOURCES)) {
  resource.royalties = buildRoyaltiesForResource(id);
}

function buildDeck() {
  const deck = {};
  for (const [resourceId, resource] of Object.entries(RESOURCES)) {
    resource.titles.forEach((title, index) => {
      const key = title.countryId;
      if (!deck[key]) deck[key] = [];
      deck[key].push({
        id: `${resourceId}_${index}`,
        resourceId,
        resourceName: resource.name,
        country: title.country,
        countryId: title.countryId,
        percent: title.percent,
        price: title.price,
        ownerId: null,
      });
    });
  }
  return deck;
}

function getAllTitlesFlat() {
  const titles = [];
  for (const [resourceId, resource] of Object.entries(RESOURCES)) {
    resource.titles.forEach((title, index) => {
      titles.push({
        id: `${resourceId}_${index}`,
        resourceId,
        resourceName: resource.name,
        country: title.country,
        countryId: title.countryId,
        percent: title.percent,
        price: title.price,
      });
    });
  }
  return titles;
}

module.exports = {
  RESOURCES,
  CONTINENTS,
  STARTING_MONEY,
  ROYALTY_THRESHOLDS,
  MONOPOLY_THRESHOLD,
  hasResourceMonopoly,
  ROYALTY_MAX_90,
  ROYALTY_DEFAULT_MAX,
  buildRoyaltiesForResource,
  getResourceRoyalties,
  getRoyaltyAmount,
  buildDeck,
  getAllTitlesFlat,
};

};

/* ── src/data/board.js ─────────────────────────────── */
__modules["board"] = function (module, exports, require) {
// Plateau Lansay — double boucle imbriquée (2 rectangles concentriques)
// Grande boucle (extérieur) : Départ → … → 2e « 500 000 € » sans ressource
// Petite boucle (intérieur) : Enchères → Australie → … → dernière Enchère → retour Allemagne

const ZONE_COLORS = {
  europe: '#7dce82',
  russie: '#1e6b3a',
  usa: '#c0392b',
  amerique: '#e67e22',
  asie: '#3498db',
  oceanie: '#e91e8c',
  afrique: '#9b59b6',
};

const COUNTRY_ZONE = {
  france: 'europe', allemagne: 'europe', europe_med: 'europe', royaume_uni: 'europe',
  norvege: 'europe', europe_est: 'europe',
  russie: 'russie',
  usa: 'usa',
  canada: 'amerique', bresil: 'amerique', amerique_centrale: 'amerique', cuba: 'amerique',
  pays_andins: 'amerique', argentine: 'amerique', mexique: 'amerique',
  chine: 'asie', inde: 'asie', japon: 'asie', indonesie: 'asie', asie_sud: 'asie',
  peninsule_indienne: 'asie', moyen_orient: 'asie',
  australie: 'oceanie', oceanie: 'oceanie',
  afrique_australe: 'afrique', afrique_centrale: 'afrique', afrique_est: 'afrique', afrique_ouest: 'afrique',
};

function zoneForSpace(space) {
  if (space.type === 'country' && space.countryId) return COUNTRY_ZONE[space.countryId] || 'europe';
  if (space.type === 'continental' && space.continent) {
    const map = { europe: 'europe', amerique: 'amerique', asie: 'asie', afrique: 'afrique', oceanie: 'oceanie' };
    return map[space.continent] || 'europe';
  }
  return null;
}

const EUROPE_SANS_RUSSIE = ['france', 'allemagne', 'europe_med', 'royaume_uni', 'norvege', 'europe_est'];
const AMERIQUE_SANS_USA = ['canada', 'bresil', 'amerique_centrale', 'cuba', 'pays_andins', 'argentine', 'mexique'];
const ASIE_SANS_CHINE_INDE = ['japon', 'indonesie', 'asie_sud', 'peninsule_indienne', 'moyen_orient'];

const LOOP_START = 1;

const BOARD_RAW = [
  { type: 'start', label: 'Départ', resource: null },
  { type: 'country', label: 'Allemagne', countryId: 'allemagne', resource: 'cacao' },
  { type: 'country', label: 'Europe de l\'Est', countryId: 'europe_est', resource: 'mais' },
  { type: 'continental', label: 'Choix Europe sauf Russie', continent: 'europe', countries: EUROPE_SANS_RUSSIE, resource: 'riz' },
  { type: 'country', label: 'Europe méditerranéenne', countryId: 'europe_med', resource: 'charbon' },
  { type: 'country', label: 'France', countryId: 'france', resource: 'gaz' },
  { type: 'country', label: 'Royaume-Uni', countryId: 'royaume_uni', resource: 'laine' },
  { type: 'country', label: 'Norvège', countryId: 'norvege', resource: 'petrole' },
  { type: 'country', label: 'Russie', countryId: 'russie', resource: 'tourisme' },
  { type: 'country', label: 'Russie', countryId: 'russie', resource: 'plomb' },
  { type: 'country', label: 'Russie', countryId: 'russie', resource: 'bois' },
  { type: 'auction', label: 'Enchères' },
  { type: 'bonus', label: '500 000 €', resource: 'or' },
  { type: 'news', label: 'Actualité' },
  { type: 'country', label: 'États-Unis', countryId: 'usa', resource: 'cafe' },
  { type: 'country', label: 'États-Unis', countryId: 'usa', resource: 'mais' },
  { type: 'country', label: 'États-Unis', countryId: 'usa', resource: 'eolien' },
  { type: 'news', label: 'Actualité' },
  { type: 'bonus', label: '500 000 €', resource: null },
  { type: 'joker', label: 'Joker' },
  { type: 'continental', label: 'Océanie sauf Australie', continent: 'oceanie', countries: ['oceanie'], resource: 'cuivre' },
  { type: 'country', label: 'Cuba', countryId: 'cuba', resource: 'cobalt' },
  { type: 'country', label: 'Argentine', countryId: 'argentine', resource: 'hydraulique' },
  { type: 'country', label: 'Brésil', countryId: 'bresil', resource: 'uranium' },
  { type: 'country', label: 'Brésil', countryId: 'bresil', resource: 'solaire' },
  { type: 'country', label: 'Amérique centrale', countryId: 'amerique_centrale', resource: 'charbon' },
  { type: 'country', label: 'Mexique', countryId: 'mexique', resource: 'sucre' },
  { type: 'continental', label: 'Choix Amérique sauf États-Unis', continent: 'amerique', countries: AMERIQUE_SANS_USA, resource: null },
  { type: 'country', label: 'Pays andins', countryId: 'pays_andins', resource: 'ble' },
  { type: 'country', label: 'Canada', countryId: 'canada', resource: 'fer' },
  { type: 'auction', label: 'Enchères' },
  { type: 'bonus', label: '500 000 €', resource: 'cacao' },
  { type: 'news', label: 'Actualité' },
  { type: 'country', label: 'Chine', countryId: 'chine', resource: 'petrole' },
  { type: 'country', label: 'Chine', countryId: 'chine', resource: 'riz' },
  { type: 'country', label: 'Chine', countryId: 'chine', resource: 'plomb' },
  { type: 'news', label: 'Actualité' },
  { type: 'bonus', label: '500 000 €', resource: null },
  { type: 'auction', label: 'Enchères' },
  { type: 'country', label: 'Australie', countryId: 'australie', resource: 'laine' },
  { type: 'country', label: 'Australie', countryId: 'australie', resource: 'the' },
  { type: 'country', label: 'Asie du Sud', countryId: 'asie_sud', resource: 'fer' },
  { type: 'country', label: 'Asie du Sud', countryId: 'asie_sud', resource: 'eolien' },
  { type: 'country', label: 'Indonésie', countryId: 'indonesie', resource: 'coton' },
  { type: 'continental', label: 'Choix Asie sauf Chine et Inde', continent: 'asie', countries: ASIE_SANS_CHINE_INDE, resource: 'cuivre' },
  { type: 'country', label: 'Japon', countryId: 'japon', resource: 'aluminium' },
  { type: 'country', label: 'Moyen-Orient', countryId: 'moyen_orient', resource: 'cobalt' },
  { type: 'joker', label: 'Joker' },
  { type: 'bonus', label: '500 000 €', resource: 'cafe' },
  { type: 'customs', label: 'Douane' },
  { type: 'world', label: 'Choix Mondial' },
  { type: 'news', label: 'Actualité' },
  { type: 'bonus', label: '500 000 €', resource: 'ble' },
  { type: 'auction', label: 'Enchères' },
  { type: 'country', label: 'Péninsule indienne sauf Inde', countryId: 'peninsule_indienne', resource: 'or' },
  { type: 'country', label: 'Inde', countryId: 'inde', resource: 'gaz' },
  { type: 'country', label: 'Inde', countryId: 'inde', resource: 'aluminium' },
  { type: 'country', label: 'Afrique centrale', countryId: 'afrique_centrale', resource: 'the' },
  { type: 'country', label: 'Afrique de l\'Est', countryId: 'afrique_est', resource: 'uranium' },
  { type: 'continental', label: 'Choix Afrique', continent: 'afrique', resource: 'hydraulique' },
  { type: 'country', label: 'Afrique australe', countryId: 'afrique_australe', resource: 'tourisme' },
  { type: 'country', label: 'Afrique de l\'Ouest', countryId: 'afrique_ouest', resource: 'sucre' },
  { type: 'joker', label: 'Joker' },
  { type: 'bonus', label: '500 000 €', resource: 'solaire' },
  { type: 'customs', label: 'Douane' },
  { type: 'world', label: 'Choix Mondial' },
  { type: 'news', label: 'Actualité' },
  { type: 'bonus', label: '500 000 €', resource: 'bois' },
];

function removeLastAuction(raw) {
  const board = [...raw];
  for (let i = board.length - 1; i >= 0; i--) {
    if (board[i].type === 'auction') {
      board.splice(i, 1);
      break;
    }
  }
  return board;
}

function buildPlayOrder(raw) {
  const start = raw[0];
  const loop = raw.slice(1);
  const closingAuction = loop.splice(10, 1)[0];
  loop.push(closingAuction);
  return [start, ...loop];
}

const BOARD = buildPlayOrder(removeLastAuction(BOARD_RAW));
const LOOP_END = BOARD.length - 1;
const LOOP_SIZE = LOOP_END - LOOP_START + 1;

// Index de la 2e case « 500 000 € » sans ressource (fin de la grande boucle extérieure)
function findOuterLoopEnd(board) {
  let bonusNoRes = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i].type === 'bonus' && !board[i].resource) {
      bonusNoRes++;
      if (bonusNoRes === 2) return i;
    }
  }
  return board.length - 1;
}

const OUTER_LOOP_END = findOuterLoopEnd(BOARD);
const INNER_LOOP_START = OUTER_LOOP_END + 1;

const BOARD_INSET = 1;

/** Rectangle extérieur 11×10 → périmètre 38, 37 cases de jeu */
const OUTER_RECT = { cols: 11, rows: 10 };
/** Rectangle intérieur 9×8 — left=1 pour marges latérales symétriques (1+9+1 dans 11 cols) */
const INNER_RECT = { cols: 9, rows: 8, left: 1, top: 1 };

const BOARD_LOGIC_GRID = { cols: OUTER_RECT.cols, rows: OUTER_RECT.rows };
const BOARD_GRID = {
  cols: BOARD_LOGIC_GRID.cols + 2 * BOARD_INSET,
  rows: BOARD_LOGIC_GRID.rows + 2 * BOARD_INSET,
};

function rectPerimeterLen(w, h) {
  return 2 * w + 2 * h - 4;
}

// Grande boucle : bas (→ gauche) → gauche (↑) → haut (→ droite) → droite (↓ partiel)
function traceOuterPerimeter(bottom, left, top, right, limit) {
  const path = [];
  for (let c = right; c >= left && path.length < limit; c--) path.push({ row: bottom, col: c });
  for (let r = bottom - 1; r >= top && path.length < limit; r--) path.push({ row: r, col: left });
  for (let c = left + 1; c <= right && path.length < limit; c++) path.push({ row: top, col: c });
  for (let r = top + 1; r <= bottom - 1 && path.length < limit; r++) path.push({ row: r, col: right });
  return path;
}

function traceInnerPerimeter(top, left, right, bottom, limit) {
  const path = [];
  for (let c = left; c <= right && path.length < limit; c++) path.push({ row: top, col: c });
  for (let r = top + 1; r <= bottom && path.length < limit; r++) path.push({ row: r, col: right });
  for (let c = right - 1; c >= left && path.length < limit; c--) path.push({ row: bottom, col: c });
  for (let r = bottom - 1; r > top && path.length < limit; r--) path.push({ row: r, col: left });
  return path;
}

function buildOuterPositions(outerLen, maxR, maxC) {
  return traceOuterPerimeter(maxR, 0, 0, maxC, outerLen);
}

// Petite boucle : anneau intérieur (28 cases) + 2 emplacements de jonction écrasés par applyBoardInset
function buildInnerPositions(innerLen, innerBox) {
  if (innerLen <= 0) return [];
  const right = innerBox.left + innerBox.cols - 1;
  const bottom = innerBox.top + innerBox.rows - 1;
  const midLen = Math.max(0, innerLen - 2);
  const mid = traceInnerPerimeter(innerBox.top, innerBox.left, right, bottom, midLen);
  return [
    { row: innerBox.top, col: innerBox.left },
    ...mid,
    { row: bottom, col: right },
  ];
}

function buildBoardPositions(count, cols, rows, outerEnd = OUTER_LOOP_END) {
  const outerLen = outerEnd + 1;
  const innerLen = count - outerLen;
  return [
    ...buildOuterPositions(outerLen, rows - 1, cols - 1),
    ...buildInnerPositions(innerLen, INNER_RECT),
  ];
}

// Décale toutes les cases vers la grille d'affichage (marge pour les bandeaux de piste)
function applyBoardInset(positions, outerEnd, inset, logicalGrid, displayGrid) {
  const logMaxR = logicalGrid.rows - 1;
  const logMaxC = logicalGrid.cols - 1;
  const maxR = displayGrid.rows - 1;
  const maxC = displayGrid.cols - 1;
  const innerStart = outerEnd + 1;
  const loopEnd = positions.length - 1;

  const mapped = positions.map((p) => {
    let row = p.row + inset;
    let col = p.col + inset;
    if (p.row === 0) row = 0;
    if (p.col === 0) col = 0;
    if (p.row === logMaxR) row = maxR;
    if (p.col === logMaxC) col = maxC;
    return { row, col };
  });

  // Jonction grande → petite boucle (Enchères adjacente à la fin de la grande boucle)
  const outerEndPos = mapped[outerEnd];
  if (outerEndPos.col >= maxC) {
    mapped[innerStart] = { row: Math.min(outerEndPos.row + 1, maxR), col: outerEndPos.col };
  } else {
    mapped[innerStart] = { row: outerEndPos.row, col: outerEndPos.col + 1 };
  }
  // Retour petite boucle → Allemagne
  mapped[loopEnd] = { row: mapped[1].row - 1, col: mapped[1].col };

  // Colonne gauche intérieure : compacter vers le haut (évite le trou sous l'Australie)
  const innerLeftCol = INNER_RECT.left + inset;
  const innerTopRow = INNER_RECT.top + inset;
  const leftStack = [];
  for (let i = innerStart + 1; i < loopEnd; i++) {
    if (mapped[i].col === innerLeftCol && mapped[i].row > innerTopRow) leftStack.push(i);
  }
  leftStack.sort((a, b) => mapped[a].row - mapped[b].row);
  const leftStartRow = innerTopRow + 1;
  leftStack.forEach((idx, n) => {
    mapped[idx] = { row: leftStartRow + n, col: innerLeftCol };
  });

  return mapped;
}

function computeBoardUi(positions, outerEnd) {
  const outer = positions.slice(0, outerEnd + 1);
  const innerStart = outerEnd + 1;
  const loopEnd = positions.length - 1;
  // Bande intérieure sans les 2 cases de jonction sur le bord extérieur
  const innerBand = positions.slice(innerStart, loopEnd + 1).filter((_, i) => {
    const idx = innerStart + i;
    return idx !== innerStart && idx !== loopEnd;
  });

  const outerRowMin = Math.min(...outer.map((p) => p.row));
  const outerRowMax = Math.max(...outer.map((p) => p.row));
  const outerColMin = Math.min(...outer.map((p) => p.col));
  const outerColMax = Math.max(...outer.map((p) => p.col));

  const innerRowMin = Math.min(...innerBand.map((p) => p.row));
  const innerRowMax = Math.max(...innerBand.map((p) => p.row));
  const innerColMin = Math.min(...innerBand.map((p) => p.col));
  const innerColMax = Math.max(...innerBand.map((p) => p.col));

  return {
    center: {
      rowStart: innerRowMin + 1,
      rowEnd: innerRowMax,
      colStart: innerColMin + 1,
      colEnd: innerColMax + 1,
    },
    trackOuter: {
      rowStart: outerRowMin,
      rowEnd: outerRowMax + 1,
      colStart: outerColMin,
      colEnd: outerColMax + 1,
    },
    trackInner: {
      rowStart: innerRowMin,
      rowEnd: innerRowMax + 1,
      colStart: innerColMin,
      colEnd: innerColMax + 1,
    },
    outerBounds: { rowMin: outerRowMin, rowMax: outerRowMax, colMin: outerColMin, colMax: outerColMax },
    innerBounds: { rowMin: innerRowMin, rowMax: innerRowMax, colMin: innerColMin, colMax: innerColMax },
  };
}

const BOARD_POSITIONS = applyBoardInset(
  buildBoardPositions(BOARD.length, BOARD_LOGIC_GRID.cols, BOARD_LOGIC_GRID.rows, OUTER_LOOP_END),
  OUTER_LOOP_END,
  BOARD_INSET,
  BOARD_LOGIC_GRID,
  BOARD_GRID,
);

const BOARD_UI = computeBoardUi(BOARD_POSITIONS, OUTER_LOOP_END);

const NEWS_CARDS = [
  { text: 'Crise économique ! Perdez 2 000 000 €', effect: { type: 'pay_bank', amount: 2000000 } },
  { text: 'Subvention gouvernementale : +3 000 000 €', effect: { type: 'receive_bank', amount: 3000000 } },
  { text: 'Hausse du pétrole : recevez 1 500 000 € si vous possédez du Pétrole', effect: { type: 'receive_if_resource', resource: 'petrole', amount: 1500000 } },
  { text: 'Grève des transporteurs : payez 1 000 000 € à la banque', effect: { type: 'pay_bank', amount: 1000000 } },
  { text: 'Boom touristique : +2 000 000 € si vous possédez du Tourisme', effect: { type: 'receive_if_resource', resource: 'tourisme', amount: 2000000 } },
  { text: 'Découverte minière : recevez 2 500 000 €', effect: { type: 'receive_bank', amount: 2500000 } },
  { text: 'Taxe carbone : payez 1 500 000 € si vous possédez du Charbon', effect: { type: 'pay_if_resource', resource: 'charbon', amount: 1500000 } },
  { text: 'Prime agricole : +1 000 000 € si vous possédez Blé ou Maïs', effect: { type: 'receive_if_any', resources: ['ble', 'mais'], amount: 1000000 } },
  { text: 'Chaos boursier : tous perdent 500 000 €', effect: { type: 'all_pay_bank', amount: 500000 } },
  { text: 'Loterie : recevez 4 000 000 € !', effect: { type: 'receive_bank', amount: 4000000 } },
  { text: 'Embargo : payez 2 000 000 € si vous possédez du Gaz', effect: { type: 'pay_if_resource', resource: 'gaz', amount: 2000000 } },
  { text: 'Innovation solaire : +1 500 000 € si vous possédez Solaire ou Éolien', effect: { type: 'receive_if_any', resources: ['solaire', 'eolien'], amount: 1500000 } },
  { text: 'Inondations : perdez 1 000 000 €', effect: { type: 'pay_bank', amount: 1000000 } },
  { text: 'Prix Nobel économique : recevez 3 500 000 €', effect: { type: 'receive_bank', amount: 3500000 } },
];

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

module.exports = {
  BOARD,
  BOARD_POSITIONS,
  BOARD_GRID,
  BOARD_LOGIC_GRID,
  BOARD_INSET,
  BOARD_UI,
  LOOP_START,
  LOOP_END,
  LOOP_SIZE,
  OUTER_LOOP_END,
  INNER_LOOP_START,
  NEWS_CARDS,
  PLAYER_COLORS,
  ZONE_COLORS,
  COUNTRY_ZONE,
  zoneForSpace,
  buildBoardPositions,
  buildOuterPositions,
  buildInnerPositions,
  traceOuterPerimeter,
  traceInnerPerimeter,
  applyBoardInset,
  computeBoardUi,
};

};

/* ── src/data/shop.js ─────────────────────────────── */
__modules["shop"] = function (module, exports, require) {
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

};

/* ── src/game/bot.js ─────────────────────────────── */
__modules["bot"] = function (module, exports, require) {
// IA simple pour les bots (jeu solo / remplissage de partie).
// Une seule "étape" est jouée par appel, pour pouvoir animer les tours côté client.

const BOT_NAMES = [
  'Bot Marco', 'Bot Vasco', 'Bot Magellan', 'Bot Cook', 'Bot Drake',
  'Bot Colomb', 'Bot Cartier', 'Bot Livingstone', 'Bot Amundsen', 'Bot Zheng',
];

function randomBotName(used = []) {
  const free = BOT_NAMES.filter((n) => !used.includes(n));
  const pool = free.length ? free : BOT_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

const BOT_PAWNS = ['robot', 'ufo', 'dragon', 'crown', 'rocket', 'ship', 'castle', 'fox', 'tiger'];
function randomBotPawn() {
  return BOT_PAWNS[Math.floor(Math.random() * BOT_PAWNS.length)];
}

// Choisit les titres à acheter : priorise les richesses déjà détenues, garde une réserve de cash.
function chooseTitlesToBuy(game, player, action) {
  const reserve = 4000000; // garde un coussin de sécurité
  const budget = Math.max(0, player.money - reserve);
  const owned = new Set(player.titles.map((t) => t.resourceId));

  const sorted = [...action.available].sort((a, b) => {
    const ao = owned.has(a.resourceId) ? 0 : 1;
    const bo = owned.has(b.resourceId) ? 0 : 1;
    if (ao !== bo) return ao - bo; // d'abord les richesses déjà possédées
    return b.percent - a.percent; // puis le plus gros pourcentage
  });

  const chosen = [];
  let spent = 0;
  for (const t of sorted) {
    if (chosen.length >= (action.maxTitles || 6)) break;
    if (spent + t.price <= budget) {
      chosen.push(t.id);
      spent += t.price;
    }
  }
  return chosen;
}

// Joue une étape pour le joueur courant s'il est un bot. Retourne true si une action a eu lieu.
function playBotStep(game) {
  if (!game || game.winner) return false;
  const player = game.getCurrentPlayer();
  if (!player || !player.isBot || player.bankrupt) return false;

  // Phase de lancer
  if (game.phase === 'rolling' && !game.pendingAction && !game.auction) {
    game.rollDice();
    return true;
  }

  const a = game.pendingAction;
  if (a && a.playerId === player.id) {
    if (a.type === 'royalty_due') {
      const res = game.payLandRoyalties(player.id);
      if (res.error) game.handleBankruptcy(player);
      return true;
    }
    if (a.type === 'buy_titles') {
      const ids = chooseTitlesToBuy(game, player, a);
      const res = game.buyTitles(player.id, ids);
      if (res.error) game.buyTitles(player.id, []);
      return true;
    }
    if (a.type === 'joker_buy') {
      // Achète un joker si confortable
      if (player.money > 12000000 && Math.random() > 0.4) game.buyJoker(player.id);
      else game.skipJoker(player.id);
      return true;
    }
    if (a.type === 'joker_choice') {
      game.useJokerSkip(player.id);
      return true;
    }
  }

  // Fin de tour
  if ((game.phase === 'end_turn' || game.phase === 'action') && !game.pendingAction && !game.auction) {
    game.endTurn();
    return true;
  }

  return false;
}

// Pendant une enchère, les bots non-vendeurs peuvent enchérir une fois.
function botAuctionBids(game) {
  if (!game.auction) return false;
  let acted = false;
  for (const p of game.getActivePlayers()) {
    if (p.isBot && p.id !== game.auction.sellerId) {
      const bid = game.auction.currentBid + 100000;
      // Enchérit si le lot reste bon marché et qu'il a de la marge
      if (p.money > bid + 6000000 && Math.random() > 0.55) {
        const r = game.placeBid(p.id, bid);
        if (r.success) acted = true;
      }
    }
  }
  return acted;
}

module.exports = { playBotStep, botAuctionBids, randomBotName, randomBotPawn };

};

/* ── src/game/GameEngine.js ─────────────────────────────── */
__modules["GameEngine"] = function (module, exports, require) {
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { RESOURCES, CONTINENTS, STARTING_MONEY, getRoyaltyAmount, hasResourceMonopoly, buildDeck } = require('../data/resources');
const { BOARD, BOARD_POSITIONS, BOARD_GRID, BOARD_UI, LOOP_END, LOOP_SIZE, OUTER_LOOP_END, INNER_LOOP_START, NEWS_CARDS, PLAYER_COLORS } = require('../data/board');
const { getDice } = require('../data/shop');

class GameEngine {
  constructor(roomId, playerDefs) {
    this.roomId = roomId;
    this.board = BOARD.filter((s) => s.type !== 'resource');
    this.deck = buildDeck();
    this.newsDeck = [...NEWS_CARDS].sort(() => Math.random() - 0.5);
    this.log = [];
    this.phase = 'rolling';
    this.pendingAction = null;
    this.auction = null;
    this.winner = null;
    this.diceResult = null;
    this.diceRollId = 0;
    this.newsRevealCounter = 0;
    this.lastNewsReveal = null;

    // Rétrocompatibilité : accepte un tableau de noms ou d'objets {name, pawn}
    const defs = playerDefs.map((d) => (typeof d === 'string' ? { name: d } : d));
    const count = defs.length;
    const startingMoney = STARTING_MONEY[count] || 33000000;

    this.players = defs.map((def, i) => {
      const diceId = def.equippedDice || 'classic_dice';
      const diceStyle = getDice(diceId).style;
      return {
      id: uuidv4(),
      name: def.name,
      pawn: def.pawn || 'classic',
      equippedDice: diceId,
      diceStyle,
      honorTitle: def.honorTitle || '',
      isBot: !!def.isBot,
      team: null,
      color: PLAYER_COLORS[i],
      money: startingMoney,
      position: 0,
      titles: [],
      joker: false,
      laps: 0,
      bankrupt: false,
      skipNextTurn: false,
      socketId: null,
    };
    });

    this.pendingAlliance = null;
    this.pendingTrade = null;
    this.currentPlayerIndex = 0;
    this.addLog(`Partie lancée avec ${count} joueurs. Capital de départ : ${this.formatMoney(startingMoney)}`);
  }

  formatMoney(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} k€`;
    return `${amount} €`;
  }

  /**
   * Restaure l'état d'une partie depuis un export client (💾) : argent,
   * positions, titres, tours. Le siège i du salon reprend le siège i de la
   * sauvegarde. Les actions transitoires (enchère, achat en cours, dés) ne
   * sont pas restaurées : la partie reprend proprement au début du tour.
   */
  restoreFromSnapshot(snap) {
    (snap.players || []).forEach((sp, i) => {
      const p = this.players[i];
      if (!p) return;
      p.money = Number(sp.money) || 0;
      p.position = Number(sp.position) || 0;
      p.laps = Number(sp.laps) || 0;
      p.joker = !!sp.joker;
      p.bankrupt = !!sp.bankrupt;
      p.team = sp.team || null;
      p.titles = [];
      (sp.titles || []).forEach((st) => {
        const title = this.getTitleById(st.id);
        if (title && !title.ownerId) {
          title.ownerId = p.id;
          p.titles.push(title);
        }
      });
    });
    const idx = Number(snap.currentPlayerIndex);
    this.currentPlayerIndex = Number.isInteger(idx) && idx >= 0 && idx < this.players.length ? idx : 0;
    let guard = this.players.length;
    while (this.players[this.currentPlayerIndex]?.bankrupt && guard-- > 0) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    this.phase = 'rolling';
    this.pendingAction = null;
    this.auction = null;
    this.diceResult = null;
    this.addLog('💾 Partie restaurée depuis une sauvegarde.');
  }

  addLog(message) {
    this.log.unshift({ time: Date.now(), message });
    if (this.log.length > 50) this.log.pop();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  getTitleById(titleId) {
    for (const countryTitles of Object.values(this.deck)) {
      const found = countryTitles.find((t) => t.id === titleId);
      if (found) return found;
    }
    return null;
  }

  getAvailableTitles(countryId) {
    const titles = this.deck[countryId] || [];
    return titles.filter((t) => !t.ownerId);
  }

  getPlayerResourcePercent(playerId, resourceId) {
    return this.players
      .find((p) => p.id === playerId)
      ?.titles.filter((t) => t.resourceId === resourceId)
      .reduce((sum, t) => sum + t.percent, 0) || 0;
  }

  getResourceOwners(resourceId) {
    const owners = {};
    for (const player of this.players) {
      if (player.bankrupt) continue;
      const percent = player.titles
        .filter((t) => t.resourceId === resourceId)
        .reduce((sum, t) => sum + t.percent, 0);
      if (percent >= 30) {
        owners[player.id] = { player, percent, royalty: getRoyaltyAmount(resourceId, percent) };
      }
    }
    return owners;
  }

  playerOwnsResource(playerId, resourceId) {
    return this.getPlayerResourcePercent(playerId, resourceId) > 0;
  }

  // Boucle 1→N : après la dernière case on retombe sur l'Allemagne (jamais sur Départ)
  advancePosition(currentPos, steps) {
    let lapsAdded = 0;
    let pos = currentPos === 0 ? steps : currentPos + steps;
    while (pos > LOOP_END) {
      lapsAdded++;
      pos -= LOOP_SIZE;
    }
    return { position: pos, lapsAdded };
  }

  rollDice() {
    if (this.phase !== 'rolling' || this.winner) return { error: 'Action non autorisée' };

    const player = this.getCurrentPlayer();
    if (player.bankrupt) return { error: 'Joueur en faillite' };

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    this.diceRollId += 1;
    this.diceResult = { d1, d2, total, isDouble: d1 === d2, rollId: this.diceRollId };

    this.addLog(`${player.name} lance ${d1} + ${d2} = ${total}${d1 === d2 ? ' (double !)' : ''}`);

    if (d1 === d2) {
      const penalty = d1 * 1000000;
      player.money -= penalty;
      this.addLog(`${player.name} paie ${this.formatMoney(penalty)} à la banque (double ${d1})`);
      if (player.money < 0) this.handleBankruptcy(player);
    }

    if (!player.bankrupt) {
      const { position, lapsAdded } = this.advancePosition(player.position, total);
      player.position = position;
      if (lapsAdded > 0) {
        player.laps += lapsAdded;
        this.addLog(`${player.name} effectue un tour du monde !`);
      }
      this.resolveLanding(player);
    }

    if (this.phase !== 'game_over' && this.phase !== 'auction') {
      this.phase = this.pendingAction ? 'action' : 'end_turn';
    }
    return { success: true, dice: this.diceResult };
  }

  resolveLanding(player) {
    const space = this.board[player.position];
    if (space.type === 'start') return;
    this.addLog(`${player.name} arrive sur : ${space.label}`);

    switch (space.type) {
      case 'start':
        break;
      case 'country': {
        const landContext = {
          buyType: 'country',
          countryIds: [space.countryId],
          linkedResource: space.resource,
        };
        this.handleLandingRoyaltiesThenBuy(player, space.resource, landContext);
        break;
      }
      case 'continental': {
        if (this.canContinentalBuy(player)) {
          const countries = space.countries || CONTINENTS[space.continent] || [];
          const landContext = {
            buyType: 'continental',
            countryIds: countries,
            linkedResource: space.resource,
          };
          this.handleLandingRoyaltiesThenBuy(player, space.resource, landContext);
        } else {
          this.addLog(`${player.name} ne possède aucune richesse — achat continental impossible`);
          if (space.resource) {
            const payResult = this.tryPayRoyalties(player, space.resource);
            if (!payResult.paid) {
              this.setupRoyaltyDue(player, space.resource, payResult.due, null);
            }
          }
        }
        break;
      }
      case 'world':
        if (player.laps >= 1) {
          if (this.hasAnyResource(player)) {
            this.setupBuyAction(player, Object.keys(this.deck), null, 6, 'world');
          } else {
            this.addLog(`${player.name} ne possède aucune richesse — choix mondial impossible`);
          }
        } else {
          this.addLog('Choix mondial disponible après un tour du monde');
        }
        break;
      case 'auction':
        if (player.laps >= 1 && this.getActivePlayers().length > 2) {
          if (player.joker) {
            this.pendingAction = {
              type: 'joker_choice',
              playerId: player.id,
              canUseJoker: true,
            };
          } else {
            this.startAuction(player, Math.floor(Math.random() * 3) + 1);
          }
        } else {
          this.addLog('Case repos (enchères indisponibles)');
        }
        break;
      case 'news':
        this.drawNews(player);
        break;
      case 'bonus':
        if (this.diceResult) {
          const bonus = 500000 * this.diceResult.total;
          player.money += bonus;
          this.addLog(`${player.name} reçoit ${this.formatMoney(bonus)} de la banque`);
          if (space.resource) {
            const payResult = this.tryPayRoyalties(player, space.resource);
            if (!payResult.paid) {
              this.setupRoyaltyDue(player, space.resource, payResult.due, null);
            }
          }
        }
        break;
      case 'customs':
        player.skipNextTurn = true;
        this.addLog(`${player.name} est bloqué en douane — passe le prochain tour`);
        break;
      case 'joker':
        this.pendingAction = {
          type: 'joker_buy',
          playerId: player.id,
          price: 3000000,
        };
        break;
    }

  }

  hasAnyResource(player) {
    return player.titles.length > 0;
  }

  canContinentalBuy(player) {
    return player.titles.length > 0;
  }

  setupBuyAction(player, countryIds, linkedResource, maxTitles = 6, buyType = 'country') {
    const available = [];
    for (const cid of countryIds) {
      const titles = this.getAvailableTitles(cid);
      available.push(...titles);
    }

    let filtered = available;
    if (buyType === 'continental' || buyType === 'world') {
      const ownedResources = new Set(player.titles.map((t) => t.resourceId));
      filtered = available.filter((t) => ownedResources.has(t.resourceId));
    }
    // Case pays (Lansay) : tous les titres du sabot fichier du pays, sans filtre par ressource.
    // Royalties : ressource indiquée sur la case (linkedResource), gérées à l'atterrissage.
    if (linkedResource && buyType !== 'country') {
      filtered = filtered.filter((t) => t.resourceId === linkedResource);
    }

    if (filtered.length === 0) {
      this.addLog(`Aucun titre disponible pour ${player.name}`);
      return false;
    }

    this.pendingAction = {
      type: 'buy_titles',
      playerId: player.id,
      buyType,
      countryIds,
      maxTitles,
      linkedResource,
      royaltiesPaid: true,
      available: filtered.map((t) => ({
        id: t.id,
        resourceId: t.resourceId,
        resourceName: t.resourceName,
        country: t.country,
        percent: t.percent,
        price: t.price,
      })),
    };
    return true;
  }

  boardSpaceWithHints(space) {
    if (space.type === 'country' && space.countryId) {
      const titleHints = (this.deck[space.countryId] || [])
        .filter((t) => !t.ownerId)
        .map((t) => ({
          percent: t.percent,
          resourceId: t.resourceId,
          resourceName: t.resourceName,
        }));
      return { ...space, titleHints };
    }
    return space;
  }

  areAllied(playerA, playerB) {
    if (!playerA || !playerB) return false;
    return playerA.team !== null && playerA.team === playerB.team;
  }

  calcRoyaltyDue(player, resourceId) {
    const owners = this.getResourceOwners(resourceId);
    const list = [];
    let total = 0;

    for (const [ownerId, data] of Object.entries(owners)) {
      if (ownerId === player.id) continue;
      if (this.areAllied(player, data.player)) {
        this.addLog(`${player.name} ne paie pas ${data.player.name} (alliés)`);
        continue;
      }
      total += data.royalty;
      list.push({
        ownerId,
        ownerName: data.player.name,
        percent: data.percent,
        royalty: data.royalty,
      });
    }

    return { total, owners: list };
  }

  tryPayRoyalties(player, resourceId) {
    const due = this.calcRoyaltyDue(player, resourceId);
    const resourceName = RESOURCES[resourceId]?.name || resourceId;

    if (due.total === 0) {
      if (due.owners.length === 0) {
        this.addLog(`Aucun propriétaire avec 30%+ de ${resourceName}`);
      }
      return { paid: true, amount: 0, due };
    }

    if (player.money < due.total) {
      this.addLog(
        `${player.name} ne peut pas payer les royalties (${this.formatMoney(player.money)} / ${this.formatMoney(due.total)}) — ${resourceName}`
      );
      return { paid: false, amount: 0, due };
    }

    for (const o of due.owners) {
      const owner = this.players.find((p) => p.id === o.ownerId);
      if (!owner) continue;
      player.money -= o.royalty;
      owner.money += o.royalty;
      this.addLog(
        `${player.name} paie ${this.formatMoney(o.royalty)} de royalties à ${o.ownerName} (${resourceName}, ${o.percent}%)`
      );
    }

    return { paid: true, amount: due.total, due };
  }

  payRoyalties(player, resourceId) {
    const result = this.tryPayRoyalties(player, resourceId);
    if (!result.paid && result.due.total > 0) {
      this.handleBankruptcy(player);
    }
  }

  setupRoyaltyDue(player, resourceId, due, landContext) {
    const resourceName = RESOURCES[resourceId]?.name || resourceId;
    this.pendingAction = {
      type: 'royalty_due',
      playerId: player.id,
      resourceId,
      resourceName,
      totalDue: due.total,
      owners: due.owners,
      landContext: landContext || null,
    };
    this.phase = 'action';
  }

  resumeBuyAfterRoyalties(player, landContext) {
    if (!landContext) {
      this.phase = 'end_turn';
      return;
    }

    let ok = false;
    if (landContext.buyType === 'country') {
      ok = this.setupBuyAction(player, landContext.countryIds, landContext.linkedResource, 6, 'country');
    } else if (landContext.buyType === 'continental') {
      ok = this.setupBuyAction(
        player,
        landContext.countryIds,
        landContext.linkedResource,
        6,
        'continental',
      );
    } else if (landContext.buyType === 'world') {
      ok = this.setupBuyAction(player, landContext.countryIds, landContext.linkedResource, 6, 'world');
    }
    if (!ok) this.phase = 'end_turn';
  }

  handleLandingRoyaltiesThenBuy(player, resourceId, landContext) {
    if (!resourceId) {
      this.resumeBuyAfterRoyalties(player, landContext);
      return true;
    }

    const payResult = this.tryPayRoyalties(player, resourceId);
    if (!payResult.paid) {
      this.setupRoyaltyDue(player, resourceId, payResult.due, landContext);
      return false;
    }

    this.resumeBuyAfterRoyalties(player, landContext);
    return true;
  }

  payLandRoyalties(playerId) {
    const action = this.pendingAction;
    if (!action || action.type !== 'royalty_due') {
      return { error: 'Aucune royalty en attente' };
    }
    if (action.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Joueur invalide' };

    const payResult = this.tryPayRoyalties(player, action.resourceId);
    if (!payResult.paid) {
      return {
        error: `Fonds insuffisants (${this.formatMoney(player.money)} / ${this.formatMoney(action.totalDue)})`,
      };
    }

    const landContext = action.landContext;
    this.pendingAction = null;
    this.resumeBuyAfterRoyalties(player, landContext);
    this.phase = this.pendingAction ? 'action' : 'end_turn';
    return { success: true, amount: payResult.amount };
  }

  drawNews(player) {
    if (this.newsDeck.length === 0) {
      this.newsDeck = [...NEWS_CARDS].sort(() => Math.random() - 0.5);
    }
    const card = this.newsDeck.shift();
    this.newsDeck.push(card);
    this.lastNewsReveal = {
      id: ++this.newsRevealCounter,
      playerId: player.id,
      playerName: player.name,
      text: card.text,
    };
    this.addLog(`📰 ${player.name} : ${card.text}`);

    const effect = card.effect;
    switch (effect.type) {
      case 'pay_bank':
        player.money -= effect.amount;
        break;
      case 'receive_bank':
        player.money += effect.amount;
        break;
      case 'receive_if_resource':
        if (this.playerOwnsResource(player.id, effect.resource)) player.money += effect.amount;
        break;
      case 'pay_if_resource':
        if (this.playerOwnsResource(player.id, effect.resource)) player.money -= effect.amount;
        break;
      case 'receive_if_any':
        if (effect.resources.some((r) => this.playerOwnsResource(player.id, r))) {
          player.money += effect.amount;
        }
        break;
      case 'all_pay_bank':
        for (const p of this.players) {
          if (!p.bankrupt) p.money -= effect.amount;
        }
        break;
    }

    if (player.money < 0) this.handleBankruptcy(player);

    // Une carte affectant tous les joueurs peut en ruiner d'autres
    if (effect.type === 'all_pay_bank') {
      for (const p of this.players) {
        if (!p.bankrupt && p.money < 0) this.handleBankruptcy(p);
      }
    }
  }

  buyTitles(playerId, titleIds) {
    if (!this.pendingAction || this.pendingAction.type !== 'buy_titles') {
      return { error: 'Aucun achat en cours' };
    }
    if (this.pendingAction.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Joueur invalide' };

    if (titleIds.length > this.pendingAction.maxTitles) {
      return { error: `Maximum ${this.pendingAction.maxTitles} titres` };
    }

    let totalCost = 0;
    const toBuy = [];

    for (const id of titleIds) {
      const available = this.pendingAction.available.find((t) => t.id === id);
      if (!available) return { error: `Titre ${id} non disponible` };
      const title = this.getTitleById(id);
      if (!title || title.ownerId) return { error: 'Titre déjà vendu' };
      totalCost += title.price;
      toBuy.push(title);
    }

    if (player.money < totalCost) {
      return { error: `Fonds insuffisants (${this.formatMoney(player.money)} / ${this.formatMoney(totalCost)})` };
    }

    player.money -= totalCost;
    for (const title of toBuy) {
      title.ownerId = playerId;
      player.titles.push({ ...title });
      this.addLog(
        `${player.name} achète ${title.resourceName} (${title.country}, ${title.percent}%) pour ${this.formatMoney(title.price)}`
      );
    }

    if (titleIds.length === 0) {
      this.addLog(`${player.name} n'achète aucun titre`);
    }

    this.pendingAction = null;
    this.phase = 'end_turn';
    return { success: true };
  }

  buyJoker(playerId) {
    if (!this.pendingAction || this.pendingAction.type !== 'joker_buy') {
      return { error: 'Action joker non disponible' };
    }
    if (this.pendingAction.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }
    const player = this.players.find((p) => p.id === playerId);
    if (player.money < 3000000) return { error: 'Fonds insuffisants' };
    player.money -= 3000000;
    player.joker = true;
    this.addLog(`${player.name} achète une carte Joker !`);
    this.pendingAction = null;
    this.phase = 'end_turn';
    return { success: true };
  }

  skipJoker(playerId) {
    if (this.pendingAction?.type === 'joker_buy' && this.pendingAction.playerId === playerId) {
      this.pendingAction = null;
      this.phase = 'end_turn';
      return { success: true };
    }
    return { error: 'Action invalide' };
  }

  useJokerSkip(playerId) {
    if (this.pendingAction?.type === 'joker_choice' && this.pendingAction.playerId === playerId) {
      const player = this.players.find((p) => p.id === playerId);
      player.joker = false;
      this.addLog(`${player.name} utilise son Joker pour éviter les enchères !`);
      this.pendingAction = null;
      this.phase = 'end_turn';
      return { success: true };
    }
    return { error: 'Action invalide' };
  }

  declineJokerUse(playerId) {
    if (this.pendingAction?.type !== 'joker_choice' || this.pendingAction.playerId !== playerId) {
      return { error: 'Action invalide' };
    }
    const player = this.players.find((p) => p.id === playerId);
    this.pendingAction = null;
    this.startAuction(player, Math.floor(Math.random() * 3) + 1);
    return { success: true };
  }

  startAuction(seller, count) {
    const sellable = this.getSellableGroups(seller);
    if (sellable.length === 0) {
      this.addLog(`${seller.name} n'a rien à vendre aux enchères`);
      this.phase = 'end_turn';
      return;
    }

    const toSell = sellable.slice(0, count);
    const titles = toSell.flatMap((g) => g.titles);
    const totalPrice = titles.reduce((s, t) => s + t.price, 0);
    const startBid = Math.floor(totalPrice / 2);

    this.auction = {
      sellerId: seller.id,
      titles: titles.map((t) => t.id),
      currentBid: startBid,
      highBidderId: null,
      endTime: Date.now() + 15000,
    };

    this.pendingAction = { type: 'auction', auction: this.auction };
    this.phase = 'auction';
    this.addLog(
      `Enchères ! ${titles.length} titre(s) à partir de ${this.formatMoney(startBid)}`
    );
  }

  getSellableGroups(player) {
    const byResource = {};
    for (const title of player.titles) {
      if (!byResource[title.resourceId]) byResource[title.resourceId] = [];
      byResource[title.resourceId].push(title);
    }
    return Object.values(byResource).map((titles) => {
      const percent = titles.reduce((s, t) => s + t.percent, 0);
      return {
        resourceId: titles[0].resourceId,
        titles,
        percent,
        isMonopoly: hasResourceMonopoly(percent),
        totalPrice: titles.reduce((s, t) => s + t.price, 0),
      };
    });
  }

  placeBid(playerId, amount) {
    if (!this.auction || this.phase !== 'auction') return { error: 'Pas d\'enchère en cours' };
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt || playerId === this.auction.sellerId) {
      return { error: 'Enchère non autorisée' };
    }
    if (amount < this.auction.currentBid + 100000) {
      return { error: 'Enchère minimum +100 000 €' };
    }
    if (player.money < amount) return { error: 'Fonds insuffisants' };

    this.auction.currentBid = amount;
    this.auction.highBidderId = playerId;
    this.auction.endTime = Date.now() + 10000;
    this.addLog(`${player.name} enchérit ${this.formatMoney(amount)}`);
    return { success: true };
  }

  resolveAuction() {
    if (!this.auction) return;

    const seller = this.players.find((p) => p.id === this.auction.sellerId);
    const bidder = this.players.find((p) => p.id === this.auction.highBidderId);

    if (bidder) {
      bidder.money -= this.auction.currentBid;
      seller.money += this.auction.currentBid;

      for (const titleId of this.auction.titles) {
        const title = this.getTitleById(titleId);
        if (title) {
          seller.titles = seller.titles.filter((t) => t.id !== titleId);
          title.ownerId = bidder.id;
          bidder.titles.push({ ...title });
        }
      }
      this.addLog(
        `${bidder.name} remporte l'enchère pour ${this.formatMoney(this.auction.currentBid)}`
      );
    } else {
      const halfPrice = Math.floor(
        this.auction.titles.reduce((s, id) => s + (this.getTitleById(id)?.price || 0), 0) / 2
      );
      seller.money += halfPrice;
      for (const titleId of this.auction.titles) {
        const title = this.getTitleById(titleId);
        if (title) {
          seller.titles = seller.titles.filter((t) => t.id !== titleId);
          title.ownerId = null;
          const countryDeck = this.deck[title.countryId];
          if (countryDeck) {
            const idx = countryDeck.findIndex((t) => t.id === titleId);
            if (idx >= 0) countryDeck[idx].ownerId = null;
          }
        }
      }
      this.addLog(`Banque rachète les titres pour ${this.formatMoney(halfPrice)}`);
    }

    this.auction = null;
    this.pendingAction = null;
    this.phase = 'end_turn';
  }

  returnTitlesToBank(player) {
    for (const title of player.titles) {
      const deckTitle = this.getTitleById(title.id);
      if (deckTitle) deckTitle.ownerId = null;
    }
    player.titles = [];
  }

  clearPlayerPending(playerId) {
    if (this.pendingAction?.playerId === playerId) this.pendingAction = null;
    if (this.auction && (this.auction.sellerId === playerId || this.auction.highBidderId === playerId)) {
      this.auction = null;
      if (this.pendingAction?.type === 'auction') this.pendingAction = null;
    }
    if (this.pendingAlliance && (this.pendingAlliance.fromId === playerId || this.pendingAlliance.toId === playerId)) {
      this.pendingAlliance = null;
    }
    if (this.pendingTrade && (this.pendingTrade.fromId === playerId || this.pendingTrade.toId === playerId)) {
      this.pendingTrade = null;
    }
  }

  handleBankruptcy(player) {
    if (player.bankrupt) return;
    player.bankrupt = true;
    player.money = 0;

    this.returnTitlesToBank(player);
    player.joker = false;

    this.addLog(`💀 ${player.name} est en FAILLITE !`);
    this.clearPlayerPending(player.id);
    this.checkVictory();
    if (!this.winner && !this.pendingAction && !this.auction && this.phase !== 'rolling') {
      this.phase = 'end_turn';
    }
  }

  surrender(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Action impossible' };
    if (this.winner) return { error: 'Partie terminée' };

    const halfPrice = Math.floor(player.titles.reduce((s, t) => s + (t.price || 0), 0) / 2);
    if (halfPrice > 0) {
      player.money += halfPrice;
      this.addLog(`🏳️ ${player.name} abandonne — banque rachète les titres pour ${this.formatMoney(halfPrice)}`);
    } else {
      this.addLog(`🏳️ ${player.name} abandonne la partie`);
    }

    this.returnTitlesToBank(player);
    player.joker = false;
    if (player.team !== null) {
      const oldTeam = player.team;
      for (const p of this.players) {
        if (p.team === oldTeam) p.team = null;
      }
    }

    this.clearPlayerPending(player.id);
    player.bankrupt = true;

    const wasCurrent = this.getCurrentPlayer().id === player.id;
    this.checkVictory();

    if (!this.winner && wasCurrent) {
      this.pendingAction = null;
      this.auction = null;
      this.phase = 'end_turn';
      this.endTurn();
    } else if (!this.winner && !this.pendingAction && !this.auction) {
      this.phase = this.phase === 'game_over' ? 'game_over' : this.phase;
    }

    return { success: true };
  }

  // Renvoie le nombre de "camps" encore en jeu (un solo = un camp, une alliance = un camp)
  getSides() {
    const active = this.getActivePlayers();
    const sides = new Map();
    for (const p of active) {
      const key = p.team !== null ? `team:${p.team}` : `solo:${p.id}`;
      if (!sides.has(key)) sides.set(key, []);
      sides.get(key).push(p);
    }
    return sides;
  }

  checkVictory() {
    const active = this.getActivePlayers();
    if (active.length === 0) {
      this.phase = 'game_over';
      return;
    }
    const sides = this.getSides();
    if (sides.size === 1) {
      const members = [...sides.values()][0];
      this.winner = members[0];
      this.winningTeam = members.map((m) => m.id);
      if (members.length > 1) {
        this.addLog(`🏆 Alliance victorieuse : ${members.map((m) => m.name).join(' & ')} !`);
      } else {
        this.addLog(`🏆 ${this.winner.name} remporte la partie !`);
      }
      this.phase = 'game_over';
    }
  }

  endTurn() {
    if (this.auction && Date.now() >= this.auction.endTime) {
      this.resolveAuction();
    }

    if (this.pendingTrade) return { error: 'Résolvez l\'échange en cours' };
    if (this.pendingAlliance) return { error: 'Résolvez la proposition d\'alliance' };

    if (this.phase !== 'end_turn' && this.phase !== 'game_over') {
      if (this.pendingAction) return { error: 'Action en attente' };
      return { error: 'Tour non terminé' };
    }

    if (this.winner) return { success: true, gameOver: true };

    let guard = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      while (this.getCurrentPlayer().bankrupt && this.getActivePlayers().length > 1) {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      }
      const next = this.getCurrentPlayer();
      if (!next.skipNextTurn || guard++ >= this.players.length) break;
      next.skipNextTurn = false;
      this.addLog(`${next.name} passe un tour (douane)`);
    } while (guard < this.players.length);

    this.phase = 'rolling';
    this.diceResult = null;
    this.pendingAction = null;
    this.addLog(`Tour de ${this.getCurrentPlayer().name}`);
    return { success: true };
  }

  sellTitles(playerId, titleIds, buyerId, price) {
    const seller = this.players.find((p) => p.id === playerId);
    const buyer = this.players.find((p) => p.id === buyerId);
    if (!seller || !buyer || seller.bankrupt || buyer.bankrupt) {
      return { error: 'Joueurs invalides' };
    }
    if (buyer.money < price) return { error: 'Acheteur sans fonds' };

    for (const id of titleIds) {
      const title = seller.titles.find((t) => t.id === id);
      if (!title) return { error: 'Titre non possédé' };
    }

    buyer.money -= price;
    seller.money += price;

    for (const id of titleIds) {
      const deckTitle = this.getTitleById(id);
      seller.titles = seller.titles.filter((t) => t.id !== id);
      if (deckTitle) deckTitle.ownerId = buyerId;
      const t = deckTitle || seller.titles.find((x) => x.id === id);
      if (t) buyer.titles.push({ ...t, ownerId: buyerId });
    }

    this.addLog(`${seller.name} vend ${titleIds.length} titre(s) à ${buyer.name} pour ${this.formatMoney(price)}`);
    return { success: true };
  }

  // ---------------- Alliances ----------------
  canManageTurnAction(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return false;
    if (this.auction) return false;
    if (this.pendingTrade || this.pendingAlliance) return false;
    if (this.winner) return false;
    if (this.pendingAction?.type === 'royalty_due' && this.pendingAction.playerId === playerId) {
      return true;
    }
    if (this.pendingAction) return false;
    return this.phase === 'rolling' || this.phase === 'end_turn' || this.phase === 'action';
  }

  allianceTax(player) {
    const total = player.titles.reduce((s, t) => s + t.price, 0);
    return Math.floor(total / 2);
  }

  proposeAlliance(fromId, toId) {
    if (!this.canManageTurnAction(fromId)) return { error: 'Action impossible pour le moment' };
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    if (!to || to.bankrupt || from.bankrupt) return { error: 'Joueur invalide' };
    if (from.id === to.id) return { error: 'Cible invalide' };
    if (from.team !== null && from.team === to.team) return { error: 'Déjà alliés' };
    if (from.team !== null) return { error: 'Déjà en alliance — rompez-la d\'abord' };
    if (this.getActivePlayers().length <= 2) return { error: 'Alliance impossible à 2 joueurs' };

    this.pendingAlliance = {
      fromId,
      toId,
      taxFrom: this.allianceTax(from),
      taxTo: this.allianceTax(to),
    };
    this.addLog(`${from.name} propose une alliance à ${to.name}`);
    return { success: true, autoTarget: to.isBot ? to : null };
  }

  respondAlliance(playerId, accept) {
    const prop = this.pendingAlliance;
    if (!prop || prop.toId !== playerId) return { error: 'Aucune proposition' };
    const from = this.players.find((p) => p.id === prop.fromId);
    const to = this.players.find((p) => p.id === prop.toId);
    this.pendingAlliance = null;

    if (!accept) {
      this.addLog(`${to.name} refuse l'alliance avec ${from.name}`);
      return { success: true, accepted: false };
    }
    if (from.money < prop.taxFrom || to.money < prop.taxTo) {
      this.addLog(`Alliance annulée : taxe impayable`);
      return { success: true, accepted: false };
    }

    from.money -= prop.taxFrom;
    to.money -= prop.taxTo;
    const teamId = from.team !== null ? from.team : (to.team !== null ? to.team : `T${Date.now().toString(36)}`);
    from.team = teamId;
    to.team = teamId;
    this.addLog(
      `🤝 Alliance scellée entre ${from.name} et ${to.name} (taxe ${this.formatMoney(prop.taxFrom + prop.taxTo)})`
    );
    if (from.money < 0) this.handleBankruptcy(from);
    if (to.money < 0) this.handleBankruptcy(to);
    return { success: true, accepted: true };
  }

  breakAlliance(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { error: 'Ce n\'est pas votre tour' };
    if (this.pendingTrade || this.pendingAlliance) return { error: 'Résolvez la proposition en cours' };
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.team === null) return { error: 'Vous n\'êtes pas en alliance' };

    const teamId = player.team;
    const partners = this.players.filter((p) => p.team === teamId && p.id !== playerId && !p.bankrupt);
    for (const p of this.players) {
      if (p.team === teamId) p.team = null;
    }
    const names = partners.map((p) => p.name).join(', ');
    this.addLog(
      names
        ? `💔 ${player.name} rompt l'alliance avec ${names}`
        : `💔 ${player.name} met fin à l'alliance`
    );
    return { success: true };
  }

  alliancePartnersFor(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.team === null) return [];
    return this.players
      .filter((p) => p.id !== playerId && !p.bankrupt && p.team === player.team)
      .map((p) => ({ id: p.id, name: p.name }));
  }

  canSeeAlliance(viewerId, target) {
    if (!viewerId || !target) return false;
    const viewer = this.players.find((p) => p.id === viewerId);
    if (!viewer || viewer.team === null) return false;
    return target.team === viewer.team;
  }

  // ---------------- Échange / Vente ----------------
  proposeTrade(fromId, { toId, giveTitleIds = [], receiveTitleIds = [], cash = 0 }) {
    if (!this.canManageTurnAction(fromId)) return { error: 'Échange possible uniquement à votre tour' };
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    if (!to || to.bankrupt || from.bankrupt) return { error: 'Joueur invalide' };
    if (from.id === to.id) return { error: 'Cible invalide' };

    for (const id of giveTitleIds) {
      if (!from.titles.find((t) => t.id === id)) return { error: 'Titre offert non possédé' };
    }
    for (const id of receiveTitleIds) {
      if (!to.titles.find((t) => t.id === id)) return { error: 'Titre demandé non possédé' };
    }
    cash = Math.round(Number(cash) || 0); // >0 : from paie to ; <0 : to paie from
    if (giveTitleIds.length === 0 && receiveTitleIds.length === 0 && cash === 0) {
      return { error: 'Échange vide' };
    }

    this.pendingTrade = { fromId, toId, giveTitleIds, receiveTitleIds, cash };
    this.addLog(`${from.name} propose un échange à ${to.name}`);
    return { success: true, autoTarget: to.isBot ? to : null };
  }

  respondTrade(playerId, accept) {
    const tr = this.pendingTrade;
    if (!tr || tr.toId !== playerId) return { error: 'Aucun échange en attente' };
    const from = this.players.find((p) => p.id === tr.fromId);
    const to = this.players.find((p) => p.id === tr.toId);
    this.pendingTrade = null;

    if (!accept) {
      this.addLog(`${to.name} refuse l'échange de ${from.name}`);
      return { success: true, accepted: false };
    }

    // Validations finales
    for (const id of tr.giveTitleIds) if (!from.titles.find((t) => t.id === id)) return { success: true, accepted: false };
    for (const id of tr.receiveTitleIds) if (!to.titles.find((t) => t.id === id)) return { success: true, accepted: false };

    const fromPays = tr.cash > 0 ? tr.cash : 0;
    const toPays = tr.cash < 0 ? -tr.cash : 0;
    if (from.money < fromPays || to.money < toPays) {
      this.addLog(`Échange annulé : fonds insuffisants`);
      return { success: true, accepted: false };
    }

    // Transfert d'argent
    from.money -= fromPays;
    to.money += fromPays;
    to.money -= toPays;
    from.money += toPays;

    // Transfert des titres
    const moveTitle = (id, owner, receiver) => {
      const idx = owner.titles.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const [title] = owner.titles.splice(idx, 1);
      const deckTitle = this.getTitleById(id);
      if (deckTitle) deckTitle.ownerId = receiver.id;
      receiver.titles.push({ ...title, ownerId: receiver.id });
    };
    tr.giveTitleIds.forEach((id) => moveTitle(id, from, to));
    tr.receiveTitleIds.forEach((id) => moveTitle(id, to, from));

    const cashLabel = tr.cash > 0 ? ` + ${this.formatMoney(fromPays)}` : tr.cash < 0 ? ` (reçoit ${this.formatMoney(toPays)})` : '';
    this.addLog(
      `🔁 Échange conclu : ${from.name} → ${tr.giveTitleIds.length} titre(s)${cashLabel}, ${to.name} → ${tr.receiveTitleIds.length} titre(s)`
    );
    return { success: true, accepted: true };
  }

  cancelTrade(playerId) {
    if (this.pendingTrade && this.pendingTrade.fromId === playerId) {
      this.pendingTrade = null;
      return { success: true };
    }
    if (this.pendingAlliance && this.pendingAlliance.fromId === playerId) {
      this.pendingAlliance = null;
      return { success: true };
    }
    return { error: 'Rien à annuler' };
  }

  getPublicState(forPlayerId) {
    return {
      roomId: this.roomId,
      board: this.board.map((space) => this.boardSpaceWithHints(space)),
      boardPositions: BOARD_POSITIONS,
      boardGrid: BOARD_GRID,
      boardUi: BOARD_UI,
      outerLoopEnd: OUTER_LOOP_END,
      innerLoopStart: INNER_LOOP_START,
      myAlliance: (() => {
        const partners = this.alliancePartnersFor(forPlayerId);
        return partners.length ? { partners } : null;
      })(),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        pawn: p.pawn,
        equippedDice: p.equippedDice,
        diceStyle: p.diceStyle,
        honorTitle: p.honorTitle || '',
        isBot: p.isBot,
        team: this.canSeeAlliance(forPlayerId, p) || p.id === forPlayerId ? p.team : null,
        allied: this.canSeeAlliance(forPlayerId, p),
        color: p.color,
        money: p.money,
        position: p.position,
        titleCount: p.titles.length,
        // Titres complets visibles de tous (utile pour les échanges) — pas d'info secrète dans ce jeu
        titles: p.titles.map((t) => ({
          id: t.id,
          resourceId: t.resourceId,
          resourceName: t.resourceName,
          country: t.country,
          percent: t.percent,
          price: t.price,
        })),
        joker: p.joker,
        laps: p.laps,
        bankrupt: p.bankrupt,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      pendingAction: forPlayerId && this.pendingAction?.playerId === forPlayerId
        ? this.pendingAction
        : this.pendingAction?.type === 'auction'
          ? { type: 'auction', auction: this.auction }
          : null,
      auction: this.auction,
      diceResult: this.diceResult,
      newsReveal: this.lastNewsReveal,
      // Propositions sociales ciblées
      incomingAlliance: this.pendingAlliance && this.pendingAlliance.toId === forPlayerId
        ? { ...this.pendingAlliance, fromName: this.players.find((p) => p.id === this.pendingAlliance.fromId)?.name }
        : null,
      outgoingAlliance: this.pendingAlliance && this.pendingAlliance.fromId === forPlayerId
        ? { ...this.pendingAlliance, toName: this.players.find((p) => p.id === this.pendingAlliance.toId)?.name }
        : null,
      incomingTrade: this.pendingTrade && this.pendingTrade.toId === forPlayerId
        ? { ...this.pendingTrade, fromName: this.players.find((p) => p.id === this.pendingTrade.fromId)?.name }
        : null,
      outgoingTrade: this.pendingTrade && this.pendingTrade.fromId === forPlayerId
        ? { ...this.pendingTrade, toName: this.players.find((p) => p.id === this.pendingTrade.toId)?.name }
        : null,
      log: this.log.slice(0, 20),
      winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null,
      winningTeam: this.winningTeam || null,
    };
  }
}

module.exports = GameEngine;

};

window.RdmEngine = {
  GameEngine: __require('GameEngine'),
  bot: __require('bot'),
  shop: __require('shop'),
};
})();
