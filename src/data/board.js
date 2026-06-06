// Plateau Lansay — double boucle en spirale (coquille d'escargot)
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
const ASIE_SANS_CHINE_INDE = ['japon', 'indonesie', 'asie_sud', 'peninsule_indienne', 'moyen_orient', 'oceanie'];

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
const BOARD_LOGIC_GRID = { cols: 22, rows: 15 };
const BOARD_GRID = {
  cols: BOARD_LOGIC_GRID.cols + 2 * BOARD_INSET,
  rows: BOARD_LOGIC_GRID.rows + 2 * BOARD_INSET,
};

// Grande boucle : périmètre continu (bas → gauche → haut)
function buildOuterPositions(outerLen, maxR, maxC) {
  const path = [{ row: maxR, col: maxC }];
  for (let c = maxC - 1; c >= 0 && path.length < outerLen; c--) {
    path.push({ row: maxR, col: c });
  }
  for (let r = maxR - 1; r >= 0 && path.length < outerLen; r--) {
    path.push({ row: r, col: 0 });
  }
  for (let c = 1; c <= maxC && path.length < outerLen; c++) {
    path.push({ row: 0, col: c });
  }
  return path.slice(0, outerLen);
}

function traceRectPerimeter(t, l, r, b, limit) {
  const path = [];
  for (let c = l; c <= r && path.length < limit; c++) path.push({ row: t, col: c });
  for (let row = t + 1; row <= b && path.length < limit; row++) path.push({ row, col: r });
  for (let c = r - 1; c >= l && path.length < limit; c--) path.push({ row: b, col: c });
  for (let row = b - 1; row > t && path.length < limit; row--) path.push({ row, col: l });
  return path;
}

function innerPerimeterCount(t, l, r, b) {
  const w = r - l + 1;
  const h = b - t + 1;
  if (w < 2 || h < 2) return w * h;
  return 2 * w + 2 * h - 4;
}

// Petite boucle : périmètre fermé (haut → droite ↓ → bas → gauche ↑), sans case vide
function buildInnerPositions(innerLen, maxR, maxC) {
  if (innerLen <= 0) return [];

  const top = 0;
  const left = 3;
  let best = null;

  for (let h = 4; h <= maxR - top + 1; h++) {
    for (let w = 4; w <= maxC - left + 1; w++) {
      if (2 * w + 2 * h - 4 !== innerLen) continue;
      const right = left + w - 1;
      const bottom = top + h - 1;
      if (right > maxC || bottom > maxR) continue;
      const path = traceRectPerimeter(top, left, right, bottom, innerLen);
      if (path.length < innerLen) continue;
      const area = w * h;
      if (!best || area > best.area || (area === best.area && h > best.height)) {
        best = { path, area, height: h };
      }
    }
  }

  if (best) return best.path;
  return traceRectPerimeter(top, left, left + 11, top + 5, innerLen);
}

// Double spirale : extérieur puis intérieur (ordre de jeu inchangé)
function buildBoardPositions(count, cols, rows, outerEnd = OUTER_LOOP_END, innerGrid = null) {
  const maxR = rows - 1;
  const maxC = cols - 1;
  const innerMaxR = innerGrid ? innerGrid.rows - 1 : maxR;
  const innerMaxC = innerGrid ? innerGrid.cols - 1 : maxC;
  const outerLen = outerEnd + 1;
  const innerLen = count - outerLen;
  return [
    ...buildOuterPositions(outerLen, maxR, maxC),
    ...buildInnerPositions(innerLen, innerMaxR, innerMaxC),
  ];
}

// Décale les cases vers la grille d'affichage élargie
function applyBoardInset(positions, outerEnd, inset, logicalGrid, displayGrid) {
  const logMaxR = logicalGrid.rows - 1;
  const logMaxC = logicalGrid.cols - 1;
  const maxR = displayGrid.rows - 1;
  const maxC = displayGrid.cols - 1;
  const innerStart = outerEnd + 1;
  const loopEnd = positions.length - 1;

  const mapped = positions.map((p, i) => {
    if (i <= outerEnd) {
      let row = p.row + inset;
      let col = p.col + inset;
      if (p.row === 0) row = 0;
      if (p.col === 0) col = 0;
      if (p.row === logMaxR) row = maxR;
      if (p.col === logMaxC) col = maxC;
      return { row, col };
    }
    // Petite boucle : coordonnées d'affichage directes (périmètre continu sans trou)
    return { row: p.row, col: p.col };
  });

  mapped[innerStart] = { row: mapped[outerEnd].row, col: mapped[outerEnd].col + 1 };
  mapped[loopEnd] = { row: mapped[1].row - 1, col: mapped[1].col };

  return mapped;
}

