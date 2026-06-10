// E2E : partie complète à 2 joueurs — invité, salon, lancement, tours de jeu.
// Deux contextes navigateur isolés (localStorage distinct → deux comptes
// invités différents) sur le même serveur, comme deux vrais joueurs.
const { test, expect } = require('@playwright/test');

/** Connexion invité depuis l'écran d'accueil jusqu'au hub. */
async function loginAsGuest(page) {
  await page.goto('/');
  await page.click('#btn-guest');
  await expect(page.locator('#screen-hub')).toHaveClass(/active/, { timeout: 15000 });
  // Premier lancement : le tutoriel (modal) intercepte les clics — on le passe.
  const skipTuto = page.locator('#tutorial-skip');
  if (await skipTuto.isVisible().catch(() => false)) {
    await skipTuto.click();
    await expect(page.locator('#tutorial-overlay')).toHaveClass(/hidden/);
  }
}

/**
 * Se déclare prêt et attend la confirmation serveur (classe `is-ready`
 * posée par le broadcast room_update). Re-clique si le toggle s'est perdu.
 */
async function setReady(page) {
  await expect(async () => {
    const confirmed = page.locator('#btn-ready.is-ready');
    if (!(await confirmed.isVisible().catch(() => false))) {
      await page.click('#btn-ready');
    }
    await expect(confirmed).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
}

/** Renvoie la page dont c'est le tour (celle qui affiche « Lancer les dés »). */
async function findActivePage(pages) {
  for (const p of pages) {
    if (await p.locator('#btn-roll').isVisible().catch(() => false)) return p;
  }
  return null;
}

/** Clique sur le premier sélecteur visible parmi `selectors`. Renvoie le sélecteur cliqué ou null. */
async function clickFirstVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click().catch(() => {});
      return sel;
    }
  }
  return null;
}

/**
 * Joue un tour complet pour le joueur actif : lance les dés puis traverse
 * les panneaux possibles (actualité, achat, enchère…) jusqu'à « Finir le tour ».
 */
async function playOneTurn(active, allPages) {
  await active.click('#btn-roll');
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    // La carte actualité s'affiche chez TOUS les joueurs : on la ferme partout.
    for (const p of allPages) {
      await clickFirstVisible(p, ['#news-card-dismiss']);
    }
    const clicked = await clickFirstVisible(active, [
      '#btn-end-turn',
      '#btn-skip-buy',
      '#btn-skip-buy-modal',
      '#btn-skip-joker',
    ]);
    if (clicked === '#btn-end-turn') return;
    await active.waitForTimeout(500);
  }
  throw new Error('Tour non terminé en 45s (panneau inattendu ?)');
}

test('deux joueurs créent, rejoignent et jouent des tours', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const alice = await ctxA.newPage();
  const bob = await ctxB.newPage();

  // ── Authentification invité (comptes distincts par contexte) ──
  await loginAsGuest(alice);
  await loginAsGuest(bob);

  // ── Alice crée un salon privé ──
  await alice.fill('#create-name', 'Partie E2E');
  await alice.uncheck('#create-public');
  await alice.click('#btn-create');
  await expect(alice.locator('#screen-lobby')).toHaveClass(/active/);
  const code = (await alice.locator('#lobby-code').textContent()).trim();
  expect(code).toMatch(/^[A-Z0-9]{4,6}$/);

  // ── Bob rejoint avec le code ──
  await bob.fill('#join-code', code);
  await bob.click('#btn-join');
  await expect(bob.locator('#screen-lobby')).toHaveClass(/active/);

  // ── Les deux se déclarent prêts, Alice (hôte) lance ──
  await setReady(alice);
  await setReady(bob);
  await expect(alice.locator('#btn-start')).toBeEnabled();
  await alice.click('#btn-start');
  await expect(alice.locator('#screen-game')).toHaveClass(/active/, { timeout: 15000 });
  await expect(bob.locator('#screen-game')).toHaveClass(/active/, { timeout: 15000 });

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
