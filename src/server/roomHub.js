const GameEngine = require('../game/GameEngine');
const { playBotStep, botAuctionBids } = require('../game/bot');
const { getDice } = require('../data/shop');
const { BOT_DELAYS, AUTO_START_COUNTDOWN_MS, MIN_AUTO_START_PLAYERS } = require('./config');

class RoomHub {
  constructor({ accounts, uuidv4 }) {
    this.accounts = accounts;
    this.uuidv4 = uuidv4;
    this.rooms = new Map();
    this.clients = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  getRoomPublic(room) {
    return {
      code: room.code,
      name: room.name,
      isPublic: room.isPublic,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      started: room.started,
      countdownEnd: room.countdownEnd || null,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        pawn: p.pawn,
        avatar: p.avatar,
        level: p.level,
        honorTitle: p.honorTitle || '',
        ready: p.ready,
        isBot: !!p.isBot,
      })),
    };
  }

  listPublicGames() {
    const list = [];
    for (const room of this.rooms.values()) {
      if (room.isPublic && !room.started && room.players.length < room.maxPlayers) {
        list.push({
          code: room.code,
          name: room.name,
          players: room.players.length,
          maxPlayers: room.maxPlayers,
          host: room.players.find((p) => p.id === room.hostId)?.name || '—',
        });
      }
    }
    return list;
  }

  send(ws, event, data) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

  broadcastLobbyList() {
    const list = this.listPublicGames();
    for (const ws of this.clients.values()) {
      if (ws._ctx?.browsing) this.send(ws, 'public_games', list);
    }
  }

  broadcastRoom(room) {
    for (const player of room.players) {
      const ws = this.clients.get(player.socketId);
      if (ws) this.send(ws, 'room_update', this.getRoomPublic(room));
    }
    if (room.game) {
      for (const player of room.players) {
        const ws = this.clients.get(player.socketId);
        if (ws) this.send(ws, 'game_state', room.game.getPublicState(player.id));
      }
      this.awardRewards(room);
      this.maybeScheduleBot(room);
    }
  }

  getBotStepDelay(game) {
    if (game.auction) return BOT_DELAYS.auction;
    if (game.phase === 'rolling' && !game.pendingAction && !game.auction) return BOT_DELAYS.roll;
    if (game.pendingAction && game.diceResult) return BOT_DELAYS.afterRoll;
    if (game.phase === 'end_turn' || (game.phase === 'action' && !game.pendingAction)) {
      return BOT_DELAYS.endTurn;
    }
    return BOT_DELAYS.action;
  }

  maybeScheduleBot(room) {
    if (!room.game || room.game.winner) return;
    if (room.botTimer) return;
    const game = room.game;
    const hasBots = game.players.some((p) => p.isBot && !p.bankrupt);
    if (!hasBots) return;

    if (game.auction) {
      room.botTimer = setTimeout(() => {
        room.botTimer = null;
        const acted = botAuctionBids(game);
        if (acted) this.broadcastRoom(room);
        else this.maybeScheduleBot(room);
      }, BOT_DELAYS.auction);
      return;
    }

    const cp = game.getCurrentPlayer();
    if (cp && cp.isBot && !cp.bankrupt && !game.pendingTrade && !game.pendingAlliance) {
      const delay = this.getBotStepDelay(game);
      room.botTimer = setTimeout(() => {
        room.botTimer = null;
        const acted = playBotStep(game);
        if (acted) this.broadcastRoom(room);
        else this.maybeScheduleBot(room);
      }, delay);
    }
  }

  botEvaluateTrade(game, trade) {
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

  syncAllRoomPlayersFromAccounts(room) {
    for (const p of room.players) {
      if (p.isBot || !p.userId) continue;
      const acc = this.accounts.getById(p.userId);
      if (!acc) continue;
      const profile = this.accounts.getProfile(acc);
      p.equippedDice = profile.equippedDice || 'classic_dice';
      p.pawn = profile.equippedPawn || 'classic';
      p.honorTitle = profile.equippedTitleLabel || '';
      p.level = profile.level;
    }
  }

  applyCosmeticsToGamePlayer(gamePlayer, equippedDice, pawn, honorTitle) {
    if (!gamePlayer) return;
    const diceId = equippedDice || 'classic_dice';
    gamePlayer.equippedDice = diceId;
    gamePlayer.diceStyle = getDice(diceId).style;
    if (pawn) gamePlayer.pawn = pawn;
    if (honorTitle !== undefined) gamePlayer.honorTitle = honorTitle || '';
  }

  syncRoomPlayerCosmetics(room, playerId, ws, refreshCtxFromAccount) {
    if (!room) return;
    const rp = room.players.find((p) => p.id === playerId);
    if (!rp) return;
    refreshCtxFromAccount(ws);
    rp.equippedDice = ws._ctx?.equippedDice || 'classic_dice';
    rp.pawn = ws._ctx?.pawn || rp.pawn;
    rp.honorTitle = ws._ctx?.honorTitle || '';
    if (room.game) {
      const gp = room.game.players.find((p) => p.id === playerId);
      this.applyCosmeticsToGamePlayer(gp, rp.equippedDice, rp.pawn, rp.honorTitle);
    }
  }

  startGame(room, auto = false, snapshot = null) {
    if (!room || room.started) return { error: 'Déjà commencée' };
    if (room.players.length < 2) return { error: 'Minimum 2 joueurs' };
    if (!auto && !room.players.every((p) => p.ready)) {
      return { error: 'Tous les joueurs doivent être prêts' };
    }
    if (snapshot) {
      const saved = Array.isArray(snapshot.players) ? snapshot.players.length : 0;
      if (saved < 2) return { error: 'Sauvegarde invalide' };
      if (room.players.length !== saved) {
        return { error: `La sauvegarde compte ${saved} joueurs — ajustez le salon (bots) pour correspondre` };
      }
    }

    room.started = true;
    room.rewarded = false;
    room.countdownEnd = null;
    this.syncAllRoomPlayersFromAccounts(room);

    if (snapshot) {
      // Import : pas de tirage au sort — chaque siège du salon reprend le
      // siège correspondant de la sauvegarde. Les joueurs dont le nom
      // figure dans la sauvegarde retrouvent leur place, les autres
      // (humains ou bots) comblent les sièges restants dans l'ordre.
      const remaining = [...room.players];
      const ordered = snapshot.players.map((sp) => {
        const k = remaining.findIndex((p) => p.name === sp.name);
        return k >= 0 ? remaining.splice(k, 1)[0] : null;
      });
      ordered.forEach((slot, i) => { if (!slot) ordered[i] = remaining.shift(); });
      room.players = ordered;
    } else {
      // Ordre de jeu aléatoire à chaque partie (Fisher-Yates). On mélange
      // room.players AVANT de créer le moteur pour que room.players et
      // room.game.players restent alignés par index lors du remappage des id.
      for (let i = room.players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
      }
    }

    room.game = new GameEngine(
      room.code,
      room.players.map((p) => ({
        name: p.name,
        pawn: p.pawn,
        equippedDice: p.equippedDice || 'classic_dice',
        isBot: p.isBot,
        honorTitle: p.honorTitle || '',
      }))
    );
    room.players.forEach((p, i) => {
      if (room.game.players[i]) room.game.players[i].id = p.id;
    });
    if (snapshot) {
      room.game.restoreFromSnapshot(snapshot);
    } else {
      room.game.addLog(`🎲 Ordre tiré au sort : ${room.players.map((p) => p.name).join(' → ')}`);
    }
    this.broadcastRoom(room);
    this.broadcastLobbyList();
    return { success: true };
  }

  maybeStartCountdown(room) {
    if (!room || !room.isPublic || room.started) return;
    if (room.players.length >= MIN_AUTO_START_PLAYERS && !room.countdownEnd) {
      room.countdownEnd = Date.now() + AUTO_START_COUNTDOWN_MS;
      this.broadcastRoom(room);
      this.broadcastLobbyList();
    }
  }

  awardRewards(room) {
    if (!room.game || !room.game.winner || room.rewarded) return;
    room.rewarded = true;
    const winnerGameId = room.game.winner.id;
    const opponents = Math.max(1, room.players.length - 1);
    const hasBots = room.players.some((p) => p.isBot);

    const sorted = [...room.game.players].sort((a, b) => (b.money || 0) - (a.money || 0));
    const standings = sorted.map((p) => ({ name: p.name, money: p.money, isBot: !!p.isBot }));

    for (const rp of room.players) {
      if (rp.isBot) continue;
      const acc = rp.userId ? this.accounts.getById(rp.userId) : null;
      if (!acc) continue;
      const isWinner = rp.id === winnerGameId;
      const rank = sorted.findIndex((p) => p.id === rp.id) + 1;
      const reward = this.accounts.applyMatchResult(acc, {
        isWinner,
        opponents,
        hasBots,
        rank: rank || null,
        totalPlayers: sorted.length,
        standings,
      });
      const ws = this.clients.get(rp.socketId);
      if (ws) {
        this.send(ws, 'match_reward', {
          isWinner,
          reward,
          profile: this.accounts.getProfile(acc),
        });
      }
    }
  }

  leaveRoom(ws) {
    const ctx = ws._ctx || {};
    if (!ctx.roomCode) return;
    const room = this.rooms.get(ctx.roomCode);
    ctx.roomCode = null;
    ctx.playerId = null;
    if (!room) return;
    if (room.started) {
      const p = room.players.find((pl) => pl.socketId === ws._id);
      if (p) p.socketId = null;
      return;
    }
    room.players = room.players.filter((p) => p.socketId !== ws._id);
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
    } else {
      if (room.hostId && !room.players.find((p) => p.id === room.hostId)) {
        room.hostId = room.players[0].id;
      }
      this.broadcastRoom(room);
    }
    this.broadcastLobbyList();
  }

  tickRooms() {
    for (const room of this.rooms.values()) {
      if (room.game?.auction && Date.now() >= room.game.auction.endTime) {
        room.game.resolveAuction();
        this.broadcastRoom(room);
      }

      if (room.countdownEnd && !room.started) {
        if (room.players.length < MIN_AUTO_START_PLAYERS) {
          room.countdownEnd = null;
          this.broadcastRoom(room);
          this.broadcastLobbyList();
        } else if (Date.now() >= room.countdownEnd) {
          this.startGame(room, true);
        } else {
          this.broadcastRoom(room);
        }
      }
    }
  }
}

module.exports = { RoomHub };
