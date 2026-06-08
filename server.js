const http = require('http');
const accounts = require('./src/data/accounts');
const config = require('./src/server/config');
const { sendJson, getRequestOrigin, getLanPlayUrl, createStaticHandler } = require('./src/server/httpUtils');
const { createApiHandler } = require('./src/server/api');
const { RoomHub } = require('./src/server/roomHub');
const { createWsHandlers } = require('./src/server/wsHandlers');
const { createWsUpgrade } = require('./src/server/wsUpgrade');
const { uuidv4 } = require('./src/server/googleAuth');

const { PORT, HOST, PUBLIC_URL, IS_PRODUCTION, PUBLIC } = config;

const publicPlayUrlRef = { current: null };

function getInviteBaseUrl(req) {
  return PUBLIC_URL || publicPlayUrlRef.current || getLanPlayUrl(PORT) || getRequestOrigin(req, IS_PRODUCTION) || `http://localhost:${PORT}`;
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
    publicPlayUrlRef.current = tunnel.url.replace(/\/$/, '');
    tunnel.on('close', () => { publicPlayUrlRef.current = null; });
    tunnel.on('error', (err) => console.warn('[tunnel]', err?.message || err));
    console.log(`\n🔗 Lien public (amis à distance) : ${publicPlayUrlRef.current}`);
    console.log('   (1re visite : cliquer sur « Click to continue » si demandé)\n');
  } catch (err) {
    console.warn('[tunnel] Lien public indisponible — npm install localtunnel pour jouer hors réseau.');
  }
}

const hub = new RoomHub({ accounts, uuidv4 });
const wsHandlers = createWsHandlers(hub, accounts, uuidv4);
const acceptWebSocket = createWsUpgrade(hub, wsHandlers, uuidv4);
const handleApi = createApiHandler({ accounts, config, getInviteBaseUrl, publicPlayUrlRef });
const serveStatic = createStaticHandler(PUBLIC);

const server = http.createServer((req, res) => {
  if (req.headers.upgrade?.toLowerCase() === 'websocket') return;
  const urlPath = req.url.split('?')[0];
  if (urlPath.startsWith('/api/')) {
    handleApi(req, res, urlPath).catch(() => sendJson(res, 500, { error: 'Erreur serveur', code: 'server_error' }));
    return;
  }
  serveStatic(req, res);
});

server.on('upgrade', acceptWebSocket);

setInterval(() => {
  try {
    hub.tickRooms();
  } catch (err) {
    console.error('[loop]', err && err.stack ? err.stack : err);
  }
}, 1000);

// Keep-alive : évite la mise en veille Render (offre gratuite → 15 min)
// En production, on se ping nous-même toutes les 10 minutes.
if (IS_PRODUCTION) {
  const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 min
  setInterval(() => {
    const selfUrl = PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
    if (!selfUrl) return;
    const https = require('https');
    const url = `${selfUrl}/api/health`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) console.warn(`[keep-alive] ping ${res.statusCode}`);
    }).on('error', (err) => console.warn('[keep-alive] erreur:', err.message));
  }, PING_INTERVAL_MS);
  console.log('⏱  Keep-alive activé (ping toutes les 10 min)');
}

server.listen(PORT, HOST, () => {
  const lan = IS_PRODUCTION ? null : getLanPlayUrl(PORT);
  console.log(`\n🌍 Richesses du Monde — écoute sur ${HOST}:${PORT}`);
  if (PUBLIC_URL) console.log(`🌐 URL publique : ${PUBLIC_URL}`);
  else if (!IS_PRODUCTION) console.log(`   Local : http://localhost:${PORT}`);
  if (lan) console.log(`📱 Même Wi-Fi : ${lan}`);
  console.log('');
  startPublicTunnel(Number(PORT));
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
