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
  ROYALTY_MAX_90,
  ROYALTY_DEFAULT_MAX,
  buildRoyaltiesForResource,
  getResourceRoyalties,
  getRoyaltyAmount,
  buildDeck,
  getAllTitlesFlat,
};
