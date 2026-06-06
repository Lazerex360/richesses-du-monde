// Simulation automatique d'une partie pour détecter les bugs runtime
const GameEngine = require('../src/game/GameEngine');

function pickRandom(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function runGame(seed) {
  const ge = new GameEngine('SIM', [
    { name: 'Alice', pawn: 'classic' },
    { name: 'Bob', pawn: 'dragon', isBot: true },
    { name: 'Carla', pawn: 'fox' },
    { name: 'Dan', pawn: 'robot', isBot: true },
  ]);
  let turns = 0;
  const maxTurns = 3000;
  let alliedOnce = false;
  let tradedOnce = false;

  while (!ge.winner && turns < maxTurns) {
    turns++;
    const player = ge.getCurrentPlayer();

    if (player.bankrupt) {
      ge.endTurn();
      continue;
    }

    // Teste alliances et échanges au tour du joueur
    if (ge.canManageTurnAction(player.id)) {
      const others = ge.getActivePlayers().filter((p) => p.id !== player.id);
      if (!alliedOnce && others.length >= 2 && ge.getActivePlayers().length > 2 && Math.random() > 0.7) {
        const target = others[0];
        const r = ge.proposeAlliance(player.id, target.id);
        if (r.success) { ge.respondAlliance(target.id, true); alliedOnce = true; }
      } else if (!tradedOnce && others.length && player.titles.length && Math.random() > 0.8) {
        const target = others[0];
        const give = player.titles.slice(0, 1).map((t) => t.id);
        const r = ge.proposeTrade(player.id, { toId: target.id, giveTitleIds: give, receiveTitleIds: [], cash: -500000 });
        if (r.success) { ge.respondTrade(target.id, Math.random() > 0.5); tradedOnce = true; }
        if (ge.pendingTrade) ge.cancelTrade(player.id);
      }
    }

    // 1. Roll
    if (ge.phase === 'rolling') {
      const r = ge.rollDice();
      if (r.error) throw new Error('rollDice: ' + r.error);
    }

    // 2. Resolve pending actions
    let guard = 0;
    while (ge.pendingAction && guard++ < 20) {
      const a = ge.pendingAction;
      if (a.type === 'royalty_due') {
        const res = ge.payLandRoyalties(player.id);
        if (res.error) ge.handleBankruptcy(player);
      } else if (a.type === 'buy_titles') {
        const affordable = a.available.filter((t) => t.price <= player.money);
        const choice = pickRandom(affordable, Math.min(3, affordable.length));
        const res = ge.buyTitles(player.id, choice.map((t) => t.id));
        if (res.error) {
          // fall back to buying nothing
          const res2 = ge.buyTitles(player.id, []);
          if (res2.error) throw new Error('buyTitles empty: ' + res2.error);
        }
      } else if (a.type === 'joker_buy') {
        Math.random() > 0.5 ? ge.buyJoker(player.id) : ge.skipJoker(player.id);
      } else if (a.type === 'joker_choice') {
        ge.useJokerSkip(player.id);
      } else if (a.type === 'auction') {
        // resolve auction immediately
        ge.auction.endTime = Date.now() - 1;
        ge.resolveAuction();
      } else {
        break;
      }
    }

    // 3. Pending auction (when seller has no joker)
    if (ge.auction) {
      // simulate a random bidder
      const bidders = ge.getActivePlayers().filter((p) => p.id !== ge.auction.sellerId);
      if (bidders.length && Math.random() > 0.4) {
        const bidder = bidders[Math.floor(Math.random() * bidders.length)];
        const amount = ge.auction.currentBid + 100000;
        if (bidder.money >= amount) ge.placeBid(bidder.id, amount);
      }
      ge.auction.endTime = Date.now() - 1;
      ge.resolveAuction();
    }

    // 4. End turn
    if (ge.phase === 'end_turn' || ge.phase === 'action') {
      const res = ge.endTurn();
      if (res.error && !ge.winner) throw new Error('endTurn: ' + res.error + ' phase=' + ge.phase);
    }

    // Sanity checks
    for (const p of ge.players) {
      if (!p.bankrupt && p.money < 0) {
        throw new Error(`${p.name} a de l'argent négatif (${p.money}) sans faillite`);
      }
    }
  }

  // Verify total titles conserved (144 titles total: 24 resources x 6)
  let ownedByPlayers = 0;
  for (const p of ge.players) ownedByPlayers += p.titles.length;
  let ownedInDeck = 0;
  for (const titles of Object.values(ge.deck)) {
    ownedInDeck += titles.filter((t) => t.ownerId).length;
  }

  return { turns, winner: ge.winner?.name, ownedByPlayers, ownedInDeck, finished: !!ge.winner };
}

let ok = 0;
let issues = [];
for (let i = 0; i < 30; i++) {
  try {
    const r = runGame(i);
    if (r.ownedByPlayers !== r.ownedInDeck) {
      issues.push(`Partie ${i}: incohérence titres joueurs(${r.ownedByPlayers}) vs deck(${r.ownedInDeck})`);
    }
    ok++;
    if (i < 5) console.log(`Partie ${i}: ${r.turns} tours, gagnant=${r.winner || 'aucun (limite)'}, titres=${r.ownedByPlayers}`);
  } catch (e) {
    issues.push(`Partie ${i}: ${e.message}`);
  }
}

console.log(`\n✅ ${ok}/30 parties simulées sans crash`);
if (issues.length) {
  console.log('\n⚠️ Problèmes détectés :');
  issues.forEach((i) => console.log('  - ' + i));
} else {
  console.log('✅ Aucune incohérence détectée');
}
