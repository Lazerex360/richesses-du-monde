// Génère public/js/i18n-{code}.js à partir des JSON dans scripts/locales/.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/en-keys.json'), 'utf8'));
const baseKeys = Object.keys(en);

const codes = fs.readdirSync(path.join(__dirname, 'locales'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => path.basename(f, '.json'))
  .sort();

for (const code of codes) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', `${code}.json`), 'utf8'));
  const missing = baseKeys.filter((k) => data[k] == null);
  const extra = Object.keys(data).filter((k) => !en[k]);
  if (missing.length) throw new Error(`[${code}] clés manquantes: ${missing.join(', ')}`);
  if (extra.length) throw new Error(`[${code}] clés en trop: ${extra.join(', ')}`);

  const lines = baseKeys.map((k) => `    '${k}': ${JSON.stringify(data[k])},`).join('\n');
  const js = `(function () {\n  window.TR = window.TR || {};\n  window.TR.${code} = {\n${lines}\n  };\n})();\n`;
  fs.writeFileSync(path.join(ROOT, 'public/js', `i18n-${code}.js`), js, 'utf8');
  console.log(`✓ i18n-${code}.js (${baseKeys.length} clés)`);
}
