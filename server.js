const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const GameEngine = require('./src/game/GameEngine');
const { playBotStep, botAuctionBids, randomBotName, randomBotPawn } = require('./src/game/bot');
const accounts = require('./src/data/accounts');
const { PAWNS, DICE, TITLES, getDice } = require('./src/data/shop');
const { RESOURCES, ROYALTY_THRESHOLDS } = require('./src/data/resources');
const { BATTLE_PASS, PASS_PREMIUM_PRICE, PASS_PREMIUM_EUR } = require('./src/data/progression');

const uuidv4 = () => crypto.randomUUID();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!PUBLIC_URL;
const PUBLIC = path.join(__dirname, 'public');
if (process.env.RDM_USER_DATA && !process.env.RDM_BUNDLE_DATA) {
  process.env.RDM_BUNDLE_DATA = path.join(__dirname, 'data');
}
let publicPlayUrl = null;

function getRequestOrigin(req) {
  if (!req?.headers?.host) return '';
  const proto = (req.headers['x-forwarded-proto'] || (IS_PRODUCTION ? 'https' : 'http')).split(',')[0].trim();
  return `${proto}://${req.headers.host}`.replace(/\/$/, '');
}

function getInviteBaseUrl(req) {
  return PUBLIC_URL || publicPlayUrl || getLanPlayUrl(PORT) || getRequestOrigin(req) || `http://localhost:${PORT}`;
}

function getLanPlayUrl(port) {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${port}`;
      }
    }
  }
  return null;
}

async function startPublicTunnel(port) {
  if (process.env.NO_TUNNEL === '1' || IS_PRODUCTION || PUBLIC_URL) return;
  let localtunnel;
  try {
    localtunnel = require('localtunnel');
  } catch (_) {
    return;
  }
  try {
    const tunnel = await localtunnel({ port });
    publicPlayUrl = tunnel.url.replace(/\/$/, '');
    tunnel.on('close', () => { publicPlayUrl = null; });
    tunnel.on('error', (err) => console.warn('[tunnel]', err?.message || err));
    console.log(`\n🔗 Lien public (amis à distance) : ${publicPlayUrl}`);
    console.log('   (1re visite : cliquer sur « Click to continue » si demandé)\n');
  } catch (err) {
    console.warn('[tunnel] Lien public indisponible — npm install localtunnel pour jouer hors réseau.');
  }
}

// Délais entre les actions des bots (ms) — laisser le temps aux animations client.
const BOT_DELAY_ROLL = 2400;
const BOT_DELAY_AFTER_ROLL = 4800;
const BOT_DELAY_ACTION = 3000;
const BOT_DELAY_END_TURN = 2600;
const BOT_DELAY_AUCTION = 2800;

// Config OAuth Google : variables d'environnement GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET, sinon champs "googleClientId" / "googleClientSecret"
// dans config.json (racine du projet). Vide => bouton Google -> connexion e-mail.
function loadGoogleConfig() {
  let id = (process.env.GOOGLE_CLIENT_ID || '').trim();
  let secret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  let redirectUri = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  try {
    const p = path.join(__dirname, 'config.json');
    if (fs.existsSync(p)) {
      const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (!id) id = (cfg.googleClientId || '').trim();
      if (!secret) secret = (cfg.googleClientSecret || '').trim();
      if (!redirectUri) redirectUri = (cfg.googleRedirectUri || '').trim();
    }
  } catch (_) {}
  return { id, secret, redirectUri };
}

// URI de redirection OAuth — doit correspondre EXACTEMENT à Google Cloud Console.
function getGoogleRedirectUri(req) {
  const { redirectUri } = loadGoogleConfig();
  if (redirectUri) return redirectUri;
  const origin = getRequestOrigin(req);
  if (origin) return `${origin}/api/auth/google/callback`;
  return `http://localhost:${PORT}/api/auth/google/callback`;
}

// États OAuth en attente (anti-CSRF), expirés après 10 min.
const googleStates = new Map();
function newGoogleState() {
  const s = uuidv4();
  googleStates.set(s, Date.now());
  return s;
}
function consumeGoogleState(s) {
  const ts = googleStates.get(s);
  if (!ts) return false;
  googleStates.delete(s);
  return Date.now() - ts < 10 * 60 * 1000;
}

