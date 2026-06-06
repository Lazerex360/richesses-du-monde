// Vérifie l'alignement plateau ↔ titres Lansay (règles officielles)
const { BOARD, COUNTRY_ZONE } = require('../src/data/board');
const { RESOURCES, CONTINENTS, buildDeck } = require('../src/data/resources');

const CONTINENTAL_SPECS = [
  { label: 'Choix Europe sauf Russie', resource: 'riz', exclude: ['russie'] },
  { label: 'Océanie sauf Australie', resource: 'cuivre', continent: 'oceanie', countries: ['oceanie'] },
  { label: 'Choix Amérique sauf États-Unis', resource: null, exclude: ['usa'] },
  { label: 'Choix Asie sauf Chine et Inde', resource: 'cuivre', exclude: ['chine', 'inde'] },
  { label: 'Choix Afrique', resource: 'hydraulique', continent: 'afrique' },
];

let ok = true;
function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); ok = false; }
}

const deck = buildDeck();
const resourceIds = new Set(Object.keys(RESOURCES));

// 144 titres, 6 par richesse
let titleCount = 0;
for (const res of Object.values(RESOURCES)) {
  assert(res.titles?.length === 6, `${res.name} : 6 titres attendus, ${res.titles?.length} trouvés`);
  titleCount += res.titles?.length || 0;
}
assert(titleCount === 144, `144 titres au total, ${titleCount} trouvés`);

// Chaque pays du plateau a au moins un titre dans le sabot
const countryTiles = BOARD.filter((s) => s.type === 'country');
for (const tile of countryTiles) {
  const titles = deck[tile.countryId] || [];
  assert(titles.length > 0, `${tile.label} (${tile.countryId}) : aucun titre dans le sabot`);
  if (tile.resource) {
    assert(resourceIds.has(tile.resource), `${tile.label} : ressource plateau invalide « ${tile.resource} »`);
  }
}

// Cases continentales : ressource conforme aux règles Lansay
const continentals = BOARD.filter((s) => s.type === 'continental');
assert(continentals.length === CONTINENTAL_SPECS.length, 'nombre de cases continentales');
for (const spec of CONTINENTAL_SPECS) {
  const tile = continentals.find((s) => s.label.startsWith(spec.label.split(' ').slice(0, 2).join(' '))
    || s.label.includes(spec.label.split(' ')[1]));
  const match = continentals.find((s) => {
    if (spec.label.includes('Europe') && s.continent === 'europe' && s.resource === 'riz') return true;
    if (spec.label.includes('Océanie') && s.label.includes('Océanie')) return true;
    if (spec.label.includes('Amérique') && s.continent === 'amerique') return true;
    if (spec.label.includes('Asie') && s.continent === 'asie' && s.resource === 'cuivre') return true;
    if (spec.label.includes('Afrique') && s.continent === 'afrique') return true;
    return false;
  });
  assert(match, `case continentale manquante : ${spec.label}`);
  if (spec.resource) {
    assert(match.resource === spec.resource, `${match.label} : ressource ${match.resource}, attendu ${spec.resource}`);
  }
  if (spec.exclude) {
    for (const ex of spec.exclude) {
      assert(!match.countries?.includes(ex), `${match.label} ne doit pas inclure ${ex}`);
    }
  }
}

// Pays des CONTINENTS = union des sabots
for (const [cont, ids] of Object.entries(CONTINENTS)) {
  for (const cid of ids) {
    assert(COUNTRY_ZONE[cid], `${cid} dans CONTINENTS.${cont} sans zone plateau`);
  }
}

// Norvège : royalties Pétrole sur la case, achat Hydraulique 40 % dans le sabot
const norwayTile = BOARD.find((s) => s.countryId === 'norvege');
assert(norwayTile?.resource === 'petrole', `Norvège case : Pétrole attendu, trouvé ${norwayTile?.resource}`);
const norwayTitle = deck.norvege?.find((t) => t.resourceId === 'hydraulique');
assert(norwayTitle?.percent === 40, `Norvège hydraulique 40 % attendu, trouvé ${norwayTitle?.percent}`);

// Allemagne : achat Éolien + Solaire (pas filtré par ressource case Cacao)
const germany = deck.allemagne || [];
assert(germany.length >= 2, `Allemagne : au moins 2 titres (Éolien/Solaire), ${germany.length}`);
const germanyRes = new Set(germany.map((t) => t.resourceId));
assert(germanyRes.has('eolien') && germanyRes.has('solaire'), 'Allemagne : Éolien + Solaire attendus');

console.log(ok ? '✅ board_titles OK' : '❌ board_titles FAILED');
process.exit(ok ? 0 : 1);
