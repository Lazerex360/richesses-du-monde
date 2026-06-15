/**
 * Vérifie que public/js/offline-engine.js est à jour par rapport aux fichiers
 * moteur source. Évite d'oublier `node tools/build-offline.js` après une
 * modif de src/game/GameEngine.js, src/data/board.js, etc. (cause d'un bug
 * du mode hors-ligne déjà rencontré).
 */
const fs = require('fs');
const path = require('path');
const { generate } = require('../tools/build-offline');

const dest = path.join(__dirname, '..', 'public/js/offline-engine.js');
const expected = generate();
const actual = fs.readFileSync(dest, 'utf8');

if (actual !== expected) {
  console.error('FAIL: public/js/offline-engine.js est désynchronisé du moteur source.');
  console.error('      → lancer `node tools/build-offline.js` puis committer le résultat.');
  process.exit(1);
}

console.log('✅ offline-engine.js à jour');
