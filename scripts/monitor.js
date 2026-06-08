'use strict';

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const tests = [
  { name: 'Intégrité i18n (376 clés × 9 langues)', cmd: 'node test/check_integrity.js' },
  { name: 'Layout plateau', cmd: 'node test/board_layout.js' },
  { name: 'Titres plateau (144)', cmd: 'node test/board_titles.js' },
];

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

function runTests() {
  const timestamp = new Date().toLocaleString('fr-FR', { hour12: false });
  const border = '═'.repeat(60);
  console.log(`\n${CYAN}${BOLD}${border}${RESET}`);
  console.log(`${CYAN}${BOLD}  Richesses du Monde — Tests  ${DIM}${timestamp}${RESET}`);
  console.log(`${CYAN}${BOLD}${border}${RESET}\n`);

  let failures = 0;

  for (const { name, cmd } of tests) {
    try {
      execSync(cmd, { cwd: projectRoot, stdio: 'pipe', timeout: 30000 });
      console.log(`${GREEN}✅ PASS${RESET}  ${name}`);
    } catch (err) {
      failures++;
      console.log(`${RED}❌ FAIL${RESET}  ${name}`);
      const output = (
        (err.stdout ? err.stdout.toString() : '') +
        (err.stderr ? err.stderr.toString() : '')
      ).trim().slice(0, 500);
      if (output) {
        console.log(`${DIM}${output}${RESET}`);
      }
    }
  }

  const total = tests.length;
  const passed = total - failures;
  const summaryColor = failures === 0 ? GREEN : failures === total ? RED : YELLOW;
  console.log(`\n${summaryColor}${BOLD}${passed}/${total} tests passed${RESET}\n`);

  return failures;
}

function watch(intervalMs) {
  runTests();
  setInterval(() => {
    console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
    runTests();
  }, intervalMs);
}

// Parse CLI args
const args = process.argv.slice(2);
let intervalSeconds = 60;
let once = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--interval' && args[i + 1]) {
    intervalSeconds = parseInt(args[i + 1], 10) || 60;
    i++;
  } else if (args[i] === '--once') {
    once = true;
  }
}

const intervalMs = intervalSeconds * 1000;

process.on('SIGINT', () => {
  console.log(`\n${YELLOW}Surveillance arrêtée${RESET}`);
  process.exit(0);
});

if (once) {
  const failures = runTests();
  process.exit(failures > 0 ? 1 : 0);
} else {
  console.log(`${CYAN}${BOLD}👁️  Surveillance active — tests toutes les ${intervalSeconds}s${RESET}`);
  watch(intervalMs);
}