function httpsPostForm(hostname, reqPath, form) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(form).toString();
    const r = https.request(
      { hostname, path: reqPath, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } },
      (resp) => {
        let body = '';
        resp.on('data', (c) => (body += c));
        resp.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (resp.statusCode >= 400) {
              const err = new Error(parsed.error || parsed.error_description || `HTTP ${resp.statusCode}`);
              err.google = parsed;
              reject(err);
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    r.on('error', reject);
    r.write(data);
    r.end();
  });
}

function decodeJwtPayload(jwt) {
  const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(part, 'base64').toString('utf8'));
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const rooms = new Map();
const clients = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateRoomCode() : code;
}

const AUTO_START_COUNTDOWN_MS = 20000;
const MIN_AUTO_START_PLAYERS = 4;

function getRoomPublic(room) {
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

function listPublicGames() {
  const list = [];
  for (const room of rooms.values()) {
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

function broadcastLobbyList() {
  const list = listPublicGames();
  for (const ws of clients.values()) {
    if (ws._ctx?.browsing) send(ws, 'public_games', list);
  }
}

function send(ws, event, data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ event, data }));
  }
}

function broadcastRoom(room) {
  for (const player of room.players) {
    const ws = clients.get(player.socketId);
    if (ws) send(ws, 'room_update', getRoomPublic(room));
  }
  if (room.game) {
    for (const player of room.players) {
      const ws = clients.get(player.socketId);
      if (ws) send(ws, 'game_state', room.game.getPublicState(player.id));
    }
    awardRewards(room);
    maybeScheduleBot(room);
  }
}

function getBotStepDelay(game) {
  if (game.auction) return BOT_DELAY_AUCTION;
  if (game.phase === 'rolling' && !game.pendingAction && !game.auction) return BOT_DELAY_ROLL;
  if (game.pendingAction && game.diceResult) return BOT_DELAY_AFTER_ROLL;
  if (game.phase === 'end_turn' || (game.phase === 'action' && !game.pendingAction)) {
    return BOT_DELAY_END_TURN;
  }
  return BOT_DELAY_ACTION;
}

// Planifie l'action d'un bot (tour courant ou enchère) avec un délai pour l'animation.
function maybeScheduleBot(room) {
  if (!room.game || room.game.winner) return;
  if (room.botTimer) return;
  const game = room.game;
  const hasBots = game.players.some((p) => p.isBot && !p.bankrupt);
  if (!hasBots) return;

  if (game.auction) {
    room.botTimer = setTimeout(() => {
      room.botTimer = null;
      const acted = botAuctionBids(game);
      if (acted) broadcastRoom(room);
      else maybeScheduleBot(room);
    }, BOT_DELAY_AUCTION);
    return;
  }

  const cp = game.getCurrentPlayer();
  if (cp && cp.isBot && !cp.bankrupt && !game.pendingTrade && !game.pendingAlliance) {
    const delay = getBotStepDelay(game);
    room.botTimer = setTimeout(() => {
      room.botTimer = null;
      const acted = playBotStep(game);
      if (acted) broadcastRoom(room);
      else maybeScheduleBot(room);
    }, delay);
  }
}

// Décision d'un bot face à une proposition d'échange (accepte si la valeur reçue >= valeur donnée).
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

function syncAllRoomPlayersFromAccounts(room) {
  for (const p of room.players) {
    if (p.isBot || !p.userId) continue;
    const acc = accounts.getById(p.userId);
    if (!acc) continue;
    const profile = accounts.getProfile(acc);
    p.equippedDice = profile.equippedDice || 'classic_dice';
    p.pawn = profile.equippedPawn || 'classic';
    p.honorTitle = profile.equippedTitleLabel || '';
    p.level = profile.level;
  }
}

function applyCosmeticsToGamePlayer(gamePlayer, equippedDice, pawn) {
  if (!gamePlayer) return;
  const diceId = equippedDice || 'classic_dice';
  gamePlayer.equippedDice = diceId;
  gamePlayer.diceStyle = getDice(diceId).style;
  if (pawn) gamePlayer.pawn = pawn;
}

