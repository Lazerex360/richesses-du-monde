/**
 * Mode hors-ligne — serveur de jeu local dans le navigateur.
 *
 * Reproduit le sous-ensemble de wsHandlers/roomHub nécessaire à une partie
 * solo contre bots : même protocole d'événements que le serveur (joined,
 * room_update, game_state, error_msg…), donc le client n'a RIEN à savoir —
 * socket.emit est simplement redirigé ici quand le mode est actif.
 *
 * Limite assumée : le hors-ligne est mono-appareil (solo + bots, import de
 * sauvegarde inclus). Deux téléphones sans réseau ne peuvent pas se
 * synchroniser — un salon privé multi-joueurs exige le serveur.
 */
(function () {
  'use strict';

  const BOT_DELAYS = { roll: 1600, afterRoll: 3000, action: 2000, endTurn: 1700, auction: 2000 };

  const S = { room: null, playerId: null, botTimer: null, tick: null };

  function uuid() {
    return (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : 'loc-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2, 10);
  }

  function dispatch(event, data) {
    if (typeof window.RdmDispatch === 'function') window.RdmDispatch(event, data);
  }

  function error(msg) { dispatch('error_msg', msg); }

  function getRoomPublic(room) {
    return {
      code: room.code,
      name: room.name,
      isPublic: false,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      started: room.started,
      countdownEnd: null,
      players: room.players.map((p) => ({
        id: p.id, name: p.name, pawn: p.pawn, avatar: p.avatar,
        level: p.level, honorTitle: p.honorTitle || '', ready: p.ready, isBot: !!p.isBot,
      })),
    };
  }

  function broadcast() {
    const room = S.room;
    if (!room) return;
    dispatch('room_update', getRoomPublic(room));
    if (room.game) {
      dispatch('game_state', room.game.getPublicState(S.playerId));
      maybeScheduleBot();
    }
  }

  /* ── Bots (port de roomHub.maybeScheduleBot) ─────────────────── */
  function getBotStepDelay(game) {
    if (game.auction) return BOT_DELAYS.auction;
    if (game.phase === 'rolling' && !game.pendingAction && !game.auction) return BOT_DELAYS.roll;
    if (game.pendingAction && game.diceResult) return BOT_DELAYS.afterRoll;
    if (game.phase === 'end_turn' || (game.phase === 'action' && !game.pendingAction)) {
      return BOT_DELAYS.endTurn;
    }
    return BOT_DELAYS.action;
  }

  function maybeScheduleBot() {
    const room = S.room;
    if (!room || !room.game || room.game.winner) return;
    if (S.botTimer) return;
    const game = room.game;
    const { playBotStep, botAuctionBids } = window.RdmEngine.bot;

    if (game.auction) {
      S.botTimer = setTimeout(() => {
        S.botTimer = null;
        const acted = botAuctionBids(game);
        if (acted) broadcast();
        else maybeScheduleBot();
      }, BOT_DELAYS.auction);
      return;
    }

    const cp = game.getCurrentPlayer();
    if (cp && cp.isBot && !cp.bankrupt && !game.pendingTrade && !game.pendingAlliance) {
      S.botTimer = setTimeout(() => {
        S.botTimer = null;
        const acted = playBotStep(game);
        if (acted) broadcast();
        else maybeScheduleBot();
      }, getBotStepDelay(game));
    }
  }

  function botEvaluateTrade(game, trade) {
    const to = game.players.find((p) => p.id === trade.toId);
    if (!to) return false;
    const valueGivenToBot = trade.giveTitleIds.reduce((s, id) => {
      const t = game.players.find((p) => p.id === trade.fromId)?.titles.find((x) => x.id === id);
      return s + (t?.price || 0);
    }, 0);
    const valueTakenFromBot = trade.receiveTitleIds.reduce((s, id) => {
      const t = to.titles.find((x) => x.id === id);
      return s + (t?.price || 0);
    }, 0);
    const cashToBot = trade.cash > 0 ? trade.cash : 0;
    const cashFromBot = trade.cash < 0 ? -trade.cash : 0;
    const gain = valueGivenToBot + cashToBot - valueTakenFromBot - cashFromBot;
    return gain >= 0 && to.money >= cashFromBot;
  }

  /* ── Démarrage de partie (port de roomHub.startGame) ─────────── */
  function startGame(snapshot) {
    const room = S.room;
    if (!room || room.started) return { error: 'Déjà commencée' };
    if (room.players.length < 2) return { error: 'Minimum 2 joueurs' };
    if (snapshot) {
      const saved = Array.isArray(snapshot.players) ? snapshot.players.length : 0;
      if (saved < 2) return { error: 'Sauvegarde invalide' };
      if (room.players.length !== saved) {
        return { error: `La sauvegarde compte ${saved} joueurs — ajustez le salon (bots) pour correspondre` };
      }
    }
    room.started = true;

    if (snapshot) {
      const remaining = [...room.players];
      const ordered = snapshot.players.map((sp) => {
        const k = remaining.findIndex((p) => p.name === sp.name);
        return k >= 0 ? remaining.splice(k, 1)[0] : null;
      });
      ordered.forEach((slot, i) => { if (!slot) ordered[i] = remaining.shift(); });
      room.players = ordered;
    } else {
      for (let i = room.players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
      }
    }

    room.game = new window.RdmEngine.GameEngine(
      room.code,
      room.players.map((p) => ({
        name: p.name, pawn: p.pawn,
        equippedDice: p.equippedDice || 'classic_dice',
        isBot: p.isBot, difficulty: p.difficulty, honorTitle: p.honorTitle || '',
      }))
    );
    room.players.forEach((p, i) => {
      if (room.game.players[i]) room.game.players[i].id = p.id;
    });
    if (snapshot) room.game.restoreFromSnapshot(snapshot);
    else room.game.addLog(`🎲 Ordre tiré au sort : ${room.players.map((p) => p.name).join(' → ')}`);

    // Enchères : résolution à l'échéance, comme le tick serveur.
    if (!S.tick) {
      S.tick = setInterval(() => {
        const g = S.room?.game;
        if (g?.auction && Date.now() >= g.auction.endTime) {
          g.resolveAuction();
          broadcast();
        }
      }, 700);
    }
    broadcast();
    return { success: true };
  }

  function addBot() {
    const room = S.room;
    if (!room || room.started) return;
    if (room.players.length >= room.maxPlayers) return error('Salon complet');
    const { randomBotName, randomBotPawn } = window.RdmEngine.bot;
    room.players.push({
      id: uuid(), userId: null, isBot: true, difficulty: S.botDifficulty || 'normal',
      name: randomBotName(room.players.map((p) => p.name)),
      pawn: randomBotPawn(), avatar: '🤖', level: 0, ready: true, socketId: null,
    });
    broadcast();
  }

  /* ── API publique ─────────────────────────────────────────────── */
  function start(opts = {}) {
    stop();
    if (!window.RdmEngine) { error('Moteur hors-ligne indisponible'); return false; }
    S.botDifficulty = ['easy', 'hard'].includes(opts.botDifficulty) ? opts.botDifficulty : 'normal';
    const me = {
      id: uuid(), userId: null, isBot: false,
      name: (opts.name || 'Explorateur').slice(0, 20),
      pawn: opts.pawn || 'classic', avatar: opts.avatar || '🧭',
      level: 1, honorTitle: '', ready: true, socketId: null,
    };
    S.playerId = me.id;
    S.room = {
      code: 'LOCAL',
      name: 'Partie hors ligne',
      isPublic: false,
      maxPlayers: 6,
      hostId: me.id,
      started: false,
      game: null,
      players: [me],
    };
    S.active = true;
    addBot(); // un adversaire d'office : la partie est lançable immédiatement
    dispatch('joined', { roomCode: 'LOCAL', playerId: me.id, isHost: true });
    broadcast();
    return true;
  }

  function stop() {
    if (S.botTimer) clearTimeout(S.botTimer);
    if (S.tick) clearInterval(S.tick);
    S.botTimer = null; S.tick = null; S.room = null; S.playerId = null; S.active = false;
  }

  function handle(event, data = {}) {
    const room = S.room;
    const game = room?.game;
    const requireMyTurn = () => {
      if (game.getCurrentPlayer().id !== S.playerId) { error("Ce n'est pas votre tour"); return false; }
      return true;
    };
    switch (event) {
      case 'leave_room': stop(); dispatch('left_room', {}); break;
      case 'toggle_ready': break; // solo : l'hôte est toujours prêt
      case 'add_bot': addBot(); break;
      case 'remove_bot': {
        if (!room || room.started) return;
        const idx = [...room.players].map((p) => p.isBot).lastIndexOf(true);
        if (idx > 0) { room.players.splice(idx, 1); broadcast(); }
        break;
      }
      case 'start_game': {
        const r = startGame(null);
        if (r.error) error(r.error);
        break;
      }
      case 'import_game': {
        if (!room || room.started) return;
        const snap = data.snapshot?.state || data.snapshot;
        if (!snap || !Array.isArray(snap.players)) return error('Fichier de sauvegarde invalide');
        // Ajuste automatiquement le nombre de bots au nombre de sièges sauvegardés.
        while (room.players.length < snap.players.length && room.players.length < 6) addBot();
        while (room.players.length > snap.players.length) room.players.pop();
        const r = startGame(snap);
        if (r.error) error(r.error);
        break;
      }
      case 'roll_dice': {
        if (!game || !requireMyTurn()) return;
        const r = game.rollDice();
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'buy_titles': {
        if (!game) return;
        const r = game.buyTitles(S.playerId, data.titleIds || []);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'pay_royalties': {
        if (!game || !requireMyTurn()) return;
        const r = game.payLandRoyalties(S.playerId);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'buy_joker': case 'skip_joker': case 'use_joker': case 'decline_joker': {
        if (!game) return;
        const fn = { buy_joker: 'buyJoker', skip_joker: 'skipJoker', use_joker: 'useJokerSkip', decline_joker: 'declineJokerUse' }[event];
        const r = game[fn](S.playerId);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'place_bid': {
        if (!game) return;
        const r = game.placeBid(S.playerId, data.amount);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'end_turn': {
        if (!game || !requireMyTurn()) return;
        const r = game.endTurn();
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'surrender': {
        if (!game) return;
        const r = game.surrender(S.playerId);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'propose_alliance': {
        if (!game) return;
        const r = game.proposeAlliance(S.playerId, data.targetId);
        if (r.error) return error(r.error);
        if (r.autoTarget) {
          const prop = game.pendingAlliance;
          const accept = prop && r.autoTarget.money >= prop.taxTo && Math.random() > 0.45;
          game.respondAlliance(r.autoTarget.id, accept);
        }
        broadcast();
        break;
      }
      case 'respond_alliance': {
        if (!game) return;
        const r = game.respondAlliance(S.playerId, !!data.accept);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'break_alliance': {
        if (!game) return;
        const r = game.breakAlliance(S.playerId);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'propose_trade': {
        if (!game) return;
        const r = game.proposeTrade(S.playerId, {
          toId: data.targetId,
          giveTitleIds: data.giveTitleIds || [],
          receiveTitleIds: data.receiveTitleIds || [],
          cash: data.cash || 0,
        });
        if (r.error) return error(r.error);
        if (r.autoTarget) {
          const trade = game.pendingTrade;
          game.respondTrade(r.autoTarget.id, trade ? botEvaluateTrade(game, trade) : false);
        }
        broadcast();
        break;
      }
      case 'respond_trade': {
        if (!game) return;
        const r = game.respondTrade(S.playerId, !!data.accept);
        if (r.error) return error(r.error);
        broadcast();
        break;
      }
      case 'cancel_trade': {
        if (!game) return;
        game.cancelTrade(S.playerId);
        broadcast();
        break;
      }
      default: break; // auth, browse_games, refresh_profile… : sans objet en local
    }
  }

  window.RdmOffline = {
    get active() { return !!S.active; },
    start, stop, handle,
  };
})();
