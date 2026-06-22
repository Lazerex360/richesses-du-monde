/**
 * Génère public/js/offline-engine.js : le moteur de jeu serveur empaqueté
 * pour le navigateur (mode hors-ligne contre bots).
 *
 * Pourquoi un bundle plutôt que servir src/ ? Les fichiers moteur sont en
 * CommonJS et vivent hors de public/ ; on les enveloppe dans un mini
 * registre require() avec un shim crypto, et on fige le tout dans un seul
 * fichier précachable par le service worker.
 *
 * Usage : node tools/build-offline.js   (relancer après toute modif moteur)
 *         test/check_offline_engine.js réutilise generate() pour vérifier
 *         que le bundle committé est à jour (voir npm test).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  ['resources', 'src/data/resources.js'],
  ['board', 'src/data/board.js'],
  ['shop', 'src/data/shop.js'],
  ['bot', 'src/game/bot.js'],
  ['GameEngine', 'src/game/GameEngine.js'],
];

function generate() {
  let out = `/* GÉNÉRÉ par tools/build-offline.js — NE PAS ÉDITER À LA MAIN.
   Moteur de jeu serveur empaqueté pour le mode hors-ligne navigateur. */
(function () {
'use strict';
const __modules = {};
const __cache = {};
function __require(name) {
  const key = name.split('/').pop().replace(/\\.js$/, '');
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
`;

  for (const [key, rel] of FILES) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    out += `\n/* ── ${rel} ─────────────────────────────── */\n`;
    out += `__modules[${JSON.stringify(key)}] = function (module, exports, require) {\n${src}\n};\n`;
  }

  out += `
window.RdmEngine = {
  GameEngine: __require('GameEngine'),
  bot: __require('bot'),
  shop: __require('shop'),
};
})();
`;

  return out;
}

if (require.main === module) {
  const out = generate();
  const dest = path.join(ROOT, 'public/js/offline-engine.js');
  fs.writeFileSync(dest, out);
  console.log(`offline-engine.js généré (${(out.length / 1024).toFixed(1)} Ko)`);
}

module.exports = { generate, FILES };
