const { randomBotName, randomBotPawn, normalizeDifficulty } = require('../game/bot');

function createWsHandlers(hub, accounts, uuidv4) {
  const { send, broadcastRoom, broadcastLobbyList } = {
    send: (...args) => hub.send(...args),
    broadcastRoom: (...args) => hub.broadcastRoom(...args),
    broadcastLobbyList: (...args) => hub.broadcastLobbyList(...args),
  };

  function makeRoomPlayer(ws) {
    const ctx = ws._ctx || {};
    return {
      id: uuidv4(),
      userId: ctx.userId || null,
      name: ctx.profileName || 'Joueur',
      pawn: ctx.pawn || 'classic',
      equippedDice: ctx.equippedDice || 'classic_dice',
      avatar: ctx.avatar || '🙂',
      level: ctx.level || 1,
      honorTitle: ctx.honorTitle || '',
      ready: false,
      socketId: ws._id,
    };
  }

  function refreshCtxFromAccount(ws) {
    const ctx = ws._ctx || {};
    const acc = ctx.userId ? accounts.getById(ctx.userId) : null;
    if (acc) {
      const profile = accounts.getProfile(acc);
      ctx.profileName = profile.displayName;
      ctx.pawn = profile.equippedPawn;
      ctx.equippedDice = profile.equippedDice || 'classic_dice';
      ctx.avatar = profile.avatar;
      ctx.level = profile.level;
      ctx.honorTitle = profile.equippedTitleLabel || '';
    }
    ws._ctx = ctx;
  }

  function handleMessage(ws, msg) {
    if (!msg || typeof msg.event !== 'string') return;
    const { event, data = {} } = msg;
    const ctx = ws._ctx || {};

    switch (event) {
      case 'auth': {
        const acc = accounts.getUserByToken(data.token);
        if (!acc) return send(ws, 'auth_failed', {});
        ctx.userId = acc.id;
        ws._ctx = ctx;
        refreshCtxFromAccount(ws);
        send(ws, 'auth_ok', { profile: accounts.getProfile(acc) });
        break;
      }

      case 'refresh_profile': {
        refreshCtxFromAccount(ws);
        const acc = ctx.userId ? accounts.getById(ctx.userId) : null;
        if (acc) send(ws, 'profile_update', { profile: accounts.getProfile(acc) });
        if (ctx.roomCode && ctx.playerId) {
          const room = hub.rooms.get(ctx.roomCode);
          if (room) {
            hub.syncRoomPlayerCosmetics(room, ctx.playerId, ws, refreshCtxFromAccount);
            broadcastRoom(room);
          }
        }
        break;
      }

      case 'browse_games': {
        ctx.browsing = true;
        ws._ctx = ctx;
        send(ws, 'public_games', hub.listPublicGames());
        break;
      }

      case 'stop_browse': {
        ctx.browsing = false;
        ws._ctx = ctx;
        break;
      }

      case 'create_room': {
        if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
        hub.leaveRoom(ws);
        refreshCtxFromAccount(ws);
        const code = hub.generateRoomCode();
        const isPublic = !!data.isPublic;
        const maxPlayers = Math.min(6, Math.max(2, Number(data.maxPlayers) || 6));
        const hostPlayer = makeRoomPlayer(ws);
        hostPlayer.ready = true;
        const room = {
          code,
          name: (data.roomName || `Partie de ${hostPlayer.name}`).slice(0, 30),
          isPublic,
          maxPlayers,
          hostId: hostPlayer.id,
          started: false,
          rewarded: false,
          game: null,
          players: [hostPlayer],
        };
        hub.rooms.set(code, room);
        ctx.roomCode = code;
        ctx.playerId = hostPlayer.id;
        ctx.browsing = false;
        ws._ctx = ctx;
        send(ws, 'joined', { roomCode: code, playerId: hostPlayer.id, isHost: true });
        broadcastRoom(room);
        broadcastLobbyList();
        break;
      }

      case 'join_room': {
        if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
        const code = (data.roomCode || '').toUpperCase().trim();
        const room = hub.rooms.get(code);
        if (!room) return send(ws, 'error_msg', 'Salon introuvable');
        if (room.started) return send(ws, 'error_msg', 'Partie déjà commencée');
        if (room.players.length >= room.maxPlayers) return send(ws, 'error_msg', 'Salon complet');

        hub.leaveRoom(ws);
        refreshCtxFromAccount(ws);
        const player = makeRoomPlayer(ws);
        room.players.push(player);
        ctx.roomCode = code;
        ctx.playerId = player.id;
        ctx.browsing = false;
        ws._ctx = ctx;
        send(ws, 'joined', { roomCode: code, playerId: player.id, isHost: false });
        broadcastRoom(room);
        broadcastLobbyList();
        hub.maybeStartCountdown(room);
        break;
      }

      case 'rejoin_room': {
        if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
        const code = (data.roomCode || '').toUpperCase().trim();
        const playerId = data.playerId;
        const room = hub.rooms.get(code);
        if (!room || !room.started) return;
        const player = room.players.find((p) => p.id === playerId);
        if (!player) return;
        if (player.userId && player.userId !== ctx.userId) return send(ws, 'error_msg', 'Reprise impossible');
        hub.leaveRoom(ws);
        refreshCtxFromAccount(ws);
        player.socketId = ws._id;
        player.name = ctx.profileName || player.name;
        player.pawn = ctx.pawn || player.pawn;
        player.equippedDice = ctx.equippedDice || player.equippedDice;
        player.honorTitle = ctx.honorTitle || player.honorTitle;
        ctx.roomCode = code;
        ctx.playerId = player.id;
        ctx.browsing = false;
        ws._ctx = ctx;
        if (room.game) {
          const gp = room.game.players.find((p) => p.id === player.id);
          hub.applyCosmeticsToGamePlayer(gp, player.equippedDice, player.pawn, player.honorTitle);
        }
        send(ws, 'joined', { roomCode: code, playerId: player.id, isHost: room.hostId === player.id, rejoined: true });
        send(ws, 'room_update', hub.getRoomPublic(room));
        if (room.game) send(ws, 'game_state', room.game.getPublicState(player.id));
        break;
      }

      case 'quick_match': {
        if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
        hub.leaveRoom(ws);
        refreshCtxFromAccount(ws);

        let room = null;
        for (const r of hub.rooms.values()) {
          if (r.isPublic && !r.started && r.players.length < r.maxPlayers) {
            room = r;
            break;
          }
        }

        const player = makeRoomPlayer(ws);

        if (!room) {
          const code = hub.generateRoomCode();
          player.ready = true;
          room = {
            code,
            name: `Partie rapide de ${player.name}`,
            isPublic: true,
            maxPlayers: 6,
            hostId: player.id,
            started: false,
            rewarded: false,
            game: null,
            players: [player],
          };
          hub.rooms.set(code, room);
          send(ws, 'joined', { roomCode: code, playerId: player.id, isHost: true });
        } else {
          room.players.push(player);
          send(ws, 'joined', { roomCode: room.code, playerId: player.id, isHost: false });
        }

        ctx.roomCode = room.code;
        ctx.playerId = player.id;
        ctx.browsing = false;
        ws._ctx = ctx;
        broadcastRoom(room);
        broadcastLobbyList();
        hub.maybeStartCountdown(room);
        break;
      }

      case 'leave_room': {
        hub.leaveRoom(ws);
        send(ws, 'left_room', {});
        break;
      }

      case 'toggle_ready': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room || room.started) return;
        const player = room.players.find((p) => p.id === ctx.playerId);
        if (player) {
          player.ready = !player.ready;
          broadcastRoom(room);
        }
        break;
      }

      case 'start_game': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room || room.hostId !== ctx.playerId) return;
        const r = hub.startGame(room, false);
        if (r.error) return send(ws, 'error_msg', r.error);
        break;
      }

      case 'import_game': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room || room.started || room.hostId !== ctx.playerId) return;
        // Accepte l'export complet du bouton 💾 ({exportedAt, state}) ou l'état seul.
        const snap = data.snapshot?.state || data.snapshot;
        if (!snap || !Array.isArray(snap.players)) {
          return send(ws, 'error_msg', 'Fichier de sauvegarde invalide');
        }
        const r = hub.startGame(room, true, snap);
        if (r.error) return send(ws, 'error_msg', r.error);
        break;
      }

      case 'add_bot': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room || room.started || room.hostId !== ctx.playerId) return;
        if (room.players.length >= room.maxPlayers) return send(ws, 'error_msg', 'Salon complet');
        const usedNames = room.players.map((p) => p.name);
        room.players.push({
          id: uuidv4(),
          userId: null,
          isBot: true,
          name: randomBotName(usedNames),
          pawn: randomBotPawn(),
          avatar: '🤖',
          level: 0,
          ready: true,
          socketId: null,
          difficulty: normalizeDifficulty(data.difficulty),
        });
        broadcastRoom(room);
        broadcastLobbyList();
        break;
      }

      case 'remove_bot': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room || room.started || room.hostId !== ctx.playerId) return;
        const botId = data.botId;
        const idx = botId
          ? room.players.findIndex((p) => p.isBot && p.id === botId)
          : [...room.players].reverse().findIndex((p) => p.isBot);
        const realIdx = botId ? idx : (idx >= 0 ? room.players.length - 1 - idx : -1);
        if (realIdx >= 0) {
          room.players.splice(realIdx, 1);
          broadcastRoom(room);
          broadcastLobbyList();
        }
        break;
      }

      case 'propose_alliance': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const r = room.game.proposeAlliance(ctx.playerId, data.targetId);
        if (r.error) return send(ws, 'error_msg', r.error);
        if (r.autoTarget) {
          const prop = room.game.pendingAlliance;
          const accept = prop && r.autoTarget.money >= prop.taxTo && Math.random() > 0.45;
          room.game.respondAlliance(r.autoTarget.id, accept);
        }
        broadcastRoom(room);
        break;
      }

      case 'respond_alliance': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const r = room.game.respondAlliance(ctx.playerId, !!data.accept);
        if (r.error) return send(ws, 'error_msg', r.error);
        broadcastRoom(room);
        break;
      }

      case 'break_alliance': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const r = room.game.breakAlliance(ctx.playerId);
        if (r.error) return send(ws, 'error_msg', r.error);
        broadcastRoom(room);
        break;
      }

      case 'propose_trade': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const r = room.game.proposeTrade(ctx.playerId, {
          toId: data.targetId,
          giveTitleIds: data.giveTitleIds || [],
          receiveTitleIds: data.receiveTitleIds || [],
          cash: data.cash || 0,
        });
        if (r.error) return send(ws, 'error_msg', r.error);
        if (r.autoTarget) {
          const trade = room.game.pendingTrade;
          const accept = trade ? hub.botEvaluateTrade(room.game, trade) : false;
          room.game.respondTrade(r.autoTarget.id, accept);
        }
        broadcastRoom(room);
        break;
      }

      case 'respond_trade': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const r = room.game.respondTrade(ctx.playerId, !!data.accept);
        if (r.error) return send(ws, 'error_msg', r.error);
        broadcastRoom(room);
        break;
      }

      case 'cancel_trade': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        room.game.cancelTrade(ctx.playerId);
        broadcastRoom(room);
        break;
      }

      case 'roll_dice': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const cp = room.game.getCurrentPlayer();
        if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
        const result = room.game.rollDice();
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'buy_titles': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.buyTitles(ctx.playerId, data.titleIds || []);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'pay_royalties': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const cp = room.game.getCurrentPlayer();
        if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
        const result = room.game.payLandRoyalties(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'buy_joker': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.buyJoker(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'skip_joker': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.skipJoker(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'use_joker': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.useJokerSkip(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'decline_joker': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.declineJokerUse(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'place_bid': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.placeBid(ctx.playerId, data.amount);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'end_turn': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const cp = room.game.getCurrentPlayer();
        if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
        const result = room.game.endTurn();
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      case 'surrender': {
        const room = hub.rooms.get(ctx.roomCode);
        if (!room?.game) return;
        const result = room.game.surrender(ctx.playerId);
        if (result.error) return send(ws, 'error_msg', result.error);
        broadcastRoom(room);
        break;
      }

      default:
        break;
    }
  }

  function handleDisconnect(ws) {
    const ctx = ws._ctx || {};
    hub.clients.delete(ws._id);
    if (!ctx.roomCode) return;
    const room = hub.rooms.get(ctx.roomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === ctx.playerId);
    if (player) player.socketId = null;

    if (!room.started) {
      room.players = room.players.filter((p) => p.id !== ctx.playerId);
      if (room.players.length === 0) {
        hub.rooms.delete(ctx.roomCode);
      } else {
        if (room.hostId === ctx.playerId) room.hostId = room.players[0].id;
        broadcastRoom(room);
      }
      broadcastLobbyList();
    }
  }

  return { handleMessage, handleDisconnect };
}

module.exports = { createWsHandlers };