function computeInnerTrackClipPath(innerBand) {
  if (!innerBand.length) return 'none';

  const rowMin = Math.min(...innerBand.map((p) => p.row));
  const rowMax = Math.max(...innerBand.map((p) => p.row));
  const colMin = Math.min(...innerBand.map((p) => p.col));
  const colMax = Math.max(...innerBand.map((p) => p.col));
  const rowH = rowMax - rowMin + 1;
  const colW = colMax - colMin + 1;
  const pct = (n) => `${Math.round(n * 1000) / 10}%`;
  const X = (c) => pct((c - colMin) / colW);
  const XR = (c) => pct((c - colMin + 1) / colW);
  const Y = (r) => pct((r - rowMin) / rowH);
  const YB = (r) => pct((r - rowMin + 1) / rowH);

  const segs = [];
  for (let r = rowMin; r <= rowMax; r++) {
    const cols = innerBand.filter((p) => p.row === r).map((p) => p.col);
    segs.push({ r, lo: Math.min(...cols), hi: Math.max(...cols) });
  }

  const pts = [];
  const push = (x, y) => {
    const pt = `${x} ${y}`;
    if (pts[pts.length - 1] !== pt) pts.push(pt);
  };

  push(X(segs[0].lo), Y(segs[0].r));
  push(XR(segs[0].hi), Y(segs[0].r));

  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const n = segs[i + 1];
    push(XR(s.hi), YB(s.r));
    if (!n) break;
    if (n.hi < s.hi) push(XR(n.hi), YB(s.r));
    push(XR(n.hi), Y(n.r));
  }

  const tail = segs[segs.length - 1];
  push(X(tail.lo), YB(tail.r));

  for (let i = segs.length - 1; i > 0; i--) {
    const s = segs[i];
    const prev = segs[i - 1];
    push(X(s.lo), Y(s.r));
    if (prev.lo < s.lo) {
      push(X(prev.lo), Y(s.r));
      push(X(prev.lo), YB(prev.r));
    }
  }

  push(X(segs[0].lo), YB(segs[0].r));
  return `polygon(${pts.join(', ')})`;
}

function computeBoardUi(positions, outerEnd, grid) {
  const outer = positions.slice(0, outerEnd + 1);
  // Petite boucle sans la dernière case (reliée à l'Allemagne, hors bandeau)
  const innerBand = positions.slice(outerEnd + 1, -1);

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
      rowStart: innerRowMin + 2,
      rowEnd: innerRowMax + 1,
      colStart: innerColMin + 2,
      colEnd: innerColMax,
    },
    trackOuter: {
      rowStart: outerRowMin + 1,
      rowEnd: outerRowMax + 2,
      colStart: outerColMin + 1,
      colEnd: outerColMax + 2,
    },
    trackInner: {
      rowStart: innerRowMin + 1,
      rowEnd: innerRowMax + 2,
      colStart: innerColMin + 1,
      colEnd: innerColMax + 2,
      clipPath: computeInnerTrackClipPath(innerBand),
    },
  };
}

const BOARD_POSITIONS = applyBoardInset(
  buildBoardPositions(BOARD.length, BOARD_LOGIC_GRID.cols, BOARD_LOGIC_GRID.rows, OUTER_LOOP_END, BOARD_GRID),
  OUTER_LOOP_END,
  BOARD_INSET,
  BOARD_LOGIC_GRID,
  BOARD_GRID,
);

const BOARD_UI = computeBoardUi(BOARD_POSITIONS, OUTER_LOOP_END, BOARD_GRID);

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
  traceRectPerimeter,
  applyBoardInset,
  computeBoardUi,
  computeInnerTrackClipPath,
};