function syncRoomPlayerCosmetics(room, playerId, ws) {
  if (!room) return;
  const rp = room.players.find((p) => p.id === playerId);
  if (!rp) return;
  refreshCtxFromAccount(ws);
  rp.equippedDice = ws._ctx?.equippedDice || 'classic_dice';
  rp.pawn = ws._ctx?.pawn || rp.pawn;
  rp.honorTitle = ws._ctx?.honorTitle || '';
  if (room.game) {
    const gp = room.game.players.find((p) => p.id === playerId);
    applyCosmeticsToGamePlayer(gp, rp.equippedDice, rp.pawn);
  }
}

// Lance la partie (manuel par l'hôte, ou automatique en fin de compte à rebours).
function startGame(room, auto = false) {
  if (!room || room.started) return { error: 'Déjà commencée' };
  if (room.players.length < 2) return { error: 'Minimum 2 joueurs' };
  if (!auto && !room.players.every((p) => p.ready)) {
    return { error: 'Tous les joueurs doivent être prêts' };
  }

  room.started = true;
  room.rewarded = false;
  room.countdownEnd = null;
  syncAllRoomPlayersFromAccounts(room);
  // Le montant de départ est calculé automatiquement selon le nombre de joueurs (cf. GameEngine)
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
  broadcastRoom(room);
  broadcastLobbyList();
  return { success: true };
}

// Démarre un compte à rebours d'auto-lancement pour les parties publiques dès 4 joueurs.
function maybeStartCountdown(room) {
  if (!room || !room.isPublic || room.started) return;
  if (room.players.length >= MIN_AUTO_START_PLAYERS && !room.countdownEnd) {
    room.countdownEnd = Date.now() + AUTO_START_COUNTDOWN_MS;
    broadcastRoom(room);
    broadcastLobbyList();
  }
}

function awardRewards(room) {
  if (!room.game || !room.game.winner || room.rewarded) return;
  room.rewarded = true;
  const winnerGameId = room.game.winner.id;
  const opponents = Math.max(1, room.players.length - 1);
  const hasBots = room.players.some((p) => p.isBot);

  for (const rp of room.players) {
    if (rp.isBot) continue;
    const acc = rp.userId ? accounts.getById(rp.userId) : null;
    if (!acc) continue;
    const isWinner = rp.id === winnerGameId;
    const reward = accounts.applyMatchResult(acc, { isWinner, opponents, hasBots });
    const ws = clients.get(rp.socketId);
    if (ws) {
      send(ws, 'match_reward', {
        isWinner,
        reward,
        profile: accounts.getProfile(acc),
      });
    }
  }
}

// ---------- API HTTP ----------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function authFromReq(req, body) {
  const token = req.headers['x-auth-token'] || body.token;
  if (!token) return null;
  return accounts.getUserByToken(token);
}

