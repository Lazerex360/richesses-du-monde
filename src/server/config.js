const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!PUBLIC_URL;
const PUBLIC = path.join(__dirname, '..', '..', 'public');
const ROOT = path.join(__dirname, '..', '..');

if (process.env.RDM_USER_DATA && !process.env.RDM_BUNDLE_DATA) {
  process.env.RDM_BUNDLE_DATA = path.join(ROOT, 'data');
}

const BOT_DELAYS = {
  roll: 2400,
  afterRoll: 4800,
  action: 3000,
  endTurn: 2600,
  auction: 2800,
};

const AUTO_START_COUNTDOWN_MS = 20000;
const MIN_AUTO_START_PLAYERS = 4;

module.exports = {
  PORT,
  HOST,
  PUBLIC_URL,
  IS_PRODUCTION,
  PUBLIC,
  ROOT,
  BOT_DELAYS,
  AUTO_START_COUNTDOWN_MS,
  MIN_AUTO_START_PLAYERS,
};
