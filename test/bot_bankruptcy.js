// Régression : quand le bot courant fait faillite, le tour doit passer
// au joueur suivant sans bloquer le jeu.
const GameEngine = require('../src/game/GameEngine');
const { playBotStep } = require('../src/game/bot');

let failures = 0;

function assert(cond, msg) {
  if (!cond) { console.error('  FAIL:', msg); failures++; }
  else console.log('  ok  :', msg);
}

// ── Cas 1 : faillite via royalty_due ──────────────────────────────────────
{
  const ge = new GameEngine('TEST', [
    { name: 'Alice', pawn: 'classic' },
    { name: 'Bot1', pawn: 'dragon', isBot: true },
    { name: 'Bot2', pawn: 'fox', isBot: true },
  ]);
  ge.currentPlayerIndex = 1;
  ge.phase = 'action';
  const bot1 = ge.players[1];
  bot1.money = 100;

  // Donner les 6 titres "aluminium" à Alice → calcRoyaltyDue retourne ~12M
  for (const titles of Object.values(ge.deck)) {
    for (const t of titles) {
      if (t.id.startsWith('aluminium')) {
        t.ownerId = ge.players[0].id;
        ge.players[0].titles.push({ ...t });
      }
    }
  }

  ge.pendingAction = {
    type: 'royalty_due',
    playerId: bot1.id,
    resourceId: 'aluminium',
    resourceName: 'Aluminium',
    totalDue: 12000000,
    owners: [{ ownerId: ge.players[0].id, ownerName: 'Alice', royalty: 12000000, percent: 90 }],
    landContext: null,
  };

  const acted = playBotStep(ge);
  assert(acted, 'Cas 1: playBotStep retourne true');
  assert(bot1.bankrupt, 'Cas 1: Bot1 est en faillite');
  assert(!ge.winner, 'Cas 1: aucun gagnant (3 joueurs → 2 restants)');
  assert(ge.phase === 'rolling', 'Cas 1: phase=rolling (tour suivant)');
  assert(ge.getCurrentPlayer().id !== bot1.id, 'Cas 1: Bot1 n\'est plus le joueur courant');
}

// ── Cas 2 : faillite via double aux dés (simulée) ─────────────────────────
{
  const ge = new GameEngine('TEST', [
    { name: 'Alice', pawn: 'classic' },
    { name: 'Bot1', pawn: 'dragon', isBot: true },
    { name: 'Bot2', pawn: 'fox', isBot: true },
  ]);
  ge.currentPlayerIndex = 1;
  ge.phase = 'rolling';
  const bot1 = ge.players[1];

  // Simuler l'état post-rollDice quand le bot fait faillite sur un double :
  // handleBankruptcy ne peut pas appeler endTurn (phase='rolling'),
  // puis rollDice force phase='end_turn'.
  ge.handleBankruptcy(bot1);
  if (ge.phase !== 'game_over' && ge.phase !== 'auction') {
    ge.phase = ge.pendingAction ? 'action' : 'end_turn';
  }

  assert(ge.phase === 'end_turn', 'Cas 2: phase=end_turn avant playBotStep (précondition bug)');
  assert(ge.getCurrentPlayer().id === bot1.id, 'Cas 2: Bot1 toujours courant (précondition bug)');

  const acted = playBotStep(ge);
  assert(acted, 'Cas 2: playBotStep retourne true');
  assert(!ge.winner, 'Cas 2: aucun gagnant');
  assert(ge.phase === 'rolling', 'Cas 2: phase=rolling (tour suivant)');
  assert(ge.getCurrentPlayer().id !== bot1.id, 'Cas 2: Bot1 n\'est plus le joueur courant');
}

// ── Cas 3 : faillite du dernier adversaire → victoire correcte ────────────
{
  const ge = new GameEngine('TEST', [
    { name: 'Alice', pawn: 'classic' },
    { name: 'Bot1', pawn: 'dragon', isBot: true },
  ]);
  ge.currentPlayerIndex = 1;
  ge.phase = 'rolling';
  const bot1 = ge.players[1];

  ge.handleBankruptcy(bot1);
  if (ge.phase !== 'game_over' && ge.phase !== 'auction') {
    ge.phase = ge.pendingAction ? 'action' : 'end_turn';
  }

  // checkVictory() dans handleBankruptcy doit avoir déclaré Alice gagnante
  assert(ge.winner?.name === 'Alice', 'Cas 3: Alice gagne quand le seul bot fait faillite');
  assert(ge.phase === 'game_over', 'Cas 3: phase=game_over');

  // playBotStep doit retourner false (partie terminée)
  const acted = playBotStep(ge);
  assert(!acted, 'Cas 3: playBotStep retourne false sur une partie terminée');
}

console.log(failures === 0 ? '\n✅ bot_bankruptcy OK' : `\n❌ ${failures} test(s) en échec`);
if (failures > 0) process.exit(1);