async function handleApi(req, res, urlPath) {
  const method = req.method;

  // Données statiques (sans auth)
  if (method === 'GET' && urlPath === '/api/config') {
    const { id, secret, redirectUri } = loadGoogleConfig();
    return sendJson(res, 200, {
      googleEnabled: !!(id && secret),
      googleClientId: id || '',
      googleRedirectUri: redirectUri || `${getRequestOrigin(req) || `http://localhost:${PORT}`}/api/auth/google/callback`,
    });
  }
  if (method === 'GET' && urlPath === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'richesses-du-monde' });
  }
  if (method === 'GET' && urlPath === '/api/play-url') {
    const localUrl = getRequestOrigin(req) || `http://localhost:${PORT}`;
    const lanUrl = IS_PRODUCTION ? null : getLanPlayUrl(PORT);
    const inviteBase = getInviteBaseUrl(req);
    return sendJson(res, 200, {
      local: localUrl,
      lan: lanUrl,
      public: PUBLIC_URL || publicPlayUrl,
      inviteBase,
    });
  }
  if (method === 'GET' && urlPath === '/api/resources') {
    const resources = {};
    for (const [id, r] of Object.entries(RESOURCES)) {
      resources[id] = { name: r.name, color: r.color, titles: r.titles, royalties: r.royalties };
    }
    return sendJson(res, 200, { resources, royaltyThresholds: ROYALTY_THRESHOLDS });
  }

  // --- OAuth Google : flux par redirection serveur (pas de popup) ---
  if (method === 'GET' && urlPath === '/api/auth/google/info') {
    const { id, redirectUri } = loadGoogleConfig();
    const uri = redirectUri || getGoogleRedirectUri(req);
    return sendJson(res, 200, {
      clientId: id,
      redirectUri: uri,
      jsOrigin: getRequestOrigin(req) || 'http://localhost:3000',
      consoleUrl: 'https://console.cloud.google.com/apis/credentials',
    });
  }
  if (method === 'GET' && urlPath === '/api/auth/google/start') {
    const { id, secret } = loadGoogleConfig();
    if (!id || !secret) return redirect(res, '/?google_error=unconfigured');
    const redirectUri = getGoogleRedirectUri(req);
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: newGoogleState(),
      access_type: 'online',
      prompt: 'select_account',
    });
    return redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }
  if (method === 'GET' && urlPath === '/api/auth/google/callback') {
    const u = new URL(req.url, `http://${req.headers.host}`);
    if (u.searchParams.get('error')) return redirect(res, '/?google_error=denied');
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    if (!code) return redirect(res, '/?google_error=code');
    // Valide le state uniquement s'il a été émis par notre serveur (/start).
    if (state && googleStates.has(state) && !consumeGoogleState(state)) {
      return redirect(res, '/?google_error=state');
    }
    const { id, secret } = loadGoogleConfig();
    try {
      const redirectUri = getGoogleRedirectUri(req);
      const tok = await httpsPostForm('oauth2.googleapis.com', '/token', {
        code,
        client_id: id,
        client_secret: secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      if (!tok || !tok.id_token) return redirect(res, '/?google_error=token');
      const claims = decodeJwtPayload(tok.id_token);
      const email = (claims.email || '').toLowerCase();
      if (!email) return redirect(res, '/?google_error=email');
      const name = (claims.name || email.split('@')[0]).toString().slice(0, 20);
      let result = accounts.getOrCreateByProvider('google', email, name);
      if (result.error === 'pseudo_taken') {
        result = accounts.getOrCreateByProvider('google', email, email.split('@')[0].slice(0, 20));
      }
      if (result.error) return redirect(res, '/?google_error=exchange');
      const sessionToken = accounts.createSession(result.account.id);
      return redirect(res, `/?token=${encodeURIComponent(sessionToken)}`);
    } catch (e) {
      console.error('Google OAuth exchange failed:', e.message, e.google || '');
      const gErr = e.google?.error || '';
      if (gErr === 'redirect_uri_mismatch') return redirect(res, '/?google_error=redirect_uri_mismatch');
      return redirect(res, '/?google_error=exchange');
    }
  }
  if (method === 'GET' && urlPath === '/api/shop') {
    return sendJson(res, 200, { pawns: PAWNS, dice: DICE, titles: TITLES });
  }
  if (method === 'GET' && urlPath === '/api/battlepass') {
    return sendJson(res, 200, { tiers: BATTLE_PASS, premiumPrice: PASS_PREMIUM_PRICE, premiumEur: PASS_PREMIUM_EUR });
  }

  if (method !== 'POST') {
    return sendJson(res, 404, { error: 'Route inconnue' });
  }

  const body = await readBody(req);

  switch (urlPath) {
    case '/api/auth/email': {
      const email = (body.email || body.sub || '').toString().trim().toLowerCase().slice(0, 64);
      if (!accounts.isValidEmail(email)) {
        return sendJson(res, 400, { error: 'Adresse e-mail invalide', code: 'invalid_email' });
      }
      const name = (body.displayName || email.split('@')[0]).toString().slice(0, 20);
      const result = accounts.getOrCreateByProvider('email', email, name);
      if (result.error === 'pseudo_taken') {
        return sendJson(res, 400, { error: 'Ce pseudo est déjà utilisé', code: 'pseudo_taken' });
      }
      const token = accounts.createSession(result.account.id);
      return sendJson(res, 200, { token, profile: accounts.getProfile(result.account) });
    }
    case '/api/auth/guest': {
      const sub = (body.sub || '').toString().slice(0, 64) || uuidv4();
      let name = (body.displayName || 'Invité').toString().slice(0, 20);
      if (!accounts.getByProvider('guest', sub) && accounts.isDisplayNameTaken(name)) {
        name = `Invité ${sub.replace(/-/g, '').slice(0, 5)}`;
      }
      const result = accounts.getOrCreateByProvider('guest', sub, name);
      if (result.error) {
        return sendJson(res, 400, { error: 'Impossible de créer le compte invité', code: result.error });
      }
      const token = accounts.createSession(result.account.id);
      return sendJson(res, 200, { token, profile: accounts.getProfile(result.account) });
    }
    case '/api/auth/session': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Session expirée' });
      return sendJson(res, 200, { profile: accounts.getProfile(acc) });
    }
    case '/api/auth/logout': {
      const token = req.headers['x-auth-token'] || body.token;
      if (token) accounts.destroySession(token);
      return sendJson(res, 200, { ok: true });
    }
    case '/api/profile/rename': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const result = accounts.setDisplayName(acc, body.displayName, { initial: !acc.pseudoChosen });
      if (result.error) {
        const status = result.error === 'rename_limit' ? 429 : 400;
        const messages = {
          name_short: 'Nom trop court',
          same_name: 'Ce pseudo est déjà le vôtre',
          pseudo_taken: 'Ce pseudo est déjà utilisé',
          rename_limit: 'Limite de renommages atteinte (2 par mois)',
        };
        return sendJson(res, status, {
          error: messages[result.error] || result.error,
          code: result.error,
          remaining: result.remaining,
          limit: result.limit,
        });
      }
      return sendJson(res, 200, { profile: accounts.getProfile(result.account) });
    }
    case '/api/shop/buy': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const r = accounts.buyCosmetic(acc, body.itemId || body.pawnId);
      if (r.error) return sendJson(res, 400, { error: r.error });
      return sendJson(res, 200, { profile: accounts.getProfile(acc) });
    }
    case '/api/shop/equip': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const r = accounts.equipCosmetic(acc, body.itemId || body.pawnId);
      if (r.error) return sendJson(res, 400, { error: r.error });
      return sendJson(res, 200, { profile: accounts.getProfile(acc) });
    }
    case '/api/battlepass/claim': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const r = accounts.claimPassReward(acc, Number(body.tier), body.track);
      if (r.error) return sendJson(res, 400, { error: r.error });
      return sendJson(res, 200, { profile: accounts.getProfile(acc), reward: r.reward });
    }
    case '/api/battlepass/buy-premium': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const r = accounts.buyPremiumPass(acc);
      if (r.error) return sendJson(res, 400, { error: r.error });
      return sendJson(res, 200, { profile: accounts.getProfile(acc) });
    }
    case '/api/promo/redeem': {
      const acc = authFromReq(req, body);
      if (!acc) return sendJson(res, 401, { error: 'Non authentifié' });
      const r = accounts.redeemPromo(acc, body.code);
      if (r.error) return sendJson(res, 400, { error: r.error });
      return sendJson(res, 200, { profile: accounts.getProfile(acc), result: r });
    }
    default:
      return sendJson(res, 404, { error: 'Route inconnue' });
  }
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(PUBLIC, urlPath);

  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------- Matchmaking helpers ----------
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

