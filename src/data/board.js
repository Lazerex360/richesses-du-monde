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
