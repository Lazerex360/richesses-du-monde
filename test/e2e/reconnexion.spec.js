// E2E : un joueur qui recharge la page en pleine partie retrouve son salon
// (rejoin_room) sans que l'autre joueur perde sa session.
const { test, expect } = require('@playwright/test');
const { loginAsGuest, startTwoPlayerGame } = require('./helpers');

test('un rechargement de page en pleine partie reprend la partie en cours', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const alice = await ctxA.newPage();
  const bob = await ctxB.newPage();

  await loginAsGuest(alice);
  await loginAsGuest(bob);

  const code = await startTwoPlayerGame(alice, bob, 'Partie Reconnexion');

  // ── Alice recharge la page : token + salon actif sont en localStorage ──
  await alice.reload();

  // ── rejoin_room la replace directement dans la partie en cours ──
  await expect(alice.locator('#screen-game')).toHaveClass(/active/, { timeout: 15000 });
  await expect(alice.locator('#room-label')).toHaveText(code);
  await expect(alice.locator('#board .board-cell').first()).toBeVisible();

  // ── Bob, resté connecté, voit toujours la partie normalement ──
  await expect(bob.locator('#screen-game')).toHaveClass(/active/);
  await expect(bob.locator('#board .board-cell').first()).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});