function leaveCurrentRoom(ws) {
  const ctx = ws._ctx || {};
  if (!ctx.roomCode) return;
  const room = rooms.get(ctx.roomCode);
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
    rooms.delete(room.code);
  } else {
    if (room.hostId && !room.players.find((p) => p.id === room.hostId)) {
      room.hostId = room.players[0].id;
    }
    broadcastRoom(room);
  }
  broadcastLobbyList();
}

// ---------- WebSocket handlers ----------
function handleMessage(ws, msg) {
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
        const room = rooms.get(ctx.roomCode);
        if (room) {
          syncRoomPlayerCosmetics(room, ctx.playerId, ws);
          broadcastRoom(room);
        }
      }
      break;
    }

    case 'browse_games': {
      ctx.browsing = true;
      ws._ctx = ctx;
      send(ws, 'public_games', listPublicGames());
      break;
    }

    case 'stop_browse': {
      ctx.browsing = false;
      ws._ctx = ctx;
      break;
    }

    case 'create_room': {
      if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
      leaveCurrentRoom(ws);
      refreshCtxFromAccount(ws);
      const code = generateRoomCode();
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
      rooms.set(code, room);
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
      const room = rooms.get(code);
      if (!room) return send(ws, 'error_msg', 'Salon introuvable');
      if (room.started) return send(ws, 'error_msg', 'Partie déjà commencée');
      if (room.players.length >= room.maxPlayers) return send(ws, 'error_msg', 'Salon complet');

      leaveCurrentRoom(ws);
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
      maybeStartCountdown(room);
      break;
    }

    case 'quick_match': {
      if (!ctx.userId) return send(ws, 'error_msg', 'Connexion requise');
      leaveCurrentRoom(ws);
      refreshCtxFromAccount(ws);

      // Cherche une partie publique ouverte avec de la place
      let room = null;
      for (const r of rooms.values()) {
        if (r.isPublic && !r.started && r.players.length < r.maxPlayers) {
          room = r;
          break;
        }
      }

      const player = makeRoomPlayer(ws);

      if (!room) {
        const code = generateRoomCode();
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
        rooms.set(code, room);
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
      maybeStartCountdown(room);
      break;
    }

    case 'leave_room': {
      leaveCurrentRoom(ws);
      send(ws, 'left_room', {});
      break;
    }

    case 'toggle_ready': {
      const room = rooms.get(ctx.roomCode);
      if (!room || room.started) return;
      const player = room.players.find((p) => p.id === ctx.playerId);
      if (player) {
        player.ready = !player.ready;
        broadcastRoom(room);
      }
      break;
    }

    case 'start_game': {
      const room = rooms.get(ctx.roomCode);
      if (!room || room.hostId !== ctx.playerId) return;
      const r = startGame(room, false);
      if (r.error) return send(ws, 'error_msg', r.error);
      break;
    }

    case 'add_bot': {
      const room = rooms.get(ctx.roomCode);
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
      });
      broadcastRoom(room);
      broadcastLobbyList();
      break;
    }

    case 'remove_bot': {
      const room = rooms.get(ctx.roomCode);
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
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const r = room.game.proposeAlliance(ctx.playerId, data.targetId);
      if (r.error) return send(ws, 'error_msg', r.error);
      if (r.autoTarget) {
        // Le bot décide tout de suite
        const prop = room.game.pendingAlliance;
        const accept = prop && r.autoTarget.money >= prop.taxTo && Math.random() > 0.45;
        room.game.respondAlliance(r.autoTarget.id, accept);
      }
      broadcastRoom(room);
      break;
    }

    case 'respond_alliance': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const r = room.game.respondAlliance(ctx.playerId, !!data.accept);
      if (r.error) return send(ws, 'error_msg', r.error);
      broadcastRoom(room);
      break;
    }

    case 'break_alliance': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const r = room.game.breakAlliance(ctx.playerId);
      if (r.error) return send(ws, 'error_msg', r.error);
      broadcastRoom(room);
      break;
    }

    case 'propose_trade': {
      const room = rooms.get(ctx.roomCode);
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
        const accept = trade ? botEvaluateTrade(room.game, trade) : false;
        room.game.respondTrade(r.autoTarget.id, accept);
      }
      broadcastRoom(room);
      break;
    }

    case 'respond_trade': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const r = room.game.respondTrade(ctx.playerId, !!data.accept);
      if (r.error) return send(ws, 'error_msg', r.error);
      broadcastRoom(room);
      break;
    }

    case 'cancel_trade': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      room.game.cancelTrade(ctx.playerId);
      broadcastRoom(room);
      break;
    }

    case 'roll_dice': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const cp = room.game.getCurrentPlayer();
      if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
      const result = room.game.rollDice();
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'buy_titles': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.buyTitles(ctx.playerId, data.titleIds || []);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'pay_royalties': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const cp = room.game.getCurrentPlayer();
      if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
      const result = room.game.payLandRoyalties(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'buy_joker': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.buyJoker(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'skip_joker': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.skipJoker(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'use_joker': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.useJokerSkip(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'decline_joker': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.declineJokerUse(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'place_bid': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.placeBid(ctx.playerId, data.amount);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'end_turn': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const cp = room.game.getCurrentPlayer();
      if (cp.id !== ctx.playerId) return send(ws, 'error_msg', "Ce n'est pas votre tour");
      const result = room.game.endTurn();
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }

    case 'surrender': {
      const room = rooms.get(ctx.roomCode);
      if (!room?.game) return;
      const result = room.game.surrender(ctx.playerId);
      if (result.error) return send(ws, 'error_msg', result.error);
      broadcastRoom(room);
      break;
    }
  }
}

function handleDisconnect(ws) {
  const ctx = ws._ctx || {};
  clients.delete(ws._id);
  if (!ctx.roomCode) return;
  const room = rooms.get(ctx.roomCode);
  if (!room) return;
  const player = room.players.find((p) => p.id === ctx.playerId);
  if (player) player.socketId = null;

  if (!room.started) {
    room.players = room.players.filter((p) => p.id !== ctx.playerId);
    if (room.players.length === 0) {
      rooms.delete(ctx.roomCode);
    } else {
      if (room.hostId === ctx.playerId) room.hostId = room.players[0].id;
      broadcastRoom(room);
    }
    broadcastLobbyList();
  }
}

// Minimal WebSocket server (RFC 6455)
function acceptWebSocket(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  const wsId = uuidv4();
  const ws = {
    _id: wsId,
    _ctx: {},
    readyState: 1,
    socket,
    send(data) {
      const payload = Buffer.from(data);
      const len = payload.length;
      let header;
      if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81;
        header[1] = len;
      } else if (len < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
      }
      socket.write(Buffer.concat([header, payload]));
    },
  };

  clients.set(wsId, ws);
  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const opcode = buffer[0] & 0x0f;
      const masked = (buffer[1] & 0x80) !== 0;
      let payloadLen = buffer[1] & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < 4) return;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buffer.length < 10) return;
        payloadLen = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskOffset = masked ? 4 : 0;
      const frameLen = offset + maskOffset + payloadLen;
      if (buffer.length < frameLen) return;

      let payload = buffer.slice(offset + maskOffset, frameLen);
      if (masked) {
        const mask = buffer.slice(offset, offset + 4);
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= mask[i % 4];
        }
      }
      buffer = buffer.slice(frameLen);

      if (opcode === 0x8) {
        ws.readyState = 3;
        socket.end();
        handleDisconnect(ws);
        return;
      }
      if (opcode === 0x1) {
        try {
          handleMessage(ws, JSON.parse(payload.toString()));
        } catch (e) {
          /* ignore malformed */
        }
      }
    }
  });

  socket.on('close', () => {
    ws.readyState = 3;
    handleDisconnect(ws);
  });

  socket.on('error', () => {
    ws.readyState = 3;
    handleDisconnect(ws);
  });
}

