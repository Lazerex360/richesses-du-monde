// Config Playwright — E2E multi-clients sur le serveur de jeu réel.
// Port et données dédiés (3100, test-results/e2e-data) pour ne jamais
// toucher au serveur de dev (3000) ni aux comptes réels de data/.
const { defineConfig } = require('@playwright/test');

const E2E_PORT = Number(process.env.E2E_PORT) || 3100;

module.exports = defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    // Edge installé localement : évite le téléchargement Chromium
    // (bloqué sur certains réseaux). Surchargez via E2E_CHANNEL=chromium
    // si les navigateurs Playwright sont installés.
    channel: process.env.E2E_CHANNEL || 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server.js',
    port: E2E_PORT,
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: String(E2E_PORT),
      // RDM_BUNDLE_DATA pointé sur le même dossier (vide) : sans cela,
      // config.js le rabat sur data/ réel et seedDataFile COPIERAIT les
      // vrais comptes dans le jeu de données de test.
      RDM_USER_DATA: 'test-results/e2e-data',
      RDM_BUNDLE_DATA: 'test-results/e2e-data',
      NODE_ENV: 'test',
    },
  },
});
