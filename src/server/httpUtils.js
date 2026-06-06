const fs = require('fs');
const path = require('path');
const os = require('os');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
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

function getRequestOrigin(req, isProduction) {
  if (!req?.headers?.host) return '';
  const proto = (req.headers['x-forwarded-proto'] || (isProduction ? 'https' : 'http')).split(',')[0].trim();
  return `${proto}://${req.headers.host}`.replace(/\/$/, '');
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

function createStaticHandler(publicDir) {
  return function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(publicDir, urlPath);
    const resolvedPublic = path.resolve(publicDir);

    if (!path.resolve(filePath).startsWith(resolvedPublic)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(filePath);
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      if (ext === '.html') headers['Cache-Control'] = 'no-cache';
      else if (['.css', '.js'].includes(ext)) headers['Cache-Control'] = 'public, max-age=3600';
      res.writeHead(200, headers);
      res.end(data);
    });
  };
}

function authFromReq(req, body, accounts) {
  const token = req.headers['x-auth-token'] || body.token;
  if (!token) return null;
  return accounts.getUserByToken(token);
}

function requireAuth(req, body, accounts, res) {
  const acc = authFromReq(req, body, accounts);
  if (!acc) {
    sendJson(res, 401, { error: 'Non authentifié', code: 'unauthorized' });
    return null;
  }
  return acc;
}

module.exports = {
  MIME,
  sendJson,
  redirect,
  readBody,
  getRequestOrigin,
  getLanPlayUrl,
  createStaticHandler,
  authFromReq,
  requireAuth,
};
