const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');
const { ROOT } = require('./config');

const uuidv4 = () => crypto.randomUUID();
const googleStates = new Map();

function loadGoogleConfig() {
  let id = (process.env.GOOGLE_CLIENT_ID || '').trim();
  let secret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  let redirectUri = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  try {
    const p = path.join(ROOT, 'config.json');
    if (fs.existsSync(p)) {
      const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (!id) id = (cfg.googleClientId || '').trim();
      if (!secret) secret = (cfg.googleClientSecret || '').trim();
      if (!redirectUri) redirectUri = (cfg.googleRedirectUri || '').trim();
    }
  } catch (_) {}
  return { id, secret, redirectUri };
}

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
      {
        hostname,
        path: reqPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (resp) => {
        let body = '';
        resp.on('data', (c) => { body += c; });
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

module.exports = {
  loadGoogleConfig,
  newGoogleState,
  consumeGoogleState,
  googleStates,
  httpsPostForm,
  decodeJwtPayload,
  uuidv4,
};