const server = http.createServer((req, res) => {
  if (req.headers.upgrade?.toLowerCase() === 'websocket') return;
  const urlPath = req.url.split('?')[0];
  if (urlPath.startsWith('/api/')) {
    handleApi(req, res, urlPath).catch(() => sendJson(res, 500, { error: 'Erreur serveur' }));
    return;
  }
  serveStatic(req, res);
});

server.on('upgrade', acceptWebSocket);

setInterval(() => {
  try {
  for (const room of rooms.values()) {
    if (room.game?.auction && Date.now() >= room.game.auction.endTime) {
      room.game.resolveAuction();
      broadcastRoom(room);
    }

    // Compte à rebours d'auto-lancement (parties publiques, 4+ joueurs)
    if (room.countdownEnd && !room.started) {
      if (room.players.length < MIN_AUTO_START_PLAYERS) {
        room.countdownEnd = null;
        broadcastRoom(room);
        broadcastLobbyList();
      } else if (Date.now() >= room.countdownEnd) {
        startGame(room, true);
      } else {
        broadcastRoom(room); // met à jour le minuteur affiché
      }
    }
  }
  } catch (err) {
    console.error('[loop]', err && err.stack ? err.stack : err);
  }
}, 1000);

server.listen(PORT, HOST, () => {
  const lan = IS_PRODUCTION ? null : getLanPlayUrl(PORT);
  console.log(`\n🌍 Richesses du Monde — écoute sur ${HOST}:${PORT}`);
  if (PUBLIC_URL) console.log(`🌐 URL publique : ${PUBLIC_URL}`);
  else if (!IS_PRODUCTION) console.log(`   Local : http://localhost:${PORT}`);
  if (lan) console.log(`📱 Même Wi-Fi : ${lan}`);
  console.log('');
  startPublicTunnel(Number(PORT));
});

// Garde-fous : on journalise les erreurs imprévues sans jamais arrêter le serveur,
// afin que le jeu reste disponible pour les tests.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
