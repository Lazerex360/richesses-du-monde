// Vérificateur d'intégrité : i18n, références DOM (#id), data-i18n.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const clientSrc = fs.readFileSync(path.join(ROOT, 'public/js/client.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');

// Charge le dictionnaire i18n
global.window = {};
require(path.join(ROOT, 'public/js/i18n.js'));
for (const f of fs.readdirSync(path.join(ROOT, 'public/js')).filter((n) => /^i18n-[a-z]{2}\.js$/.test(n))) {
  require(path.join(ROOT, 'public/js', f));
}
const TR = global.window.TR;
const LANGS = global.window.TR_LANGS;

let errors = 0;
const err = (m) => { console.log('❌ ' + m); errors++; };

// 1) Parité des clés entre langues
const baseKeys = Object.keys(TR.fr);
for (const l of LANGS) {
  for (const k of baseKeys) if (TR[l][k] == null) err(`Clé i18n manquante [${l}] : ${k}`);
  for (const k of Object.keys(TR[l])) if (TR.fr[k] == null) err(`Clé i18n en trop [${l}] : ${k}`);
}

// 2) Clés t('...') utilisées dans client.js -> doivent exister
const tUsage = [...clientSrc.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
for (const k of new Set(tUsage)) {
  if (TR.fr[k] == null) err(`Clé t('${k}') utilisée mais absente du dictionnaire`);
}

// 3) data-i18n / data-i18n-ph / data-i18n-title du HTML -> doivent exister
for (const attr of ['data-i18n', 'data-i18n-ph', 'data-i18n-title']) {
  const re = new RegExp(attr + '="([^"]+)"', 'g');
  for (const m of htmlSrc.matchAll(re)) {
    if (TR.fr[m[1]] == null) err(`${attr}="${m[1]}" sans traduction`);
  }
}

// 4) Références $('#id') / $("#id") dans client.js -> l'id doit exister dans le HTML
//    (on ignore les id créés dynamiquement connus)
const dynamicIds = new Set([
  'btn-buy-premium', 'btn-cancel-social', 'btn-roll', 'btn-end-turn',
  'btn-confirm-buy', 'btn-skip-buy', 'btn-bid', 'btn-bid-big', 'title-list', 'buy-summary',
  'btn-buy-joker', 'btn-skip-joker', 'btn-use-joker', 'btn-auction-me',
  'btn-open-trade', 'btn-open-ally', 'ally-targets', 'ally-cancel',
  'btn-pay-royalties', 'btn-open-trade-royalty', 'btn-open-ally-royalty', 'btn-break-alliance',
  'btn-confirm-buy-modal', 'btn-skip-buy-modal', 'btn-leave-game-action',
]);
const htmlIds = new Set([...htmlSrc.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const idUsage = [...clientSrc.matchAll(/\$\(\s*['"]#([a-zA-Z0-9_-]+)['"]\s*\)/g)].map((m) => m[1]);
for (const id of new Set(idUsage)) {
  if (!htmlIds.has(id) && !dynamicIds.has(id)) err(`$('#${id}') référencé mais id absent du HTML (ni connu comme dynamique)`);
}

console.log('---');
console.log(`Langues : ${LANGS.join(', ')} | clés : ${baseKeys.length}`);
console.log(`Clés t() utilisées : ${new Set(tUsage).size} | ids référencés : ${new Set(idUsage).size}`);
if (errors === 0) console.log('✅ Intégrité OK : aucune référence cassée.');
else { console.log(`\n${errors} problème(s) détecté(s).`); process.exit(1); }
