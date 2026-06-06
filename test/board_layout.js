const {
  BOARD, BOARD_POSITIONS, OUTER_LOOP_END, INNER_LOOP_START, LOOP_END,
  buildBoardPositions, applyBoardInset, BOARD_GRID, BOARD_LOGIC_GRID, BOARD_INSET,
} = require('../src/data/board');

let ok = true;
function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); ok = false; }
}

assert(BOARD.length === BOARD_POSITIONS.length, 'positions length matches board');
const keys = new Set(BOARD_POSITIONS.map((p) => `${p.row},${p.col}`));
assert(keys.size === BOARD_POSITIONS.length, 'all positions unique');

assert(BOARD[OUTER_LOOP_END].type === 'bonus' && !BOARD[OUTER_LOOP_END].resource, 'outer ends at 2nd bonus sans ressource');
assert(BOARD[INNER_LOOP_START].type === 'auction', 'inner starts at Enchères');
assert(BOARD[LOOP_END].type === 'auction', 'loop ends at Enchères');

const p36 = BOARD_POSITIONS[OUTER_LOOP_END];
const p37 = BOARD_POSITIONS[INNER_LOOP_START];
assert(Math.abs(p36.row - p37.row) + Math.abs(p36.col - p37.col) === 1, 'outer→inner adjacent');

const p66 = BOARD_POSITIONS[LOOP_END];
const p1 = BOARD_POSITIONS[1];
assert(Math.abs(p66.row - p1.row) + Math.abs(p66.col - p1.col) === 1, 'last→Allemagne adjacent');

const rebuilt = applyBoardInset(
  buildBoardPositions(BOARD.length, BOARD_LOGIC_GRID.cols, BOARD_LOGIC_GRID.rows, OUTER_LOOP_END),
  OUTER_LOOP_END,
  BOARD_INSET,
  BOARD_LOGIC_GRID,
  BOARD_GRID,
);
assert(rebuilt.length === BOARD_POSITIONS.length, 'rebuild length');
assert(rebuilt.every((p, i) => p.row === BOARD_POSITIONS[i].row && p.col === BOARD_POSITIONS[i].col), 'rebuild matches');

console.log(ok ? '✅ board_layout OK' : '❌ board_layout FAILED');
process.exit(ok ? 0 : 1);
