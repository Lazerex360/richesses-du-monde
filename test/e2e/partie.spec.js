// E2E : partie complète à 2 joueurs — invité, salon, lancement, tours de jeu.
// Deux contextes navigateur isolés (localStorage distinct → deux comptes
// invités différents) sur le même serveur, comme deux vrais joueurs.
const { test, expect } = require('@playwright/test');
const { loginAsGuest, findActivePage, playOneTurn, startTwoPlayerGame } = require('./helpers');

test('deux joueurs créent, rejoignent et jouent des tours', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const alice = await ctxA.newPage();
  const bob = await ctxB.newPage();

  // ── Authentification invité (comptes distincts par contexte) ──
  await loginAsGuest(alice);
  await loginAsGuest(bob);

  // ── Salon, prêts, lancement ──
  await startTwoPlayerGame(alice, bob, 'Partie E2E');

  // ── Le plateau est rendu pour les deux joueurs ──
  await expect(alice.locator('#board .board-cell').first()).toBeVisible();
  await expect(bob.locator('#board .board-cell').first()).toBeVisible();

  // ── Deux tours complets : chaque joueur actif lance puis finit son tour ──
  const pages = [alice, bob];
  for (let turn = 0; turn < 2; turn++) {
    let active = null;
    await expect
      .poll(async () => { active = await findActivePage(pages); return !!active; }, { timeout: 30000 })
      .toBe(true);
    await playOneTurn(active, pages);
  }

  // ── Le journal de partie reflète l'activité ──
  const logText = await alice.locator('#game-log').textContent();
  expect(logText.trim().length).toBeGreaterThan(0);

  await ctxA.close();
  await ctxB.close();
});

test('la carte des richesses liste 24 richesses et 144 titres', async ({ page }) => {
  await loginAsGuest(page);
  // L'overlay est accessible hors partie : tous les titres « Disponible ».
  await page.evaluate(() => window.openWorldMap());
  await expect(page.locator('#worldmap-overlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('#worldmap-body .wm-item')).toHaveCount(24);
  await expect(page.locator('#worldmap-body .wm-item tbody tr')).toHaveCount(144);
  await expect(page.locator('#worldmap-body .wm-owner-free')).toHaveCount(144);

  // La recherche filtre par pays.
  await page.fill('#worldmap-search', 'France');
  const visible = page.locator('#worldmap-body .wm-item:not(.filtered-out)');
  await expect(visible.first()).toBeVisible();
  const count = await visible.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(24);
});
