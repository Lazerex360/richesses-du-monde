// Aides partagées entre les specs E2E (connexion invité, lobby, tours de jeu).
const { expect } = require('@playwright/test');

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

/** Crée un salon privé avec Alice, Bob le rejoint, les deux se déclarent prêts et Alice lance la partie. */
async function startTwoPlayerGame(alice, bob, roomName) {
  await alice.fill('#create-name', roomName);
  await alice.uncheck('#create-public');
  await alice.click('#btn-create');
  await expect(alice.locator('#screen-lobby')).toHaveClass(/active/);
  const code = (await alice.locator('#lobby-code').textContent()).trim();
  expect(code).toMatch(/^[A-Z0-9]{4,6}$/);

  await bob.fill('#join-code', code);
  await bob.click('#btn-join');
  await expect(bob.locator('#screen-lobby')).toHaveClass(/active/);

  await setReady(alice);
  await setReady(bob);
  await expect(alice.locator('#btn-start')).toBeEnabled();
  await alice.click('#btn-start');
  await expect(alice.locator('#screen-game')).toHaveClass(/active/, { timeout: 15000 });
  await expect(bob.locator('#screen-game')).toHaveClass(/active/, { timeout: 15000 });

  return code;
}

module.exports = {
  loginAsGuest,
  setReady,
  findActivePage,
  clickFirstVisible,
  playOneTurn,
  startTwoPlayerGame,
};
