const { PAWNS, DICE, TITLES } = require('../data/shop');
const { RESOURCES, ROYALTY_THRESHOLDS } = require('../data/resources');
const { BATTLE_PASS, PASS_PREMIUM_PRICE, PASS_PREMIUM_EUR } = require('../data/progression');
const {
  sendJson,
  redirect,
  readBody,
  getRequestOrigin,
  getLanPlayUrl,
  requireAuth,
} = require('./httpUtils');
const {
  loadGoogleConfig,
  newGoogleState,
  consumeGoogleState,
  googleStates,
  httpsPostForm,
  decodeJwtPayload,
  uuidv4,
} = require('./googleAuth');

function createApiHandler({ accounts, config, getInviteBaseUrl, publicPlayUrlRef }) {
  const { PORT, PUBLIC_URL, IS_PRODUCTION } = config;

  function getGoogleRedirectUri(req) {
    const { redirectUri } = loadGoogleConfig();
    if (redirectUri) return redirectUri;
    const origin = getRequestOrigin(req, IS_PRODUCTION);
    if (origin) return `${origin}/api/auth/google/callback`;
    return `http://localhost:${PORT}/api/auth/google/callback`;
  }

  return async function handleApi(req, res, urlPath) {
    const method = req.method;

    if (method === 'GET' && urlPath === '/api/config') {
      const { id, secret, redirectUri } = loadGoogleConfig();
      return sendJson(res, 200, {
        googleEnabled: !!(id && secret),
        googleClientId: id || '',
        googleRedirectUri: redirectUri || `${getRequestOrigin(req, IS_PRODUCTION) || `http://localhost:${PORT}`}/api/auth/google/callback`,
      });
    }
    if (method === 'GET' && urlPath === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'richesses-du-monde' });
    }
    if (method === 'GET' && urlPath === '/api/play-url') {
      const localUrl = getRequestOrigin(req, IS_PRODUCTION) || `http://localhost:${PORT}`;
      const lanUrl = IS_PRODUCTION ? null : getLanPlayUrl(PORT);
      const inviteBase = getInviteBaseUrl(req);
      return sendJson(res, 200, {
        local: localUrl,
        lan: lanUrl,
        public: PUBLIC_URL || publicPlayUrlRef.current,
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

    if (method === 'GET' && urlPath === '/api/auth/google/info') {
      const { id, redirectUri } = loadGoogleConfig();
      const uri = redirectUri || getGoogleRedirectUri(req);
      return sendJson(res, 200, {
        clientId: id,
        redirectUri: uri,
        jsOrigin: getRequestOrigin(req, IS_PRODUCTION) || 'http://localhost:3000',
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
      return sendJson(res, 404, { error: 'Route inconnue', code: 'not_found' });
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
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        return sendJson(res, 200, { profile: accounts.getProfile(acc) });
      }
      case '/api/auth/logout': {
        const token = req.headers['x-auth-token'] || body.token;
        if (token) accounts.destroySession(token);
        return sendJson(res, 200, { ok: true });
      }
      case '/api/profile/rename': {
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
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
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        const r = accounts.buyCosmetic(acc, body.itemId || body.pawnId);
        if (r.error) return sendJson(res, 400, { error: r.error, code: r.error });
        return sendJson(res, 200, { profile: accounts.getProfile(acc) });
      }
      case '/api/shop/equip': {
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        const r = accounts.equipCosmetic(acc, body.itemId || body.pawnId);
        if (r.error) return sendJson(res, 400, { error: r.error, code: r.error });
        return sendJson(res, 200, { profile: accounts.getProfile(acc) });
      }
      case '/api/battlepass/claim': {
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        const r = accounts.claimPassReward(acc, Number(body.tier), body.track);
        if (r.error) return sendJson(res, 400, { error: r.error, code: r.error });
        return sendJson(res, 200, { profile: accounts.getProfile(acc), reward: r.reward });
      }
      case '/api/battlepass/buy-premium': {
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        const r = accounts.buyPremiumPass(acc);
        if (r.error) return sendJson(res, 400, { error: r.error, code: r.error });
        return sendJson(res, 200, { profile: accounts.getProfile(acc) });
      }
      case '/api/promo/redeem': {
        const acc = requireAuth(req, body, accounts, res);
        if (!acc) return undefined;
        const r = accounts.redeemPromo(acc, body.code);
        if (r.error) return sendJson(res, 400, { error: r.error, code: r.error });
        return sendJson(res, 200, { profile: accounts.getProfile(acc), result: r });
      }
      default:
        return sendJson(res, 404, { error: 'Route inconnue', code: 'not_found' });
    }
  };
}

module.exports = { createApiHandler };
