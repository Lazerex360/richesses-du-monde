// IA simple pour les bots (jeu solo / remplissage de partie).
// Une seule "étape" est jouée par appel, pour pouvoir animer les tours côté client.

const BOT_NAMES = [
  'Bot Marco', 'Bot Vasco', 'Bot Magellan', 'Bot Cook', 'Bot Drake',
  'Bot Colomb', 'Bot Cartier', 'Bot Livingstone', 'Bot Amundsen', 'Bot Zheng',
];

function randomBotName(used = []) {
  const free = BOT_NAMES.filter((n) => !used.includes(n));
  const pool = free.length ? free : BOT_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

const BOT_PAWNS = ['robot', 'ufo', 'dragon', 'crown', 'rocket', 'ship', 'castle', 'fox', 'tiger'];
function randomBotPawn() {
  return BOT_PAWNS[Math.floor(Math.random() * BOT_PAWNS.length)];
}

// Choisit les titres à acheter : priorise les richesses déjà détenues, garde une réserve de cash.
function chooseTitlesToBuy(game, player, action) {
  const reserve = 4000000; // garde un coussin de sécurité
  const budget = Math.max(0, player.money - reserve);
  const owned = new Set(player.titles.map((t) => t.resourceId));

  const sorted = [...action.available].sort((a, b) => {
    const ao = owned.has(a.resourceId) ? 0 : 1;
    const bo = owned.has(b.resourceId) ? 0 : 1;
    if (ao !== bo) return ao - bo; // d'abord les richesses déjà possédées
    return b.percent - a.percent; // puis le plus gros pourcentage
  });

  const chosen = [];
  let spent = 0;
  for (const t of sorted) {
    if (chosen.length >= (action.maxTitles || 6)) break;
    if (spent + t.price <= budget) {
      chosen.push(t.id);
      spent += t.price;
    }
  }
  return chosen;
}

// Joue une étape pour le joueur courant s'il est un bot. Retourne true si une action a eu lieu.
function playBotStep(game) {
  if (!game || game.winner) return false;
  const player = game.getCurrentPlayer();
  if (!player || !player.isBot) return false;

  // Si le bot courant vient de faire faillite (double pénalisé, carte actualité…),
  // personne d'autre n'appelle endTurn() — on le fait ici pour débloquer le jeu.
  if (player.bankrupt) {
    if (!game.winner && game.phase === 'end_turn') {
      game.endTurn();
      return true;
    }
    return false;
  }

  // Phase de lancer
  if (game.phase === 'rolling' && !game.pendingAction && !game.auction) {
    game.rollDice();
    // Le bot peut faire faillite sur un double : avancer au joueur suivant.
    if (player.bankrupt && !game.winner && game.phase === 'end_turn') game.endTurn();
    return true;
  }

  const a = game.pendingAction;
  if (a && a.playerId === player.id) {
    if (a.type === 'royalty_due') {
      const res = game.payLandRoyalties(player.id);
      if (res.error) {
        game.handleBankruptcy(player);
        if (!game.winner && game.phase === 'end_turn') game.endTurn();
      }
      return true;
    }
    if (a.type === 'buy_titles') {
      const ids = chooseTitlesToBuy(game, player, a);
      const res = game.buyTitles(player.id, ids);
      if (res.error) game.buyTitles(player.id, []);
      return true;
    }
    if (a.type === 'joker_buy') {
      // Achète un joker si confortable
      if (player.money > 12000000 && Math.random() > 0.4) game.buyJoker(player.id);
      else game.skipJoker(player.id);
      return true;
    }
    if (a.type === 'joker_choice') {
      game.useJokerSkip(player.id);
      return true;
    }
  }

  // Fin de tour
  if ((game.phase === 'end_turn' || game.phase === 'action') && !game.pendingAction && !game.auction) {
    game.endTurn();
    return true;
  }

  return false;
}

// Pendant une enchère, les bots non-vendeurs peuvent enchérir une fois.
function botAuctionBids(game) {
  if (!game.auction) return false;
  let acted = false;
  for (const p of game.getActivePlayers()) {
    if (p.isBot && p.id !== game.auction.sellerId) {
      const bid = game.auction.currentBid + 100000;
      // Enchérit si le lot reste bon marché et qu'il a de la marge
      if (p.money > bid + 6000000 && Math.random() > 0.55) {
        const r = game.placeBid(p.id, bid);
        if (r.success) acted = true;
      }
    }
  }
  return acted;
}

module.exports = { playBotStep, botAuctionBids, randomBotName, randomBotPawn };
