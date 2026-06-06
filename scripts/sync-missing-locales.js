// Complète scripts/locales/*.json avec les clés manquantes (valeur EN par défaut).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/en-keys.json'), 'utf8'));
const keys = Object.keys(en);
const localesDir = path.join(__dirname, 'locales');

for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'))) {
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let added = 0;
  for (const k of keys) {
    if (data[k] == null) { data[k] = en[k]; added++; }
  }
  const ordered = {};
  for (const k of keys) ordered[k] = data[k];
  fs.writeFileSync(p, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  console.log(`✓ ${file} (+${added} clés)`);
}
