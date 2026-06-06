// ===================== Utilitaires =====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const show = (el) => el && el.classList.remove('hidden');
const hide = (el) => el && el.classList.add('hidden');

function updateDocumentTitle() {
  const onGame = $('#screen-game')?.classList.contains('active');
  document.title = onGame ? t('game.title') : t('app.title');
}

function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  updateDocumentTitle();
}

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)} M€`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)} k€`;
  return `${n} €`;
}

function formatMoneyPdf(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('fr-FR')} €`;
}

let toastTimer = null;
function toast(msg, type = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  show(el);
  if (type === 'success') sfx('success');
  else if (type === 'error') sfx('error');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hide(el), 3200);
}

// ===================== Paramètres (son / affichage) =====================
const SETTINGS_KEY = 'rdm_settings';
const DEFAULT_SETTINGS = { volume: 50, sfx: true, textSize: 100, reduceMotion: false, highContrast: false, lang: 'fr' };
let settings = loadSettings();

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch (_) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function applySettings() {
  document.documentElement.style.setProperty('--font-scale', settings.textSize / 100);
  document.body.classList.toggle('reduce-motion', settings.reduceMotion);
  document.body.classList.toggle('high-contrast', settings.highContrast);
}

// ===================== Internationalisation =====================
function t(key, params) {
  const langs = window.TR || {};
  const dict = langs[settings.lang] || langs.fr || {};
  let s = dict[key] != null ? dict[key] : (langs.fr && langs.fr[key] != null ? langs.fr[key] : key);
  if (params) for (const k in params) s = s.split(`{${k}}`).join(params[k]);
  return s;
}

const LANG_BTN_LABEL = { fr: 'FR', en: 'EN', es: 'ES', de: 'DE', it: 'IT', zh: '中文', ja: '日本' };

function languageOptionsHtml(selected) {
  return (window.TR_LANGS || ['fr']).map((code) => {
    const name = (window.TR[code] && window.TR[code]['lang.name']) || code.toUpperCase();
    return `<option value="${code}" ${code === selected ? 'selected' : ''}>${name}</option>`;
  }).join('');
}

function syncLanguageSelectors() {
  const html = languageOptionsHtml(settings.lang);
  const setSel = $('#set-language');
  if (setSel) setSel.innerHTML = html;
  const authSel = $('#auth-language');
  if (authSel) authSel.innerHTML = html;
}

function setLanguage(code) {
  settings.lang = code;
  saveSettings();
  applyLanguage();
  $('#set-language') && ($('#set-language').value = code);
  const authSel = $('#auth-language');
  if (authSel) authSel.value = code;
  renderAuthLanguageButtons();
}

function applyLanguage() {
  document.documentElement.lang = settings.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  updateDocumentTitle();
  if ($('#rules-overlay') && !$('#rules-overlay').classList.contains('hidden')) renderRules();
  if ($('#resources-overlay') && !$('#resources-overlay').classList.contains('hidden')) renderResourcesGuide();
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  const authGroup = $('#auth-language-group');
  if (authGroup) authGroup.setAttribute('aria-label', t('settings.language'));
  if (profile) {
    renderProfileChip();
    renderProfileTab();
    if ($('#tab-shop')?.classList.contains('active')) renderShop();
    if ($('#tab-pass')?.classList.contains('active') && passData) renderPass();
  }
}

// Petits effets sonores synthétisés (WebAudio) pilotés par le volume.
let audioCtx = null;
function sfx(kind = 'click') {
  if (!settings.sfx || settings.volume <= 0) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const presets = {
      click: { f: 420, d: 0.06, type: 'triangle' },
      dice: { f: 620, d: 0.13, type: 'square' },
      success: { f: 880, d: 0.18, type: 'sine' },
      win: { f: 988, d: 0.45, type: 'sine' },
      error: { f: 170, d: 0.22, type: 'sawtooth' },
      card: { f: 520, d: 0.2, type: 'triangle' },
    };
    const p = presets[kind] || presets.click;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const vol = (settings.volume / 100) * 0.18;
    o.type = p.type;
    o.frequency.setValueAtTime(p.f, now);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + p.d);
  } catch (_) {}
}

function renderSettingsUI() {
  syncLanguageSelectors();
  $('#set-volume').value = settings.volume;
  $('#set-volume-val').textContent = `${settings.volume}%`;
  $('#set-sfx').checked = settings.sfx;
  $('#set-textsize').value = settings.textSize;
  $('#set-textsize-val').textContent = `${settings.textSize}%`;
  $('#set-reduce-motion').checked = settings.reduceMotion;
  $('#set-high-contrast').checked = settings.highContrast;
}
function openSettings() { renderSettingsUI(); show($('#settings-overlay')); }
function closeSettings() { hide($('#settings-overlay')); }
function openRules() { renderRules(); show($('#rules-overlay')); }

function renderRules() {
  const body = $('#rules-body');
  if (!body || !window.RULES_CONTENT) return;
  const lang = settings.lang || 'fr';
  body.innerHTML = RULES_CONTENT[lang] || RULES_CONTENT.fr;
}

function closeHubMenu() {
  hide($('#hub-menu'));
  $('#btn-menu')?.classList.remove('open');
  $('#btn-menu')?.setAttribute('aria-expanded', 'false');
}
function toggleHubMenu() {
  const menu = $('#hub-menu');
  const btn = $('#btn-menu');
  if (menu.classList.contains('hidden')) {
    show(menu);
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    closeHubMenu();
  }
}

$('#btn-menu').addEventListener('click', (e) => { e.stopPropagation(); toggleHubMenu(); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-wrap')) closeHubMenu();
});

$('#hub-menu').addEventListener('click', async (e) => {
  const item = e.target.closest('[data-menu]');
  if (!item) return;
  closeHubMenu();
  const action = item.dataset.menu;
  if (action === 'resources') openResourcesGuide();
  else if (action === 'rules') { renderRules(); show($('#rules-overlay')); }
  else if (action === 'settings') openSettings();
  else if (action === 'logout') $('#btn-logout').click();
});

$('#resources-close').addEventListener('click', () => hide($('#resources-overlay')));
$('#resources-overlay').addEventListener('click', (e) => { if (e.target.id === 'resources-overlay') hide($('#resources-overlay')); });
$('#btn-board-resources')?.addEventListener('click', openResourcesGuide);

function handleTitlesPanelClick(e, container) {
  const header = e.target.closest('.resource-group-header');
  if (!header || !container?.contains(header)) return;
  const group = header.closest('.resource-group-interactive');
  if (!group) return;
  e.stopPropagation();
  const open = group.classList.contains('is-royalties-open');
  container.querySelectorAll('.resource-group.is-royalties-open').forEach((g) => {
    g.classList.remove('is-royalties-open');
    g.querySelector('.resource-group-header')?.setAttribute('aria-expanded', 'false');
  });
  if (!open) {
    group.classList.add('is-royalties-open');
    header.setAttribute('aria-expanded', 'true');
  }
}

function closeTitlesRoyaltiesPanels() {
  $$('#my-titles .resource-group.is-royalties-open, #player-titles-body .resource-group.is-royalties-open').forEach((g) => {
    g.classList.remove('is-royalties-open');
    g.querySelector('.resource-group-header')?.setAttribute('aria-expanded', 'false');
  });
}

$('#my-titles').addEventListener('click', (e) => handleTitlesPanelClick(e, $('#my-titles')));
$('#player-titles-body')?.addEventListener('click', (e) => handleTitlesPanelClick(e, $('#player-titles-body')));

document.addEventListener('click', (e) => {
  if (e.target.closest('#my-titles .resource-group-interactive, #player-titles-body .resource-group-interactive')) return;
  closeTitlesRoyaltiesPanels();
});

$('#player-titles-close')?.addEventListener('click', () => hide($('#player-titles-overlay')));
$('#player-titles-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'player-titles-overlay') hide($('#player-titles-overlay'));
});

$('#players-panel')?.addEventListener('click', (e) => {
  const card = e.target.closest('.player-card-clickable');
  if (!card || !gameState) return;
  openPlayerTitles(card.dataset.playerId);
});
$('#players-panel')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.player-card-clickable');
  if (!card || !gameState) return;
  e.preventDefault();
  openPlayerTitles(card.dataset.playerId);
});
$('#btn-game-resources').addEventListener('click', openResourcesGuide);
$('#btn-game-settings')?.addEventListener('click', openSettings);
$('#btn-game-rules')?.addEventListener('click', openRules);

$('#news-card-dismiss')?.addEventListener('click', dismissNewsCard);
$('#news-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'news-overlay' && $('#news-card-flipper')?.classList.contains('flipped')) dismissNewsCard();
});

$('#rules-close').addEventListener('click', () => hide($('#rules-overlay')));
$('#rules-overlay').addEventListener('click', (e) => { if (e.target.id === 'rules-overlay') hide($('#rules-overlay')); });
$('#settings-close').addEventListener('click', closeSettings);
$('#settings-overlay').addEventListener('click', (e) => { if (e.target.id === 'settings-overlay') closeSettings(); });

$('#set-volume').addEventListener('input', (e) => {
  settings.volume = +e.target.value;
  $('#set-volume-val').textContent = `${settings.volume}%`;
  saveSettings();
});
$('#set-volume').addEventListener('change', () => sfx('dice'));
$('#set-language').addEventListener('change', (e) => setLanguage(e.target.value));
$('#auth-language')?.addEventListener('change', (e) => setLanguage(e.target.value));
$('#set-sfx').addEventListener('change', (e) => { settings.sfx = e.target.checked; saveSettings(); if (settings.sfx) sfx('success'); });
$('#set-textsize').addEventListener('input', (e) => {
  settings.textSize = +e.target.value;
  $('#set-textsize-val').textContent = `${settings.textSize}%`;
  applySettings();
  saveSettings();
});
$('#set-reduce-motion').addEventListener('change', (e) => { settings.reduceMotion = e.target.checked; applySettings(); saveSettings(); });
$('#set-high-contrast').addEventListener('change', (e) => { settings.highContrast = e.target.checked; applySettings(); saveSettings(); });
$('#settings-reset').addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS };
  applySettings(); applyLanguage(); saveSettings(); renderSettingsUI();
  toast(t('settings.reset_toast'), 'success');
});

// Effet sonore de clic sur les boutons
document.addEventListener('click', (e) => {
  if (e.target.closest('button, .nav-tab, .shop-cat')) sfx('click');
}, true);

applySettings();

// ===================== État global =====================
let token = localStorage.getItem('rdm_token') || null;
let profile = null;
let pawnEmojiMap = { classic: '🔘' };
let pawnList = [];
let diceList = [];
let titleList = [];
let diceMap = {};
let shopCategory = 'pawn';
let passData = null;

// Identifiants persistants par fournisseur (pour retrouver son compte)
function getProviderSub(provider) {
  const key = `rdm_${provider}_sub`;
  let sub = localStorage.getItem(key);
  if (!sub) {
    sub = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).replace(/-/g, '');
    localStorage.setItem(key, sub);
  }
  return sub;
}

// ===================== API HTTP =====================
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['x-auth-token'] = token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
}

// ===================== WebSocket =====================
class GameSocket {
  constructor() {
    this.handlers = {};
    this.ws = null;
    this.authed = false;
  }
  connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}`);
    this.ws.onopen = () => {
      if (token) this.emit('auth', { token });
    };
    this.ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        (this.handlers[event] || []).forEach((fn) => fn(data));
      } catch (_) {}
    };
    this.ws.onclose = () => {
      this.authed = false;
      setTimeout(() => this.connect(), 1500);
    };
  }
  on(event, fn) {
    (this.handlers[event] = this.handlers[event] || []).push(fn);
  }
  emit(event, data = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ event, data }));
  }
}
const socket = new GameSocket();

// ===================== Authentification =====================
function showAuthError(msg) {
  const el = $('#auth-error');
  el.textContent = msg;
  show(el);
}

function isValidEmail(email) {
  const e = (email || '').trim().toLowerCase();
  if (!e || e.length > 254) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(e);
}

function showEmailFieldError(invalid) {
  const input = $('#auth-email');
  const hint = $('#auth-email-hint');
  if (!input) return;
  input.classList.toggle('input-invalid', invalid);
  if (hint) {
    hint.textContent = invalid ? t('auth.email_invalid') : '';
    hint.classList.toggle('hidden', !invalid);
  }
}

// Connexion invité : identifiant local persistant (par navigateur).
async function loginGuest() {
  const sub = getProviderSub('guest');
  try {
    const data = await api('/api/auth/guest', 'POST', { sub, displayName: 'Invité' });
    token = data.token;
    localStorage.setItem('rdm_token', token);
    profile = data.profile;
    enterHub();
    socket.emit('auth', { token });
  } catch (e) {
    showAuthError(e.message);
  }
}

// Connexion par e-mail : l'e-mail sert d'identifiant de compte (progression
// liée à l'e-mail et retrouvable depuis n'importe quel navigateur/appareil).
async function loginWithEmail(rawEmail, displayName) {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    showEmailFieldError(true);
    showAuthError(t('auth.email_invalid'));
    return;
  }
  showEmailFieldError(false);
  const name = (displayName || '').trim().replace(/\s+/g, ' ').slice(0, 20) || email.split('@')[0].slice(0, 20);
  try {
    const data = await api('/api/auth/email', 'POST', { email, displayName: name });
    token = data.token;
    localStorage.setItem('rdm_token', token);
    localStorage.setItem('rdm_google_email', email);
    profile = data.profile;
    enterHub();
    socket.emit('auth', { token });
  } catch (e) {
    showAuthError(mapAuthError(e.message));
  }
}

function mapAuthError(msg) {
  if (/pseudo|déjà utilisé/i.test(msg)) return t('profile.pseudo_taken');
  if (/e-mail invalide|email invalide/i.test(msg)) return t('auth.email_invalid');
  return msg;
}

// Connexion e-mail depuis la carte : e-mail + Prénom/Nom + Pseudo (mémorisés).
// Le pseudo, s'il est saisi, est le nom affiché en jeu ; sinon « Prénom Nom ».
function emailLoginFromForm() {
  const email = $('#auth-email').value;
  const first = $('#auth-firstname').value.trim();
  const last = $('#auth-lastname').value.trim();
  const pseudo = $('#auth-pseudo').value.trim();
  const displayName = pseudo || [first, last].filter(Boolean).join(' ');
  if (first) localStorage.setItem('rdm_firstname', first);
  if (last) localStorage.setItem('rdm_lastname', last);
  if (pseudo) localStorage.setItem('rdm_pseudo', pseudo);
  loginWithEmail(email, displayName);
}

// ---- Google : un seul clic → redirection serveur (évite la double page GIS) ----
let googleEnabled = false;

function startGoogleOAuth() {
  hide($('#auth-error'));
  if (!googleEnabled) {
    showAuthError(t('auth.google_unconfigured'));
    $('#auth-email').focus();
    return;
  }
  window.location.href = '/api/auth/google/start';
}

function googleErrorMessage(code) {
  const keys = {
    unconfigured: 'auth.google_unconfigured',
    denied: 'auth.google_denied',
    code: 'auth.google_failed',
    state: 'auth.google_failed',
    token: 'auth.google_exchange',
    email: 'auth.google_failed',
    exchange: 'auth.google_exchange',
    redirect_uri_mismatch: 'auth.google_redirect',
  };
  return t(keys[code] || 'auth.google_failed');
}

async function setupGoogleAuth() {
  const container = $('#google-signin-container');
  const fallback = $('#btn-google-fallback');
  const googleRow = $('.auth-google-row');
  const orSep = $('.auth-or');
  try {
    const cfg = await api('/api/config', 'GET');
    googleEnabled = !!cfg.googleEnabled;
    if (!googleEnabled || !cfg.googleClientId) {
      hide(container);
      hide(fallback);
      hide(googleRow);
      hide(orSep);
      return;
    }
    hide(container);
    show(fallback);
    fallback.classList.remove('hidden');
    show(googleRow);
    show(orSep);
  } catch (_) {
    googleEnabled = false;
    hide(container);
    hide(fallback);
    hide(googleRow);
    hide(orSep);
  }
}

// Au retour de Google : le serveur redirige vers /?token=... (ou ?google_error=...)
async function handleGoogleRedirect() {
  const params = new URLSearchParams(location.search);
  const incoming = params.get('token');
  const gerr = params.get('google_error');
  if (incoming) {
    token = incoming;
    localStorage.setItem('rdm_token', incoming);
  }
  if (incoming || gerr) {
    history.replaceState({}, '', location.pathname);
  }
  return { gerr };
}

async function tryRestoreSession() {
  if (!token) return false;
  try {
    const data = await api('/api/auth/session', 'POST', {});
    profile = data.profile;
    return true;
  } catch (_) {
    token = null;
    localStorage.removeItem('rdm_token');
    return false;
  }
}

$('#btn-google-fallback').addEventListener('click', startGoogleOAuth);
$('#btn-guest').addEventListener('click', loginGuest);
$('#btn-pseudo-confirm').addEventListener('click', confirmPseudoSetup);
$('#pseudo-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmPseudoSetup(); });
$('#btn-email-login').addEventListener('click', emailLoginFromForm);
$('#auth-email').value = localStorage.getItem('rdm_google_email') || '';
$('#auth-email').addEventListener('input', () => {
  const val = $('#auth-email').value.trim();
  if (!val) { showEmailFieldError(false); return; }
  showEmailFieldError(!isValidEmail(val));
});
$('#auth-email').addEventListener('blur', () => {
  const val = $('#auth-email').value.trim();
  if (val) showEmailFieldError(!isValidEmail(val));
});
$('#auth-firstname').value = localStorage.getItem('rdm_firstname') || '';
$('#auth-lastname').value = localStorage.getItem('rdm_lastname') || '';
$('#auth-pseudo').value = localStorage.getItem('rdm_pseudo') || '';
['#auth-email', '#auth-firstname', '#auth-lastname', '#auth-pseudo'].forEach((sel) => {
  $(sel).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); emailLoginFromForm(); } });
});

$('#btn-logout').addEventListener('click', async () => {
  try { await api('/api/auth/logout', 'POST', {}); } catch (_) {}
  token = null;
  profile = null;
  localStorage.removeItem('rdm_token');
  showScreen('screen-auth');
  setupGoogleAuth();
});

// ===================== Hub =====================
function needsPseudoSetup() {
  return profile?.provider === 'google' && profile.pseudoChosen === false;
}

function showPseudoSetup() {
  showScreen('screen-pseudo');
  $('#pseudo-input').value = profile?.displayName || localStorage.getItem('rdm_pseudo') || '';
  hide($('#pseudo-error'));
  setTimeout(() => $('#pseudo-input').focus(), 50);
}

async function confirmPseudoSetup() {
  const name = $('#pseudo-input').value.trim();
  const errEl = $('#pseudo-error');
  if (name.length < 2) {
    errEl.textContent = t('profile.name_short');
    show(errEl);
    return;
  }
  try {
    const data = await api('/api/profile/rename', 'POST', { displayName: name });
    profile = data.profile;
    localStorage.setItem('rdm_pseudo', name);
    hide(errEl);
    enterHub();
    socket.emit('auth', { token });
  } catch (e) {
    errEl.textContent = mapAuthError(e.message);
    show(errEl);
  }
}

async function finishLogin() {
  if (profile?.provider === 'google' && profile.externalId) {
    localStorage.setItem('rdm_google_email', profile.externalId);
  }
  if (needsPseudoSetup()) {
    showPseudoSetup();
  } else {
    enterHub();
    socket.emit('auth', { token });
  }
}

async function enterHub() {
  showScreen('screen-hub');
  await Promise.all([loadShopData(), loadResourcesData()]);
  renderProfileChip();
  renderProfileTab();
  switchTab('play');
}

function renderProfileChip() {
  if (!profile) return;
  $('#pc-avatar').textContent = profile.avatar;
  $('#pc-name').textContent = profile.displayName;
  $('#pc-level').textContent = t('chip.level', { n: profile.level });
  $('#pc-coins').textContent = `💰 ${profile.coins.toLocaleString('fr-FR')}`;
  $('#pc-xp-fill').style.width = `${Math.min(100, (profile.xpIntoLevel / profile.xpForNext) * 100)}%`;
}

function switchTab(tab) {
  $$('.nav-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${tab}`));
  if (tab === 'shop') renderShop();
  if (tab === 'pass') loadAndRenderPass();
  if (tab === 'profile') renderProfileTab();
  if (tab === 'play') socket.emit('browse_games');
  else socket.emit('stop_browse');
}

$$('.nav-tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));

// ===================== Onglet Jouer =====================
$('#btn-quick').addEventListener('click', () => {
  const s = $('#quick-status');
  s.textContent = t('play.quick_searching');
  show(s);
  socket.emit('quick_match');
});

$('#btn-create').addEventListener('click', () => {
  socket.emit('create_room', {
    roomName: $('#create-name').value.trim(),
    isPublic: $('#create-public').checked,
    maxPlayers: Number($('#create-max').value),
  });
});

$('#btn-join').addEventListener('click', () => {
  const code = $('#join-code').value.trim();
  if (!code) return toast(t('profile.promo_empty'), 'error');
  socket.emit('join_room', { roomCode: code });
});
$('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-join').click(); });

$('#btn-refresh-games').addEventListener('click', () => socket.emit('browse_games'));

socket.on('public_games', (list) => {
  const c = $('#public-games');
  if (!list || list.length === 0) {
    c.innerHTML = `<p class="empty-hint">${t('play.no_games')}</p>`;
    return;
  }
  c.innerHTML = list
    .map(
      (g) => `
    <div class="game-row">
      <div class="gr-info">
        <span class="gr-name">${escapeHtml(g.name)}</span>
        <span class="gr-meta">${t('play.host')} : ${escapeHtml(g.host)} · ${g.players}/${g.maxPlayers} ${t('play.players')}</span>
      </div>
      <button class="btn btn-secondary" data-code="${g.code}">${t('play.join')}</button>
    </div>`
    )
    .join('');
  c.querySelectorAll('button[data-code]').forEach((b) =>
    b.addEventListener('click', () => socket.emit('join_room', { roomCode: b.dataset.code }))
  );
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===================== Boutique =====================
async function loadShopData() {
  try {
    const data = await api('/api/shop');
    pawnList = data.pawns;
    diceList = data.dice || [];
    titleList = data.titles || [];
    pawnEmojiMap = Object.fromEntries(pawnList.map((p) => [p.id, p.emoji]));
    diceMap = Object.fromEntries(diceList.map((d) => [d.id, d]));
  } catch (_) {}
}

$$('.shop-cat').forEach((b) =>
  b.addEventListener('click', () => {
    shopCategory = b.dataset.cat;
    $$('.shop-cat').forEach((x) => x.classList.toggle('active', x === b));
    renderShop();
  })
);

function honorTitleBadge(title) {
  if (!title) return '';
  return `<span class="honor-title-badge">${escapeHtml(title)}</span>`;
}

function cosmeticVisual(item) {
  if (item.type === 'dice') {
    return `<div class="dice-preview">${Dice3D.buildPreviewHtml(item.style, 5)}</div>`;
  }
  if (item.type === 'title') {
    const text = item.label || '—';
    const rarityCls = item.rarity ? ` title-preview-${item.rarity}` : '';
    return `<div class="title-shop-preview${rarityCls}">${escapeHtml(text)}</div>`;
  }
  return `<div class="pawn-emoji">${item.emoji}</div>`;
}

function renderShop() {
  const grid = $('#shop-grid');
  const items = shopCategory === 'dice' ? diceList : shopCategory === 'title' ? titleList : pawnList;
  const owned = shopCategory === 'dice'
    ? (profile.ownedDice || [])
    : shopCategory === 'title'
      ? (profile.ownedTitles || ['title_none'])
      : profile.ownedPawns;
  const equippedId = shopCategory === 'dice'
    ? profile.equippedDice
    : shopCategory === 'title'
      ? (profile.equippedTitle || 'title_none')
      : profile.equippedPawn;

  grid.innerHTML = items
    .map((it) => {
      const isOwned = owned.includes(it.id);
      const equipped = equippedId === it.id;
      const passTag = it.source === 'pass' ? '<span class="pawn-tag">Passe</span>' : '';
      let actionBtn;
      if (equipped) actionBtn = `<button class="btn btn-success" disabled>${t('shop.equipped')}</button>`;
      else if (isOwned) actionBtn = `<button class="btn btn-secondary" data-equip="${it.id}">${t('shop.equip')}</button>`;
      else if (it.source === 'pass') actionBtn = `<button class="btn btn-secondary" disabled>${t('shop.via_pass')}</button>`;
      else {
        const can = profile.coins >= it.price;
        actionBtn = `<button class="btn ${can ? 'btn-primary' : 'btn-secondary'}" data-buy="${it.id}" ${can ? '' : 'disabled'}>💰 ${it.price.toLocaleString('fr-FR')}</button>`;
      }
      return `
      <div class="pawn-card r-${it.rarity} ${equipped ? 'equipped' : ''}">
        ${passTag}
        ${cosmeticVisual(it)}
        <div class="pawn-name">${it.name}</div>
        <div class="pawn-rarity rarity-${it.rarity}">${it.rarity}</div>
        ${actionBtn}
      </div>`;
    })
    .join('');

  grid.querySelectorAll('button[data-buy]').forEach((b) =>
    b.addEventListener('click', () => buyCosmetic(b.dataset.buy))
  );
  grid.querySelectorAll('button[data-equip]').forEach((b) =>
    b.addEventListener('click', () => equipCosmetic(b.dataset.equip))
  );
  if (shopCategory === 'dice') {
    grid.querySelectorAll('.dice-scene--preview').forEach((el) => Dice3D.initPreview(el, 5));
  }
}

async function buyCosmetic(itemId) {
  try {
    const data = await api('/api/shop/buy', 'POST', { itemId });
    profile = data.profile;
    toast(t('shop.bought'), 'success');
    renderProfileChip();
    renderShop();
  } catch (e) { toast(e.message, 'error'); }
}

async function equipCosmetic(itemId) {
  try {
    const data = await api('/api/shop/equip', 'POST', { itemId });
    profile = data.profile;
    toast(t('shop.equipped_toast'), 'success');
    renderShop();
    renderProfileTab();
    socket.emit('refresh_profile');
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== Passe de saison =====================
async function loadAndRenderPass() {
  try {
    if (!passData) passData = await api('/api/battlepass');
    renderPass();
  } catch (e) { toast(e.message, 'error'); }
}

function renderPass() {
  if (!profile?.battlePass) return;
  const bp = profile.battlePass;
  const hasPremium = !!bp.premium;
  const status = $('#pass-status');
  status.innerHTML = bp.premium
    ? `<span class="pass-badge premium">${t('pass.premium_active')}</span>`
    : `<span class="pass-badge free">${t('pass.free')}</span>
       <button class="btn btn-primary" id="btn-buy-premium">${t('pass.unlock_premium', { eur: passData.premiumEur.toFixed(2).replace('.', ','), coins: passData.premiumPrice.toLocaleString('fr-FR') })}</button>`;

  if (!bp.premium) {
    $('#btn-buy-premium')?.addEventListener('click', buyPremium);
  }

  $('#pass-tier-label').textContent = t('pass.tier_of', { n: bp.tier, max: bp.maxTier });
  $('#pass-xp-fill').style.width = `${Math.min(100, (bp.xpIntoTier / bp.xpPerTier) * 100)}%`;
  $('#pass-xp-label').textContent = `${bp.xpIntoTier} / ${bp.xpPerTier} XP`;

  const track = $('#pass-track');
  track.innerHTML = passData.tiers
    .map((ti) => {
      const unlocked = ti.tier <= bp.tier;
      const freeClaimed = bp.claimedFree.includes(ti.tier);
      const premClaimed = bp.claimedPremium.includes(ti.tier);
      return `
      <div class="pass-tier">
        <div class="pass-tier-num">${t('pass.tier', { n: ti.tier })}</div>
        ${rewardCell(ti.free, 'free', ti.tier, unlocked, freeClaimed, true)}
        ${rewardCell(ti.premium, 'premium', ti.tier, unlocked, premClaimed, hasPremium)}
      </div>`;
    })
    .join('');

  track.querySelectorAll('button[data-claim]').forEach((b) =>
    b.addEventListener('click', () => claimPass(Number(b.dataset.tier), b.dataset.track))
  );
}

function rewardCell(reward, track, tier, unlocked, claimed, trackActive) {
  let emoji = '💰';
  let label = '';
  if (reward.type === 'pawn') {
    emoji = pawnEmojiMap[reward.pawnId] || '🎁';
    label = pawnList.find((p) => p.id === reward.pawnId)?.name || t('pass.pawn');
  } else if (reward.type === 'dice') {
    emoji = '🎲';
    label = (diceMap[reward.diceId]?.name) || t('pass.dice_excl');
  } else if (reward.type === 'premium_pass') {
    emoji = '⭐';
    label = t('pass.premium_pass');
  } else {
    label = t('pass.coins', { n: reward.amount.toLocaleString('fr-FR') });
  }
  const isPremiumLocked = track === 'premium' && !trackActive;
  const isTierLocked = !unlocked;
  const isLocked = isTierLocked || isPremiumLocked;

  let footer;
  if (claimed) footer = `<span class="claimed-tag">${t('pass.claimed')}</span>`;
  else if (isTierLocked) footer = `<span class="pass-state-tag locked-tag">${t('pass.locked')}</span>`;
  else if (isPremiumLocked) footer = '';
  else footer = `<button class="claim-btn" data-claim="1" data-tier="${tier}" data-track="${track}">${t('pass.claim')}</button>`;

  const lockOverlay = isPremiumLocked
    ? `<div class="premium-lock-overlay" role="status">
         <span class="premium-lock-icon">🔒</span>
         <span class="premium-lock-msg">${t('pass.premium_locked')}</span>
       </div>`
    : '';

  const cls = `pass-reward ${track === 'premium' ? 'premium-row' : ''} ${claimed ? 'claimed' : ''} ${isTierLocked ? 'tier-locked' : ''} ${isPremiumLocked ? 'premium-locked' : ''}`;
  return `
    <div class="${cls}">
      ${lockOverlay}
      <span class="r-emoji">${emoji}</span>
      <span class="r-label">${label}</span>
      ${footer}
    </div>`;
}

async function claimPass(tier, track) {
  try {
    const data = await api('/api/battlepass/claim', 'POST', { tier, track });
    profile = data.profile;
    const r = data.reward;
    let msg;
    if (r.type === 'pawn') msg = t('toast.pawn_unlocked');
    else if (r.type === 'dice') msg = t('toast.dice_unlocked');
    else if (r.type === 'premium_pass') msg = t('toast.premium_unlocked');
    else msg = t('toast.coins_gain', { n: r.amount });
    toast(msg, 'success');
    renderProfileChip();
    renderPass();
  } catch (e) { toast(e.message, 'error'); }
}

async function buyPremium() {
  try {
    const data = await api('/api/battlepass/buy-premium', 'POST', {});
    profile = data.profile;
    toast(t('toast.premium_unlocked'), 'success');
    renderProfileChip();
    renderPass();
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== Profil =====================
const RANK_TITLES = [
  { min: 30, key: 'rank.magnate' },
  { min: 20, key: 'rank.industrialist' },
  { min: 12, key: 'rank.investor' },
  { min: 6, key: 'rank.merchant' },
  { min: 1, key: 'rank.adventurer' },
];
function rankForLevel(level) {
  return t((RANK_TITLES.find((r) => level >= r.min) || RANK_TITLES[RANK_TITLES.length - 1]).key);
}

function renderProfileTab() {
  if (!profile) return;
  $('#profile-avatar').textContent = profile.avatar;
  $('#profile-name').textContent = profile.displayName;
  const honorEl = $('#profile-honor-title');
  if (honorEl) {
    if (profile.equippedTitleLabel) {
      honorEl.textContent = profile.equippedTitleLabel;
      show(honorEl);
    } else {
      honorEl.textContent = '';
      hide(honorEl);
    }
  }
  $('#profile-level-badge').textContent = profile.level;
  $('#profile-rank').textContent = rankForLevel(profile.level);
  $('#profile-tag').textContent = profile.provider === 'google'
    ? t('profile.account_google')
    : profile.provider === 'email'
      ? t('profile.account_email')
      : t('profile.account_guest');
  const pawnEl = $('#profile-pawn');
  if (pawnEl) pawnEl.textContent = profile.equippedPawnEmoji || '🔘';
  const ds = profile.equippedDiceStyle;
  const diceEl = $('#profile-dice');
  if (diceEl) {
    if (ds) {
      diceEl.innerHTML = Dice3D.buildFlatPreviewHtml(ds, 5);
    } else {
      diceEl.innerHTML = '<span class="cosmetic-dice-fallback">🎲</span>';
    }
  }
  $('#profile-level-label').textContent = t('profile.level', { n: profile.level });
  $('#profile-xp-fill').style.width = `${Math.min(100, (profile.xpIntoLevel / profile.xpForNext) * 100)}%`;
  $('#profile-xp-label').textContent = `${profile.xpIntoLevel} / ${profile.xpForNext} XP`;
  $('#stat-played').textContent = profile.stats.played;
  $('#stat-wins').textContent = profile.stats.wins;
  $('#stat-rate').textContent = profile.stats.played ? `${Math.round((profile.stats.wins / profile.stats.played) * 100)}%` : '0%';
  $('#stat-streak').textContent = `${profile.stats.streak || 0}${(profile.stats.streak || 0) >= 5 ? ' 🔥' : ''}`;
  $('#stat-beststreak').textContent = profile.stats.bestStreak || 0;
  $('#stat-coins').textContent = profile.coins.toLocaleString('fr-FR');
  $('#stat-pawns').textContent = profile.ownedPawns.length;
  const remaining = profile.renamesRemaining ?? 2;
  const limit = profile.renamesLimit ?? 2;
  const hint = $('#rename-limit-hint');
  const btnRename = $('#btn-rename');
  if (hint) {
    hint.textContent = t('profile.rename_remaining', { n: remaining, max: limit });
    hint.classList.toggle('rename-limit-zero', remaining <= 0);
  }
  if (btnRename) btnRename.disabled = remaining <= 0;
}

$('#btn-promo').addEventListener('click', async () => {
  const code = $('#promo-input').value.trim();
  if (!code) return toast(t('profile.promo_empty'), 'error');
  try {
    const data = await api('/api/promo/redeem', 'POST', { code });
    profile = data.profile;
    $('#promo-input').value = '';
    const r = data.result;
    let msg = `${t('toast.promo_ok')} `;
    if (r.rewards.coins) msg += t('toast.promo_coins', { n: r.rewards.coins }) + ' ';
    if (r.rewards.premiumPass) msg += t('toast.promo_premium') + ' ';
    if (r.rewards.pawns) msg += t('toast.promo_pawns', { n: r.rewards.pawns.length });
    toast(msg, 'success');
    renderProfileChip();
    renderProfileTab();
    passData = null;
  } catch (e) { toast(e.message, 'error'); }
});
$('#promo-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-promo').click(); });

$('#btn-open-settings').addEventListener('click', openSettings);

$('#btn-rename').addEventListener('click', async () => {
  const newName = $('#rename-input').value.trim();
  if (newName.length < 2) return toast(t('profile.name_short'), 'error');
  try {
    const data = await api('/api/profile/rename', 'POST', { displayName: newName });
    profile = data.profile;
    $('#rename-input').value = '';
    toast(t('profile.renamed'), 'success');
    renderProfileChip();
    renderProfileTab();
    socket.emit('refresh_profile');
  } catch (e) { toast(mapAuthError(e.message), 'error'); }
});

// ===================== Salon =====================
let myGameId = null;
let isHost = false;
const ACTIVE_ROOM_KEY = 'rdm_active_room';

function saveActiveRoom(code, playerId) {
  if (code && playerId) localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ code, playerId }));
}
function clearActiveRoom() {
  localStorage.removeItem(ACTIVE_ROOM_KEY);
}
function tryRejoinRoom() {
  const raw = localStorage.getItem(ACTIVE_ROOM_KEY);
  if (!raw || !socket.authed) return;
  try {
    const { code, playerId } = JSON.parse(raw);
    if (code && playerId) socket.emit('rejoin_room', { roomCode: code, playerId });
  } catch (_) {}
}

socket.on('auth_ok', (d) => {
  socket.authed = true;
  if (d.profile) { profile = d.profile; renderProfileChip(); }
  tryRejoinRoom();
});
socket.on('auth_failed', () => { /* session invalide gérée par HTTP */ });
socket.on('profile_update', (d) => { profile = d.profile; renderProfileChip(); });
socket.on('error_msg', (msg) => toast(msg, 'error'));
socket.on('left_room', () => {
  clearActiveRoom();
  inActiveGame = false;
  lastGameStartTime = 0;
  resetGameAnimationState();
  showScreen('screen-hub');
  switchTab('play');
});

socket.on('joined', ({ roomCode, playerId, isHost: host }) => {
  myGameId = playerId;
  isHost = host;
  saveActiveRoom(roomCode, playerId);
  hide($('#quick-status'));
});

socket.on('room_update', (room) => {
  if (room.started) {
    if (!inActiveGame) {
      inActiveGame = true;
      lastGameStartTime = 0;
      resetGameAnimationState();
    }
    showScreen('screen-game');
    $('#room-label').textContent = room.code;
  } else {
    inActiveGame = false;
    lastGameStartTime = 0;
    resetGameAnimationState();
    showScreen('screen-lobby');
    renderLobby(room);
  }
});

const STARTING_MONEY_TABLE = { 2: '100 M€', 3: '66 M€', 4: '50 M€', 5: '40 M€', 6: '33 M€' };

function renderLobby(room) {
  $('#lobby-title').textContent = room.name;
  $('#lobby-code').textContent = room.code;
  $('#lobby-visibility').textContent = room.isPublic ? t('lobby.public') : t('lobby.private');

  // Montant de départ selon le nombre de joueurs
  const n = Math.min(6, Math.max(2, room.players.length));
  const playersWord = room.players.length > 1 ? t('lobby.players') : t('lobby.player');
  $('#lobby-money').textContent = t('lobby.capital', { n: room.players.length, players: playersWord, money: STARTING_MONEY_TABLE[n] });

  // Compte à rebours d'auto-lancement (parties publiques)
  const cd = $('#lobby-countdown');
  if (room.countdownEnd) {
    const remaining = Math.max(0, Math.ceil((room.countdownEnd - Date.now()) / 1000));
    cd.textContent = t('lobby.countdown', { s: remaining });
    show(cd);
  } else {
    hide(cd);
  }

  const list = $('#player-list');
  list.innerHTML = room.players
    .map(
      (p) => {
        const removeBtn = isHost && p.isBot ? `<button class="remove-bot" data-bot="${p.id}" title="Retirer">✕</button>` : '';
        const tag = p.isBot ? '<span class="bot-tag">BOT</span>' : `<span class="${p.ready ? 'ready-badge' : 'waiting-badge'}">${p.ready ? t('lobby.ready') : t('lobby.waiting')}</span>`;
        return `
    <li>
      <span class="pl-pawn">${pawnEmojiMap[p.pawn] || '🔘'}</span>
      <span class="pl-name">${escapeHtml(p.name)}${honorTitleBadge(p.honorTitle)}${p.id === myGameId ? t('lobby.you') : ''}${p.id === room.hostId ? ' 👑' : ''}${p.isBot ? '' : ` · ${t('chip.level', { n: p.level || 1 })}`}</span>
      ${tag}${removeBtn}
    </li>`;
      }
    )
    .join('');

  list.querySelectorAll('.remove-bot').forEach((b) =>
    b.addEventListener('click', () => socket.emit('remove_bot', { botId: b.dataset.bot }))
  );

  const me = room.players.find((p) => p.id === myGameId);
  const btnReady = $('#btn-ready');
  btnReady.textContent = me?.ready ? t('lobby.unready') : t('lobby.ready');
  btnReady.className = me?.ready ? 'btn btn-danger' : 'btn btn-secondary';

  const botControls = $('#bot-controls');
  const btnStart = $('#btn-start');
  if (isHost) {
    show(botControls);
    $('#btn-add-bot').disabled = room.players.length >= room.maxPlayers;
    $('#btn-remove-bot').disabled = !room.players.some((p) => p.isBot);
    show(btnStart);
    btnStart.disabled = room.players.length < 2 || !room.players.every((p) => p.ready);
  } else {
    hide(botControls);
    hide(btnStart);
  }

  const inviteUrl = `${location.origin}${location.pathname}?join=${encodeURIComponent(room.code)}`;
  const linkEl = $('#lobby-invite-link');
  if (linkEl) linkEl.value = inviteUrl;
  const copyBtn = $('#btn-copy-invite');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast(t('lobby.invite_copied'), 'success');
      } catch (_) {
        linkEl?.select();
        document.execCommand('copy');
        toast(t('lobby.invite_copied'), 'success');
      }
    };
  }
}

$('#btn-ready').addEventListener('click', () => socket.emit('toggle_ready'));
$('#btn-start').addEventListener('click', () => socket.emit('start_game'));
$('#btn-leave-lobby').addEventListener('click', () => socket.emit('leave_room'));
$('#btn-add-bot').addEventListener('click', () => socket.emit('add_bot'));
$('#btn-remove-bot').addEventListener('click', () => socket.emit('remove_bot', {}));

// ===================== Récompenses de fin =====================
socket.on('match_reward', ({ isWinner, reward, profile: newProfile }) => {
  profile = newProfile;
  renderProfileChip();
  const box = $('#reward-box');
  let lines = `
    <div class="rw-line"><span>${isWinner ? t('reward.win') : t('reward.participation')}</span></div>`;
  if (reward.coins > 0) {
    lines += `<div class="rw-line"><span>${t('reward.coins')}</span><span class="rw-amount">+${reward.coins.toLocaleString('fr-FR')} 💰</span></div>`;
  }
  lines += `<div class="rw-line"><span>${t('reward.xp')}</span><span class="rw-amount">+${reward.xp} XP</span></div>`;
  if (reward.streakBonus > 0) {
    const capped = reward.currentStreak >= (reward.maxStreak || 5);
    lines += `<div class="rw-line streak"><span>${t('reward.streak', { n: reward.currentStreak, max: capped ? t('reward.streak_max') : '' })}</span><span class="rw-amount">+${reward.streakBonus} XP</span></div>`;
  }
  if (reward.hasBots) {
    lines += `<div class="rw-line bot-note"><span>${t('reward.bot')}</span></div>`;
  }
  box.innerHTML = lines;
  show(box);
});

$('#btn-back-hub').addEventListener('click', () => {
  hide($('#winner-overlay'));
  socket.emit('leave_room');
  passData = null;
  showScreen('screen-hub');
  switchTab('play');
});

// ===================== Jeu =====================
let gameState = null;
const DICE_ROLL_MIN_MS = 1400;
const DICE_POST_REVEAL_MS = 1200;
const PAWN_STEP_MS = 380;
const PAWN_POST_ARRIVE_MS = 1200;

function getSeqDelay(ms) {
  return settings.reduceMotion ? 0 : ms;
}
let diceRollSession = { active: false, start: 0, result: null, timer: null };
let lastDisplayedRollId = 0;
let lastGameStartTime = 0;
let inActiveGame = false;
let lastAnimatedRollId = '';
let pawnMoveSession = { active: false, waitingDice: false, playerId: null, path: [], pathIndex: -1, displayPos: null, timer: null };
let landingPauseActive = false;
let landingPauseTimer = null;
let pendingNewsReveal = null;
let selectedTitles = new Set();
let resourcesData = {};
const DEFAULT_ROYALTY_THRESHOLDS = [30, 50, 70, 90];
const ROYALTY_MAX_90 = {
  or: 8000000, cobalt: 8000000,
  plomb: 10000000, the: 10000000, laine: 10000000, cafe: 10000000,
  coton: 12000000,
  uranium: 14000000, charbon: 14000000,
  sucre: 16000000, gaz: 16000000, riz: 16000000,
  ble: 18000000, fer: 18000000, mais: 18000000, eolien: 18000000, tourisme: 18000000,
  bois: 20000000,
  hydraulique: 22000000,
  petrole: 24000000,
};
const ROYALTY_DEFAULT_MAX = 12000000;
const RESOURCE_ORDER = [
  'aluminium', 'ble', 'bois', 'cacao', 'cafe', 'charbon', 'cobalt', 'coton', 'cuivre', 'eolien', 'fer', 'gaz',
  'hydraulique', 'laine', 'mais', 'or', 'petrole', 'plomb', 'riz', 'solaire', 'sucre', 'the', 'tourisme', 'uranium',
];

function computeRoyaltiesForResource(resourceId) {
  const max90 = ROYALTY_MAX_90[resourceId] || ROYALTY_DEFAULT_MAX;
  return [
    { min: 30, amount: Math.round(max90 * 0.05) },
    { min: 50, amount: Math.round(max90 * 0.25) },
    { min: 70, amount: Math.round(max90 * 0.5) },
    { min: 90, amount: max90 },
  ];
}

function enrichResourcesData(resources) {
  for (const [id, res] of Object.entries(resources)) {
    res.royalties = computeRoyaltiesForResource(id);
  }
  return resources;
}

const ZONE_COLORS = {
  europe: '#7dce82', russie: '#1e6b3a', usa: '#c0392b', amerique: '#e67e22',
  asie: '#3498db', oceanie: '#e91e8c', afrique: '#9b59b6',
};
const COUNTRY_ZONE = {
  france: 'europe', allemagne: 'europe', europe_med: 'europe', royaume_uni: 'europe',
  norvege: 'europe', europe_est: 'europe', russie: 'russie', usa: 'usa',
  canada: 'amerique', bresil: 'amerique', amerique_centrale: 'amerique', cuba: 'amerique',
  pays_andins: 'amerique', argentine: 'amerique', mexique: 'amerique',
  chine: 'asie', inde: 'asie', japon: 'asie', indonesie: 'asie', asie_sud: 'asie',
  peninsule_indienne: 'asie', moyen_orient: 'asie',
  australie: 'oceanie', oceanie: 'oceanie',
  afrique_australe: 'afrique', afrique_centrale: 'afrique', afrique_est: 'afrique', afrique_ouest: 'afrique',
};

async function loadResourcesData() {
  try {
    const data = await api('/api/resources', 'GET');
    resourcesData = enrichResourcesData(data.resources || {});
  } catch (_) {
    try {
      const res = await fetch('/data/resources.json');
      if (res.ok) {
        const data = await res.json();
        resourcesData = enrichResourcesData(data.resources || {});
      }
    } catch (__) {}
  }
}

function getRoyaltiesForResource(resourceId) {
  const res = getResourceInfo(resourceId);
  if (res?.royalties?.length) return res.royalties;
  return computeRoyaltiesForResource(resourceId);
}

function buildMyTitlesRoyaltiesHtml(resourceId, ownedPct) {
  const tiers = getRoyaltiesForResource(resourceId);
  const currentRoyalty = royaltyForPercent(ownedPct, resourceId);
  const status = ownedPct >= 30
    ? `<div class="mtr-current">${t('titles.current_royalty', { pct: ownedPct, amount: formatMoneyPdf(currentRoyalty) })}</div>`
    : `<div class="mtr-below-min">${t('titles.royalty_min', { pct: ownedPct })}</div>`;
  const tierRows = tiers.map((r) => {
    const active = ownedPct >= r.min;
    return `<div class="mtr-tier${active ? ' active' : ''}"><span>${r.min}%</span><span>${formatMoneyPdf(r.amount)}</span></div>`;
  }).join('');
  return `
    <div class="my-titles-royalties-pop" role="tooltip">
      <div class="mtr-label">${t('titles.royalties')}</div>
      ${status}
      <div class="mtr-tiers">${tierRows}</div>
    </div>`;
}

function buildResourceRoyaltiesRowHtml(resourceId) {
  const tiers = getRoyaltiesForResource(resourceId);
  const cells = tiers.map((r) =>
    `<td><span class="roy-tier-pct">${r.min}%</span><span class="roy-tier-amt">${formatMoneyPdf(r.amount)}</span></td>`
  ).join('');
  return `
    <table class="resource-royalties-once">
      <thead>
        <tr>
          <th colspan="4">${t('titles.royalties')} — ${t('resources.royalties_once')}</th>
        </tr>
      </thead>
      <tbody><tr>${cells}</tr></tbody>
    </table>`;
}

function buildTitleRoyaltiesCompactHtml(resourceId, totalPct) {
  const tiers = getRoyaltiesForResource(resourceId);
  const headCells = tiers.map((tier) => `<th>${tier.min}%</th>`).join('');
  const bodyCells = tiers.map((tier) => {
    const active = totalPct >= tier.min;
    return `<td class="${active ? 'tc-roy-active' : ''}"><span class="roy-tier-amt">${formatMoneyPdf(tier.amount)}</span></td>`;
  }).join('');
  const afterBuy = totalPct > 0
    ? (totalPct >= 30
      ? `<div class="tc-roy-you">${t('titles.if_buy_royalty', { pct: totalPct })} <strong>${formatMoneyPdf(royaltyForPercent(totalPct, resourceId))}</strong> / passage</div>`
      : `<div class="tc-roy-you tc-roy-below">${t('titles.if_buy_royalty', { pct: totalPct })} — ${t('titles.royalty_min', { pct: totalPct })}</div>`)
    : '';
  return `
    <div class="tc-royalties">
      <div class="tc-roy-label">${t('board.royalty_tiers')}</div>
      <table class="resource-royalties-once tc-royalties-inline">
        <thead><tr>${headCells}</tr></thead>
        <tbody><tr>${bodyCells}</tr></tbody>
      </table>
      ${afterBuy}
    </div>`;
}

function buildTitleCardHtml(title, { selectable = false, showRoyalties = false, ownedPctBase = 0 } = {}) {
  const res = getResourceInfo(title.resourceId);
  const color = res?.color || '#3498db';
  const check = selectable ? `<input type="checkbox" class="tc-check" value="${title.id}">` : '';
  const totalPct = ownedPctBase + (title.percent || 0);
  const royaltiesHtml = showRoyalties ? buildTitleRoyaltiesCompactHtml(title.resourceId, totalPct) : '';
  return `
    <div class="title-card" style="--res-color:${color}" data-title-id="${title.id}">
      ${check}
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-country">${escapeHtml(title.country)}</div>
          <div class="tc-resource">${escapeHtml(title.resourceName)}</div>
        </div>
        <div class="tc-bottom">
          <div class="tc-pct-block"><span class="tc-pct-val">${title.percent}<span class="tc-pct-unit">%</span></span></div>
          <div class="tc-price-block">
            <span class="tc-price-label">${t('titles.buy_price')}</span>
            <span class="tc-price-val">${formatMoney(title.price)}</span>
          </div>
          ${royaltiesHtml}
        </div>
      </div>
    </div>`;
}

function buildResourceAccordionHtml(resId, res) {
  const countryRows = (res.titles || []).map((ti) =>
    `<tr>
      <td>${escapeHtml(ti.country)}</td>
      <td class="pct-cell">${ti.percent}%</td>
      <td class="price-cell">${formatMoneyPdf(ti.price)}</td>
    </tr>`
  ).join('');
  return `
    <div class="resource-accordion-item" data-res-id="${resId}" style="--res-color:${res.color}">
      <button type="button" class="resource-accordion-head" aria-expanded="false">
        <span class="res-dot-lg" style="background:${res.color}"></span>
        <span class="resource-accordion-title">${escapeHtml(res.name)}</span>
        <span class="resource-accordion-toggle" aria-hidden="true">+</span>
      </button>
      <div class="resource-accordion-body hidden">
        ${buildResourceRoyaltiesRowHtml(resId)}
        <table class="resource-ref-table">
          <thead>
            <tr>
              <th>${t('resources.country')}</th>
              <th>${t('resources.percent')}</th>
              <th>${t('resources.price')}</th>
            </tr>
          </thead>
          <tbody>${countryRows}</tbody>
        </table>
      </div>
    </div>`;
}

function bindResourceAccordion() {
  $$('.resource-accordion-head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.resource-accordion-item');
      const body = item?.querySelector('.resource-accordion-body');
      const toggle = btn.querySelector('.resource-accordion-toggle');
      if (!body || !toggle) return;
      const open = body.classList.toggle('hidden');
      const isOpen = !open;
      btn.setAttribute('aria-expanded', String(isOpen));
      toggle.textContent = isOpen ? '−' : '+';
      item.classList.toggle('open', isOpen);
    });
  });
}

function renderResourcesGuide() {
  const body = $('#resources-body');
  if (!body) return;
  const items = RESOURCE_ORDER
    .filter((id) => resourcesData[id])
    .map((id) => buildResourceAccordionHtml(id, resourcesData[id]));
  body.innerHTML = `
    <p class="resources-footnote">${t('resources.footnote')}</p>
    <div class="resources-accordion">${items.join('')}</div>`;
  bindResourceAccordion();
}

async function openResourcesGuide() {
  await loadResourcesData();
  renderResourcesGuide();
  show($('#resources-overlay'));
}

function getResourceInfo(resourceId) {
  if (!resourceId) return null;
  return resourcesData[resourceId] || null;
}

function getZoneForSpace(space) {
  if (space.type === 'country' && space.countryId) return COUNTRY_ZONE[space.countryId] || 'europe';
  if (space.type === 'continental' && space.continent) {
    const m = { europe: 'europe', amerique: 'amerique', asie: 'asie', afrique: 'afrique', oceanie: 'oceanie' };
    return m[space.continent] || 'europe';
  }
  return null;
}

function getSpaceRegionLabel(space) {
  if (space.type === 'world') return t('board.zone.world');
  const zone = getZoneForSpace(space);
  if (zone) return t(`board.zone.${zone}`) || zone;
  return '';
}

function royaltyForPercent(pct, resourceId) {
  let amount = 0;
  for (const tier of getRoyaltiesForResource(resourceId)) {
    if (pct >= tier.min) amount = tier.amount;
  }
  return amount;
}

function getOwnersForResource(state, resourceId) {
  if (!resourceId) return [];
  const owners = {};
  for (const p of state.players) {
    if (p.bankrupt) continue;
    const pct = p.titles.filter((t) => t.resourceId === resourceId).reduce((s, t) => s + t.percent, 0);
    if (pct >= 30) owners[p.id] = { player: p, pct, royalty: royaltyForPercent(pct, resourceId) };
  }
  return Object.values(owners);
}

function getGameStartTime(state) {
  const entry = (state.log || []).find((e) => /Partie lancée/i.test(e.message));
  return entry?.time || 0;
}

socket.on('game_state', (state) => {
  const startTime = getGameStartTime(state);
  if (startTime && startTime !== lastGameStartTime) {
    lastGameStartTime = startTime;
    resetGameAnimationState();
  }
  preparePawnMoveAnimation(state);
  gameState = state;
  renderGame(state);
});

$('#btn-surrender')?.addEventListener('click', () => {
  if (!gameState || !confirm(t('game.surrender_confirm'))) return;
  socket.emit('surrender');
});

function applyBoardGrid(grid) {
  const board = $('#board');
  if (!board || !grid) return;
  board.style.setProperty('--board-cols', String(grid.cols));
  board.style.setProperty('--board-rows', String(grid.rows));
}

function applyBoardUi(ui) {
  const set = (el, box) => {
    if (!el || !box) return;
    el.style.gridRow = `${box.rowStart} / ${box.rowEnd}`;
    el.style.gridColumn = `${box.colStart} / ${box.colEnd}`;
  };
  set($('.board-track-outer'), ui?.trackOuter);
  set($('.board-track-inner'), ui?.trackInner);
  set($('.board-center'), ui?.center);
  const inner = $('.board-track-inner');
  if (inner) inner.style.clipPath = ui?.trackInner?.clipPath || 'none';
}

function getBoardPositions(state) {
  if (state.boardPositions?.length) return state.boardPositions;
  const count = state.board?.length || 0;
  const cols = state.boardGrid?.cols || 22;
  const rows = state.boardGrid?.rows || 15;
  const maxR = rows - 1;
  const maxC = cols - 1;
  const allemagneCol = maxC - 1;
  const outerEnd = state.outerLoopEnd ?? 36;
  const outerLen = outerEnd + 1;
  const innerLen = count - outerLen;
  const path = [];

  path.push({ row: maxR, col: maxC });
  path.push({ row: maxR, col: allemagneCol });
  for (let c = allemagneCol - 1; c >= 0 && path.length < outerLen; c--) path.push({ row: maxR, col: c });
  for (let r = maxR - 1; r >= 1 && path.length < outerLen; r--) path.push({ row: r, col: 0 });
  if (path.length < outerLen) path.push({ row: 0, col: 0 });
  if (path.length < outerLen) path.push({ row: 0, col: 1 });
  while (path.length < outerLen) path.push({ row: 0, col: Math.min(path.length, maxC - 1) });
  if (path.length > outerLen) path.length = outerLen;

  const inner = [];
  for (let c = 2; c <= maxC; c++) inner.push({ row: 0, col: c });
  for (let r = 1; r <= maxR - 1; r++) inner.push({ row: r, col: maxC });
  for (let c = maxC - 1; c >= 2; c--) inner.push({ row: maxR - 1, col: c });
  for (let r = maxR - 2; r >= 2; r--) inner.push({ row: r, col: 2 });
  if (innerLen > 0) inner[innerLen - 1] = { row: maxR - 1, col: allemagneCol };
  while (inner.length < innerLen) inner.push({ row: maxR - 1, col: allemagneCol });
  if (inner.length > innerLen) inner.length = innerLen;

  return [...path, ...inner];
}

function formatRoyalty(amount) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)} M€`;
  return `${(amount / 1000).toFixed(0)} k€`;
}

function titlesForCountryAndResource(countryId, resourceId) {
  const list = [];
  const resources = resourceId && resourcesData[resourceId]
    ? [[resourceId, resourcesData[resourceId]]]
    : Object.entries(resourcesData);
  for (const [resId, res] of resources) {
    for (const ti of res.titles || []) {
      if (ti.countryId === countryId) {
        list.push({ ...ti, resourceId: resId, resourceName: res.name });
      }
    }
  }
  return list.sort((a, b) => a.price - b.price);
}

function getPurchasableTitlesForSpace(space) {
  if (space.type === 'country' && space.countryId) {
    return titlesForCountryAndResource(space.countryId, space.resource);
  }
  if (space.type === 'continental' && space.countries?.length) {
    const list = [];
    for (const cid of space.countries) {
      list.push(...titlesForCountryAndResource(cid, space.resource));
    }
    return list.sort((a, b) => a.price - b.price);
  }
  if (space.type === 'bonus' && space.resource) {
    const list = [];
    const res = resourcesData[space.resource];
    if (res?.titles) {
      for (const ti of res.titles) {
        list.push({ ...ti, resourceId: space.resource, resourceName: res.name });
      }
    }
    return list.sort((a, b) => a.price - b.price);
  }
  return [];
}

function isMultilineCountryLabel(label) {
  const t = label.trim();
  if (t.startsWith('Choix ') || t.includes(' sauf ')) return true;
  const words = t.split(/\s+/);
  if (words.length >= 3) return true;
  if (words.length === 2 && t.length > 16) return true;
  return false;
}

function countryLabelHtml(label) {
  const multi = isMultilineCountryLabel(label);
  const cls = multi ? 'cell-country cell-country-multiline' : 'cell-country cell-country-oneline';
  return `<span class="${cls}">${escapeHtml(label)}</span>`;
}

function bonusLabelHtml() {
  return '<span class="cell-country cell-bonus-top cell-country-oneline">500&nbsp;000&nbsp;€</span>';
}

function buildCellContent(space, state, index) {
  const res = getResourceInfo(space.resource);
  const resName = res?.name || (space.resource ? space.label : '');
  const resColor = res?.color || '#888';
  const owners = space.resource ? getOwnersForResource(state, space.resource) : [];

  if (space.type === 'country') {
    return `
      ${countryLabelHtml(space.label)}
      ${resName ? `<span class="cell-resource" style="--res-color:${resColor}"><span class="res-dot"></span>${escapeHtml(resName)}</span>` : ''}`;
  }
  if (space.type === 'bonus') {
    return `
      ${bonusLabelHtml()}
      ${resName ? `<span class="cell-resource" style="--res-color:${resColor}"><span class="res-dot"></span>${escapeHtml(resName)}</span>` : ''}`;
  }
  if (space.type === 'continental') {
    return `
      ${countryLabelHtml(space.label)}
      ${resName ? `<span class="cell-resource" style="--res-color:${resColor}"><span class="res-dot"></span>${escapeHtml(resName)}</span>` : ''}`;
  }
  if (space.type === 'world') return countryLabelHtml(space.label);
  if (space.type === 'start') return `<span class="cell-start">▶ ${t('board.start')}</span>`;
  if (space.type === 'news') return `<span class="cell-special">📰 ${t('board.news')}</span>`;
  if (space.type === 'auction') return `<span class="cell-special">🔨 ${t('board.auction')}</span>`;
  if (space.type === 'customs') return `<span class="cell-special">🛃 ${t('board.customs')}</span>`;
  if (space.type === 'joker') return `<span class="cell-special">🃏 ${t('board.joker')}</span>`;
  return `<span class="cell-label">${escapeHtml(space.label)}</span>`;
}

function showCellTooltip(space, state) {
  const tip = $('#cell-tooltip');
  if (!tip) return;
  if (space.type === 'resource') { hide(tip); return; }

  const res = getResourceInfo(space.resource);
  const region = getSpaceRegionLabel(space);
  const placeName = space.label || '';
  const zone = getZoneForSpace(space);
  const zoneColor = zone && ZONE_COLORS[zone] ? ZONE_COLORS[zone] : 'var(--gold)';

  let resourceHtml = '';
  if (res?.name) {
    resourceHtml = `<div class="tip-res" style="color:${res.color || '#fff'}">${escapeHtml(res.name)}</div>`;
  }

  let ownersHtml = '';
  if (space.resource) {
    const owners = getOwnersForResource(state, space.resource);
    ownersHtml = `
      <div class="tip-label">${t('board.current_owners')}</div>
      ${owners.length
        ? owners.map((o) => `<div class="tip-owner">${escapeHtml(o.player.name)} — ${o.pct}% → ${formatMoney(o.royalty)}</div>`).join('')
        : `<div class="tip-owner muted">${t('board.no_owners')}</div>`}`;
  }

  const purchasable = getPurchasableTitlesForSpace(space);
  let pricesHtml = '';
  if (purchasable.length) {
    pricesHtml = `<div class="tip-label">${t('board.title_prices')}</div>` +
      purchasable.map((ti) =>
        `<div class="tip-tier"><span>${escapeHtml(ti.country)} — ${escapeHtml(ti.resourceName)} ${ti.percent}%</span><span>${formatMoney(ti.price)}</span></div>`
      ).join('');
  }

  tip.innerHTML = `
    <div class="tip-place">${escapeHtml(placeName)}</div>
    ${region ? `<div class="tip-region" style="color:${zoneColor}">${escapeHtml(region)}</div>` : ''}
    ${resourceHtml}
    ${pricesHtml}
    ${ownersHtml}`;
  show(tip);
}

function getPlayerBoardPosition(player, state) {
  if (pawnMoveSession.active && pawnMoveSession.playerId === player.id && pawnMoveSession.displayPos != null) {
    return pawnMoveSession.displayPos;
  }
  return player.position;
}

function renderBoard(state) {
  const board = $('#board');
  board.querySelectorAll('.board-cell').forEach((el) => el.remove());
  applyBoardGrid(state.boardGrid || { cols: 24, rows: 17 });
  applyBoardUi(state.boardUi);
  const positions = getBoardPositions(state);
  const showDepart = state.players.some((p) => !p.bankrupt && getPlayerBoardPosition(p, state) === 0);
  state.board.forEach((space, index) => {
    if (space.type === 'resource') return;
    if (space.type === 'start' && !showDepart) return;
    const pos = positions[index];
    if (!pos) return;
    const cell = document.createElement('div');
    const zone = getZoneForSpace(space);
    const res = getResourceInfo(space.resource);
    const outerEnd = state.outerLoopEnd ?? 36;
    const loopRing = index <= outerEnd ? 'loop-outer' : 'loop-inner';
    cell.className = `board-cell ${loopRing} type-${space.type}${zone ? ` zone-${zone}` : ''}`;
    cell.style.gridRow = pos.row + 1;
    cell.style.gridColumn = pos.col + 1;
    if (res?.color && space.type === 'country') {
      cell.style.setProperty('--tile-accent', res.color);
    }
    if (zone && ZONE_COLORS[zone]) {
      cell.style.setProperty('--zone-color', ZONE_COLORS[zone]);
    }
    const playersHere = state.players.filter((p) => !p.bankrupt && getPlayerBoardPosition(p, state) === index);
    const current = state.players[state.currentPlayerIndex];
    const movingHere = pawnMoveSession.active && pawnMoveSession.displayPos === index;
    if (playersHere.some((p) => current?.id === p.id) || movingHere) cell.classList.add('active-cell');
    if (movingHere) cell.classList.add('pawn-landing-cell');
    if (space.resource && getOwnersForResource(state, space.resource).length) cell.classList.add('has-royalties');
    cell.innerHTML = `
      <div class="cell-body">${buildCellContent(space, state, index)}</div>
      <div class="pions-container">
        ${playersHere.map((p) => `<span class="pion-emoji pion-ring" style="color:${p.color}" title="${escapeHtml(p.name)}">${pawnEmojiMap[p.pawn] || '🔘'}</span>`).join('')}
      </div>`;
    cell.addEventListener('mouseenter', () => showCellTooltip(space, state));
    cell.addEventListener('mouseleave', () => hide($('#cell-tooltip')));
    cell.addEventListener('click', () => {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      showCellTooltip(space, state);
    });
    board.appendChild(cell);
  });
}

const TEAM_COLORS = ['#3aa0ff', '#2ecc71', '#e84393'];
function teamBadge(state, p) {
  if (p.team === null || p.team === undefined) return '';
  const teams = [...new Set(state.players.filter((x) => x.team !== null).map((x) => x.team))];
  const idx = teams.indexOf(p.team);
  const color = TEAM_COLORS[idx % TEAM_COLORS.length];
  return `<span class="team-badge" style="background:${color}33;color:${color}">🤝 ${t('team.badge', { n: idx + 1 })}</span>`;
}

function renderPlayersPanel(state) {
  const current = state.players[state.currentPlayerIndex];
  $('#players-panel').innerHTML = state.players
    .map(
      (p) => `
    <div class="player-card player-card-clickable ${p.id === current?.id ? 'current' : ''} ${p.bankrupt ? 'bankrupt' : ''}" data-player-id="${p.id}" title="${t('game.player_titles_hint')}" role="button" tabindex="0">
      <span class="pc-pawn">${pawnEmojiMap[p.pawn] || '🔘'}</span>
      <span class="player-card-name">${escapeHtml(p.name)}${honorTitleBadge(p.honorTitle)}${p.id === myGameId ? ' ★' : ''}${p.isBot ? ' 🤖' : ''}${teamBadge(state, p)}</span>
      <span class="player-money">${formatMoney(p.money)}</span>
      <span class="player-title-count">${p.titles?.length || p.titleCount || 0} 📜</span>
    </div>`
    )
    .join('');
}

function renderLog(state) {
  $('#game-log').innerHTML = (state.log || []).map((e) => `<div class="log-entry">${escapeHtml(e.message)}</div>`).join('');
}

function buildPlayerTitlesHtml(player) {
  if (!player?.titles?.length) {
    return `<p style="color:var(--text-muted);font-size:0.85rem">${t('titles.none')}</p>`;
  }
  const groups = {};
  for (const ti of player.titles) {
    if (!groups[ti.resourceId]) groups[ti.resourceId] = { name: ti.resourceName, titles: [] };
    groups[ti.resourceId].titles.push(ti);
  }
  const resInfo = (id) => getResourceInfo(id);
  return Object.entries(groups)
    .map(([id, g]) => {
      const pct = g.titles.reduce((s, ti) => s + ti.percent, 0);
      const monopoly = pct >= 50 ? `<span class="monopoly-badge">${t('titles.monopoly')}</span>` : '';
      const color = resInfo(id)?.color || '#3498db';
      return `
      <div class="resource-group resource-group-interactive" data-resource-id="${id}" style="--res-color:${color}">
        <button type="button" class="resource-group-header" aria-expanded="false" title="${t('titles.royalties_hint')}">
          <span class="res-dot-sm" style="background:${color}"></span>
          <span class="resource-group-name">${escapeHtml(g.name)}${monopoly}</span>
          <span class="pct">${pct}%</span>
        </button>
        ${buildMyTitlesRoyaltiesHtml(id, pct)}
        <div class="resource-group-chips">${g.titles.map((title) => `<span class="title-chip">${escapeHtml(title.country || '')} ${title.percent}%</span>`).join('')}</div>
      </div>`;
    })
    .join('');
}

function openPlayerTitles(playerId) {
  if (!gameState) return;
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return;
  closeTitlesRoyaltiesPanels();
  $('#player-titles-heading').textContent = t('game.player_titles', { name: player.name });
  $('#player-titles-body').innerHTML = buildPlayerTitlesHtml(player);
  show($('#player-titles-overlay'));
}

function renderMyTitles(state) {
  const me = state.players.find((p) => p.id === myGameId);
  $('#my-titles').innerHTML = buildPlayerTitlesHtml(me);
}

function hideBuyTitlesOverlay() {
  hide($('#buy-titles-overlay'));
}

function renderBuyTitlesOverlay(action) {
  const overlay = $('#buy-titles-overlay');
  if (!overlay) return;
  const max = action.maxTitles || 6;
  const desc = $('#buy-titles-desc');
  if (desc) desc.innerHTML = t('action.buy_desc', { max });

  const list = $('#buy-titles-list');
  if (!list) return;
  list.innerHTML = '';
  list.className = 'title-cards-grid';
  selectedTitles = new Set();

  const me = gameState?.players?.find((p) => p.id === myGameId);
  const pctOwnedFor = (resourceId) => (me?.titles || [])
    .filter((t) => t.resourceId === resourceId)
    .reduce((s, t) => s + t.percent, 0);

  const available = Array.isArray(action.available) ? action.available : [];
  if (!available.length) {
    list.innerHTML = `<p class="action-desc muted">${t('action.no_titles')}</p>`;
  } else {
    if (action.linkedResource) {
      const res = getResourceInfo(action.linkedResource);
      const intro = document.createElement('div');
      intro.className = 'buy-royalties-intro';
      intro.innerHTML = `
        <p class="buy-royalties-title">${t('action.case_royalties_paid', { resource: res?.name || action.linkedResource })}</p>
        ${buildResourceRoyaltiesRowHtml(action.linkedResource)}`;
      list.appendChild(intro);
    }
    available.forEach((ti) => {
      const wrap = document.createElement('label');
      wrap.className = 'title-card-select';
      wrap.innerHTML = buildTitleCardHtml(ti, {
        selectable: true,
        showRoyalties: true,
        ownedPctBase: pctOwnedFor(ti.resourceId),
      });
      const card = wrap.querySelector('.title-card');
      const input = wrap.querySelector('.tc-check');
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (selectedTitles.size >= max) { e.target.checked = false; return; }
          selectedTitles.add(ti.id);
          card.classList.add('selected');
        } else {
          selectedTitles.delete(ti.id);
          card.classList.remove('selected');
        }
        updateBuySummary(available, $('#buy-titles-summary'));
      });
      list.appendChild(wrap);
    });
  }

  updateBuySummary(available, $('#buy-titles-summary'));
  const ownedEl = $('#buy-titles-owned');
  if (ownedEl && action.linkedResource) {
    const owned = (me?.titles || []).filter((ti) => ti.resourceId === action.linkedResource);
    if (owned.length) {
      const pct = owned.reduce((s, ti) => s + ti.percent, 0);
      ownedEl.innerHTML = `<h4>${t('titles.royalties')} — ${escapeHtml(owned[0].resourceName || '')}</h4>${buildMyTitlesRoyaltiesHtml(action.linkedResource, pct)}`;
      show(ownedEl);
    } else hide(ownedEl);
  } else if (ownedEl) hide(ownedEl);
  show(overlay);

  const confirmBtn = $('#btn-confirm-buy-modal');
  const skipBtn = $('#btn-skip-buy-modal');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      hideBuyTitlesOverlay();
      socket.emit('buy_titles', { titleIds: [...selectedTitles] });
    };
  }
  if (skipBtn) {
    skipBtn.onclick = () => {
      hideBuyTitlesOverlay();
      socket.emit('buy_titles', { titleIds: [] });
    };
  }
}

function renderActions(state) {
  const area = $('#action-area');
  const me = state.players.find((p) => p.id === myGameId);
  const current = state.players[state.currentPlayerIndex];
  const isMyTurn = current?.id === myGameId && !me?.bankrupt;
  const action = state.pendingAction;
  const wantsBuy = action?.type === 'buy_titles' && isMyTurn;
  const canShowBuy = wantsBuy && !isGameSequenceActive();
  area.innerHTML = '';
  if (!canShowBuy) hideBuyTitlesOverlay();
  if (state.winner) return;

  if (me?.bankrupt) { area.innerHTML = `<p class="action-desc">${t('game.bankrupt')}</p>`; return; }

  const indicator = $('#turn-indicator');
  if (isMyTurn) { indicator.textContent = t('turn.you'); indicator.classList.add('my-turn'); }
  else { indicator.textContent = t('turn.other', { name: current?.name || '...' }); indicator.classList.remove('my-turn'); }

  // Proposition sortante en attente (échange / alliance)
  if (state.outgoingTrade) {
    area.innerHTML = `<div class="outgoing-status">${t('trade.outgoing', { name: escapeHtml(state.outgoingTrade.toName) })}<button class="btn btn-secondary" id="btn-cancel-social">${t('common.cancel')}</button></div>`;
    $('#btn-cancel-social').addEventListener('click', () => socket.emit('cancel_trade'));
    return;
  }
  if (state.outgoingAlliance) {
    area.innerHTML = `<div class="outgoing-status">${t('alliance.outgoing', { name: escapeHtml(state.outgoingAlliance.toName) })}<button class="btn btn-secondary" id="btn-cancel-social">${t('common.cancel')}</button></div>`;
    $('#btn-cancel-social').addEventListener('click', () => socket.emit('cancel_trade'));
    return;
  }

  if (action?.type === 'royalty_due' && action.playerId === myGameId) {
    const ownersHtml = (action.owners || []).length
      ? `<div class="royalty-due-owners">${(action.owners || []).map((o) =>
          `<div class="royalty-due-row">${escapeHtml(o.ownerName)} — ${o.percent}% → <strong>${formatMoney(o.royalty)}</strong></div>`
        ).join('')}</div>`
      : '';
    area.innerHTML = `
      <p class="action-desc">${t('action.royalty_due', { amount: formatMoney(action.totalDue), resource: escapeHtml(action.resourceName) })}</p>
      ${ownersHtml}
      <p class="action-desc muted">${t('action.royalty_trade_hint')}</p>
      <div class="action-buttons">
        <button class="btn btn-primary" id="btn-pay-royalties">${t('action.pay_royalties')}</button>
        <button class="btn btn-secondary" id="btn-open-trade-royalty">${t('social.trade_btn')}</button>
        ${canProposeAlliance(state, me) ? `<button class="btn btn-secondary" id="btn-open-ally-royalty">${t('social.ally_btn')}</button>` : ''}
      </div>`;
    $('#btn-pay-royalties').addEventListener('click', () => socket.emit('pay_royalties'));
    $('#btn-open-trade-royalty').addEventListener('click', () => openTradeModal(state));
    $('#btn-open-ally-royalty')?.addEventListener('click', () => openAlliancePicker(state));
    return;
  }

  if (state.phase === 'rolling' && isMyTurn) {
    if (!state.diceResult && isGameSequenceActive()) {
      clearPawnMoveTimer();
      if (landingPauseTimer) { clearTimeout(landingPauseTimer); landingPauseTimer = null; }
      landingPauseActive = false;
      pawnMoveSession.active = false;
      pawnMoveSession.waitingDice = false;
      pawnMoveSession.displayPos = null;
      diceRollSession.active = false;
      diceRollSession.result = null;
    }
    area.innerHTML = `<p class="action-desc">${t('action.roll_desc')}</p><div class="action-buttons"><button class="btn btn-primary" id="btn-roll">${t('action.roll_btn')}</button></div>`;
    $('#btn-roll').addEventListener('click', () => { animateDice(); socket.emit('roll_dice'); });
    appendSocialButtons(state);
    return;
  }

  if (state.diceResult) {
    preparePawnMoveAnimation(state);
    const roller = state.players[state.currentPlayerIndex];
    showDiceResult(state.diceResult.d1, state.diceResult.d2, {
      rollId: state.diceResult.rollId,
      rollerName: roller?.name || '',
    });
    if (pawnMoveSession.waitingDice && !diceRollSession.active) beginPawnMovement();
  } else if (state.phase === 'rolling') {
    hide($('#dice-area'));
    hideDiceScores();
    lastDisplayedRollId = 0;
  }

  if (wantsBuy && !canShowBuy) {
    area.innerHTML = `<p class="action-desc action-wait">${t('action.buy_after_dice')}</p>`;
    return;
  }
  if (canShowBuy) {
    area.innerHTML = `<p class="action-desc">${t('action.buy_modal_hint')}</p>`;
    renderBuyTitlesOverlay(action);
    return;
  }

  if (action?.type === 'joker_buy' && isMyTurn) {
    area.innerHTML = `<p class="action-desc">${t('action.joker_buy')}</p><div class="action-buttons"><button class="btn btn-primary" id="btn-buy-joker">${t('action.buy')}</button><button class="btn btn-secondary" id="btn-skip-joker">${t('action.skip')}</button></div>`;
    $('#btn-buy-joker').addEventListener('click', () => socket.emit('buy_joker'));
    $('#btn-skip-joker').addEventListener('click', () => socket.emit('skip_joker'));
    return;
  }

  if (action?.type === 'joker_choice' && isMyTurn) {
    area.innerHTML = `<p class="action-desc">${t('action.joker_choice')}</p><div class="action-buttons"><button class="btn btn-primary" id="btn-use-joker">${t('action.use_joker')}</button><button class="btn btn-danger" id="btn-auction-me">${t('action.participate')}</button></div>`;
    $('#btn-use-joker').addEventListener('click', () => socket.emit('use_joker'));
    $('#btn-auction-me').addEventListener('click', () => socket.emit('decline_joker'));
    return;
  }

  if (action?.type === 'auction' && state.auction) {
    const auc = state.auction;
    const remaining = Math.max(0, auc.endTime - Date.now());
    const isSeller = auc.sellerId === myGameId;
    area.innerHTML = `
      <p class="action-desc">${t('action.auction_desc', { bid: formatMoney(auc.currentBid), s: Math.ceil(remaining / 1000) })}</p>
      ${!isSeller && !me?.bankrupt ? `<div class="action-buttons"><button class="btn btn-primary" id="btn-bid">+100 k€</button><button class="btn btn-primary" id="btn-bid-big">+500 k€</button></div>` : ''}`;
    if (!isSeller && !me?.bankrupt) {
      $('#btn-bid')?.addEventListener('click', () => socket.emit('place_bid', { amount: auc.currentBid + 100000 }));
      $('#btn-bid-big')?.addEventListener('click', () => socket.emit('place_bid', { amount: auc.currentBid + 500000 }));
    }
    return;
  }

  if ((state.phase === 'end_turn' || state.phase === 'action') && isMyTurn) {
    area.innerHTML = `<div class="action-buttons"><button class="btn btn-primary" id="btn-end-turn">${t('action.end_turn')}</button></div>`;
    $('#btn-end-turn').addEventListener('click', () => socket.emit('end_turn'));
    appendSocialButtons(state);
  }
}

function estimateAllianceTax(player) {
  return Math.floor((player?.titles || []).reduce((s, t) => s + (t.price || 0), 0) / 2);
}

function canProposeAlliance(state, me) {
  if (!me || me.bankrupt || me.team != null) return false;
  return state.players.filter((p) => !p.bankrupt).length > 2
    && state.players.some((p) => p.id !== myGameId && !p.bankrupt && p.team == null);
}

// Boutons Alliance / Échange (à votre tour)
function appendSocialButtons(state) {
  const area = $('#action-area');
  const me = state.players.find((p) => p.id === myGameId);
  const others = state.players.filter((p) => p.id !== myGameId && !p.bankrupt);
  if (others.length === 0) return;

  const wrap = document.createElement('div');
  wrap.className = 'social-buttons';
  wrap.innerHTML = `
    <button class="btn btn-secondary" id="btn-open-trade">${t('social.trade_btn')}</button>
    ${canProposeAlliance(state, me) ? `<button class="btn btn-secondary" id="btn-open-ally">${t('social.ally_btn')}</button>` : ''}`;
  area.appendChild(wrap);

  $('#btn-open-trade').addEventListener('click', () => openTradeModal(state));
  $('#btn-open-ally')?.addEventListener('click', () => openAlliancePicker(state));
}

// Sélection d'un allié potentiel
function openAlliancePicker(state) {
  const area = $('#action-area');
  const me = state.players.find((p) => p.id === myGameId);
  const myTax = estimateAllianceTax(me);
  const targets = state.players.filter(
    (p) => p.id !== myGameId && !p.bankrupt && p.team == null
  );
  area.innerHTML = `
    <p class="action-desc">${t('social.ally_to')}</p>
    <p class="action-desc muted">${t('alliance.tax_hint', { tax: formatMoney(myTax) })}</p>
    <p class="action-desc muted alliance-perks">${t('social.alliance_perks')}</p>
    <div class="target-list" id="ally-targets"></div>
    <div class="action-buttons"><button class="btn btn-secondary" id="ally-cancel">${t('common.back')}</button></div>`;
  const list = $('#ally-targets');
  const proposeLabel = t('social.propose');
  if (!targets.length) {
    list.innerHTML = `<p class="muted">${t('social.no_player')}</p>`;
  }
  targets.forEach((tg) => {
    const theirTax = estimateAllianceTax(tg);
    const row = document.createElement('div');
    row.className = 'target-row alliance-target-row';
    row.innerHTML = `
      <span class="alliance-target-name">${pawnEmojiMap[tg.pawn] || '🔘'} ${escapeHtml(tg.name)}${tg.isBot ? ' 🤖' : ''}</span>
      <span class="alliance-target-tax">${t('alliance.their_tax', { tax: formatMoney(theirTax) })}</span>
      <button class="btn btn-secondary btn-sm">${proposeLabel}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      socket.emit('propose_alliance', { targetId: tg.id });
      toast(t('alliance.proposed', { name: tg.name }), 'success');
    });
    list.appendChild(row);
  });
  $('#ally-cancel').addEventListener('click', () => renderActions(gameState));
}

function renderAlliancePanel(state) {
  const panel = $('#alliance-panel');
  const body = $('#alliance-panel-body');
  if (!panel || !body) return;
  const me = state.players.find((p) => p.id === myGameId);
  if (!me || me.team === null || me.team === undefined || me.bankrupt) {
    hide(panel);
    return;
  }
  const allies = state.players.filter((p) => p.team === me.team && p.id !== myGameId && !p.bankrupt);
  if (!allies.length) { hide(panel); return; }
  show(panel);
  const allyNames = allies.map((p) => escapeHtml(p.name)).join(', ');
  const allyRows = allies.map((p) => `
    <div class="alliance-partner-row">
      <span class="alliance-partner-pawn">${pawnEmojiMap[p.pawn] || '🔘'}</span>
      <span>${escapeHtml(p.name)}${p.isBot ? ' 🤖' : ''}</span>
      <span class="alliance-partner-money">${formatMoney(p.money)}</span>
    </div>`).join('');
  body.innerHTML = `
    <p class="alliance-status-line">${t('alliance.status', { names: allyNames })}</p>
    <div class="alliance-partners">${allyRows}</div>
    <p class="muted alliance-perks">${t('social.alliance_perks')}</p>
    <button type="button" class="btn btn-danger btn-sm" id="btn-break-alliance">${t('alliance.break')}</button>`;
  $('#btn-break-alliance')?.addEventListener('click', () => {
    if (confirm(t('alliance.break_confirm'))) socket.emit('break_alliance');
  });
}

function updateBuySummary(available, summaryEl) {
  const el = summaryEl || $('#buy-titles-summary');
  if (!el) return;
  let total = 0;
  for (const id of selectedTitles) { const it = available.find((x) => x.id === id); if (it) total += it.price; }
  el.innerHTML = selectedTitles.size
    ? t('action.total_sum', { total: `${formatMoney(total)}`, n: selectedTitles.size, titles: t('action.titles_word') })
    : t('action.total_init');
}

function isGameSequenceActive() {
  return diceRollSession.active || pawnMoveSession.active || pawnMoveSession.waitingDice || landingPauseActive;
}

function resetDiceDisplay() {
  hideDiceScores();
  hide($('#dice-area'));
  hide($('#cell-tooltip'));
  lastDisplayedRollId = 0;
  if (diceRollSession.timer) { clearTimeout(diceRollSession.timer); diceRollSession.timer = null; }
  diceRollSession.active = false;
  diceRollSession.result = null;
  ensureDiceCubes();
  [$('#die1'), $('#die2')].forEach((die) => {
    if (!die) return;
    die.classList.remove('dice-wild', 'dice-landing');
    Dice3D.setCubeValue(die, 1, { animate: false });
  });
}

function resetGameAnimationState() {
  lastAnimatedRollId = '';
  clearPawnMoveTimer();
  if (landingPauseTimer) { clearTimeout(landingPauseTimer); landingPauseTimer = null; }
  landingPauseActive = false;
  pawnMoveSession = { active: false, waitingDice: false, playerId: null, path: [], pathIndex: -1, displayPos: null, timer: null };
  pendingNewsReveal = null;
  lastNewsRevealId = 0;
  dismissNewsCard();
  hide($('#landing-overlay'));
  hideBuyTitlesOverlay();
  resetDiceDisplay();
}

function clearPawnMoveTimer() {
  if (pawnMoveSession.timer) { clearTimeout(pawnMoveSession.timer); pawnMoveSession.timer = null; }
}

function simulateAdvance(from, steps, boardLen) {
  const loopEnd = boardLen - 1;
  const loopSize = loopEnd;
  let pos = from === 0 ? steps : from + steps;
  while (pos > loopEnd) pos -= loopSize;
  return pos;
}

function positionBeforeRoll(endPos, steps, boardLen) {
  for (let from = 0; from < boardLen; from++) {
    if (simulateAdvance(from, steps, boardLen) === endPos) return from;
  }
  return endPos;
}

function rollAnimationKey(state) {
  const dr = state.diceResult;
  const roller = state.players?.[state.currentPlayerIndex];
  if (!dr || !roller) return '';
  return `${dr.rollId ?? 0}:${dr.d1}+${dr.d2}:${roller.id}@${roller.position}`;
}

function buildPawnStepPath(from, steps, state) {
  const loopEnd = (state.board?.length || 1) - 1;
  const loopSize = loopEnd;
  const path = [];
  let pos = from;
  for (let i = 0; i < steps; i++) {
    if (pos === 0) pos = i + 1;
    else {
      pos += 1;
      if (pos > loopEnd) pos -= loopSize;
    }
    path.push(pos);
  }
  return path;
}

function preparePawnMoveAnimation(state) {
  if (!state?.diceResult) return;
  const key = rollAnimationKey(state);
  if (!key || key === lastAnimatedRollId) return;
  const roller = state.players[state.currentPlayerIndex];
  if (!roller || roller.bankrupt) return;
  const steps = state.diceResult.total;
  if (!steps) return;
  const boardLen = state.board?.length || 1;
  const fromPos = positionBeforeRoll(roller.position, steps, boardLen);
  const path = buildPawnStepPath(fromPos, steps, state);
  if (!path.length) return;
  lastAnimatedRollId = key;
  clearPawnMoveTimer();
  if (landingPauseTimer) { clearTimeout(landingPauseTimer); landingPauseTimer = null; }
  landingPauseActive = false;
  hide($('#landing-overlay'));
  pawnMoveSession = {
    active: true,
    waitingDice: true,
    playerId: roller.id,
    path,
    pathIndex: -1,
    displayPos: fromPos,
    timer: null,
  };
}

function beginPawnMovement() {
  if (!pawnMoveSession.active) {
    completeGameSequence();
    return;
  }
  if (!pawnMoveSession.waitingDice) return;
  pawnMoveSession.waitingDice = false;
  clearPawnMoveTimer();
  const delay = getSeqDelay(DICE_POST_REVEAL_MS);
  if (delay <= 0) {
    stepPawnForward();
    return;
  }
  pawnMoveSession.timer = setTimeout(() => {
    pawnMoveSession.timer = null;
    stepPawnForward();
  }, delay);
}

function stepPawnForward() {
  if (!pawnMoveSession.active) return;
  const stepDelay = getSeqDelay(PAWN_STEP_MS);
  if (stepDelay <= 0 && pawnMoveSession.path.length) {
    pawnMoveSession.displayPos = pawnMoveSession.path[pawnMoveSession.path.length - 1];
    pawnMoveSession.pathIndex = pawnMoveSession.path.length - 1;
    renderBoard(gameState);
    finishPawnArrival();
    return;
  }
  pawnMoveSession.pathIndex += 1;
  if (pawnMoveSession.pathIndex >= pawnMoveSession.path.length) {
    finishPawnArrival();
    return;
  }
  pawnMoveSession.displayPos = pawnMoveSession.path[pawnMoveSession.pathIndex];
  renderBoard(gameState);
  pawnMoveSession.timer = setTimeout(stepPawnForward, stepDelay);
}

function buildLandingPanelHtml(state) {
  const roller = state.players[state.currentPlayerIndex];
  if (!roller) return '';
  const space = state.board[roller.position];
  if (!space) return '';
  let html = '';
  const res = getResourceInfo(space.resource);
  if (space.type === 'bonus' && state.diceResult) {
    html += `<div class="landing-bonus">🏦 +${formatMoney(500000 * state.diceResult.total)}</div>`;
  }
  if (space.resource && res) {
    const royaltyDue = state.pendingAction?.type === 'royalty_due'
      && state.pendingAction.resourceId === space.resource;
    html += royaltyDue
      ? `<p class="landing-royalties-intro action-wait">${t('action.royalty_due', { amount: formatMoney(state.pendingAction.totalDue), resource: res.name })}</p>`
      : `<p class="landing-royalties-intro">${t('action.case_royalties_paid', { resource: res.name })}</p>`;
    html += buildResourceRoyaltiesRowHtml(space.resource);
    const owners = getOwnersForResource(state, space.resource);
    html += `<div class="landing-owners-label">${t('board.current_owners')}</div>`;
    html += owners.length
      ? owners.map((o) => `<div class="landing-owner">${escapeHtml(o.player.name)} — ${o.pct}% → <strong>${formatMoney(o.royalty)}</strong></div>`).join('')
      : `<div class="landing-owner muted">${t('board.no_owners')}</div>`;
  }
  return html;
}

function showLandingPanel(state, onDone) {
  const roller = state.players[state.currentPlayerIndex];
  const space = state.board[roller?.position];
  if (!space) { onDone?.(); return; }
  const title = $('#landing-title');
  const resEl = $('#landing-resource');
  const body = $('#landing-body');
  if (title) title.textContent = space.label || '';
  if (resEl) {
    const res = getResourceInfo(space.resource);
    if (res?.name) {
      resEl.textContent = res.name;
      resEl.style.color = res.color || '';
      show(resEl);
    } else hide(resEl);
  }
  if (body) body.innerHTML = buildLandingPanelHtml(state);
  show($('#landing-overlay'));
  landingPauseActive = true;
  if (landingPauseTimer) clearTimeout(landingPauseTimer);
  landingPauseTimer = setTimeout(() => {
    landingPauseTimer = null;
    hide($('#landing-overlay'));
    landingPauseActive = false;
    onDone?.();
  }, getSeqDelay(1600));
}

function finishPawnArrival() {
  clearPawnMoveTimer();
  pawnMoveSession.displayPos = pawnMoveSession.path.length
    ? pawnMoveSession.path[pawnMoveSession.path.length - 1]
    : null;
  renderBoard(gameState);
  landingPauseActive = true;
  if (landingPauseTimer) clearTimeout(landingPauseTimer);
  const delay = getSeqDelay(PAWN_POST_ARRIVE_MS);
  const afterLandingPause = () => {
    landingPauseActive = false;
    pawnMoveSession.active = false;
    const state = gameState;
    const roller = state?.players?.[state.currentPlayerIndex];
    const isMyTurn = roller?.id === myGameId && !roller?.bankrupt;
    const wantsBuy = state?.pendingAction?.type === 'buy_titles' && isMyTurn;
    if (wantsBuy) {
      pawnMoveSession.displayPos = null;
      renderBoard(state);
      completeGameSequence();
      return;
    }
    const space = state?.board?.[roller?.position];
    if (space?.resource || space?.type === 'bonus') {
      showLandingPanel(state, () => {
        pawnMoveSession.displayPos = null;
        renderBoard(gameState);
        completeGameSequence();
      });
      return;
    }
    pawnMoveSession.displayPos = null;
    renderBoard(state);
    completeGameSequence();
  };
  if (delay <= 0) afterLandingPause();
  else landingPauseTimer = setTimeout(() => { landingPauseTimer = null; afterLandingPause(); }, delay);
}

function completeGameSequence() {
  if (pendingNewsReveal) {
    const nr = pendingNewsReveal;
    pendingNewsReveal = null;
    showingNewsId = 0;
    lastNewsRevealId = nr.id - 1;
    showNewsCardAnimation(nr);
    lastNewsRevealId = nr.id;
    showingNewsId = nr.id;
  }
  if (gameState) renderActions(gameState);
}

function ensureDiceCubes() {
  Dice3D.initCube($('#die1'), 1);
  Dice3D.initCube($('#die2'), 1);
}

function applyDiceSkin() {
  const roller = gameState?.players?.[gameState.currentPlayerIndex];
  const s = roller?.diceStyle || profile?.equippedDiceStyle || { bg: '#ffffff', color: '#1a1a2e', border: 'transparent' };
  [$('#die1-scene'), $('#die2-scene')].forEach((scene) => Dice3D.applySkinToScene(scene, s));
}

function hideDiceScores() {
  hide($('#die1-score'));
  hide($('#die2-score'));
  hide($('#dice-total-score'));
  hide($('#dice-roller-label'));
}

function updateDiceScores(d1, d2, rollerName) {
  const s1 = $('#die1-score');
  const s2 = $('#die2-score');
  const total = $('#dice-total-score');
  const label = $('#dice-roller-label');
  if (s1) { s1.textContent = String(d1); s1.removeAttribute('aria-hidden'); show(s1); }
  if (s2) { s2.textContent = String(d2); s2.removeAttribute('aria-hidden'); show(s2); }
  if (total) { total.textContent = t('dice.total', { d1, d2, sum: d1 + d2 }); show(total); }
  if (label && rollerName) { label.textContent = t('dice.roller', { name: rollerName }); show(label); }
}

function showDiceResult(d1, d2, opts = {}) {
  const rollId = opts.rollId || 0;
  const rollerName = opts.rollerName || '';
  applyDiceSkin();
  ensureDiceCubes();
  show($('#dice-area'));

  if (diceRollSession.active) {
    diceRollSession.result = { d1, d2, rollId, rollerName };
    const minMs = settings.reduceMotion ? 200 : DICE_ROLL_MIN_MS;
    if (Date.now() - diceRollSession.start >= minMs) finishDiceRoll();
    else scheduleDiceLanding();
    return;
  }

  if (rollId && rollId === lastDisplayedRollId) {
    Dice3D.setCubeValue($('#die1'), d1, { animate: false });
    Dice3D.setCubeValue($('#die2'), d2, { animate: false });
    updateDiceScores(d1, d2, rollerName);
    if (pawnMoveSession.waitingDice && !diceRollSession.active) beginPawnMovement();
    return;
  }

  if (rollId && rollId !== lastDisplayedRollId) {
    lastDisplayedRollId = rollId;
    hideDiceScores();
    diceRollSession.active = true;
    diceRollSession.start = Date.now();
    diceRollSession.result = { d1, d2, rollId, rollerName };
    if (diceRollSession.timer) clearTimeout(diceRollSession.timer);
    sfx('dice');
    Dice3D.startWildRoll($('#die1'));
    Dice3D.startWildRoll($('#die2'));
    scheduleDiceLanding();
    return;
  }

  Dice3D.setCubeValue($('#die1'), d1, { animate: false });
  Dice3D.setCubeValue($('#die2'), d2, { animate: false });
  updateDiceScores(d1, d2, rollerName);
}

function scheduleDiceLanding() {
  if (diceRollSession.timer) clearTimeout(diceRollSession.timer);
  const minMs = settings.reduceMotion ? 200 : DICE_ROLL_MIN_MS;
  const remaining = minMs - (Date.now() - diceRollSession.start);
  if (remaining <= 0) {
    if (diceRollSession.result) finishDiceRoll();
    return;
  }
  diceRollSession.timer = setTimeout(() => {
    if (diceRollSession.result) finishDiceRoll();
  }, remaining);
}

function finishDiceRoll() {
  if (!diceRollSession.active || !diceRollSession.result) return;
  const { d1, d2, rollerName } = diceRollSession.result;
  diceRollSession.active = false;
  diceRollSession.result = null;
  if (diceRollSession.timer) clearTimeout(diceRollSession.timer);
  diceRollSession.timer = null;
  let landed = false;
  const onLanded = () => {
    if (landed) return;
    landed = true;
    updateDiceScores(d1, d2, rollerName);
    const btn = $('#btn-roll');
    if (btn) btn.disabled = false;
    beginPawnMovement();
  };
  Dice3D.landBothCubes($('#die1'), $('#die2'), d1, d2, onLanded);
  setTimeout(onLanded, 1800);
}

function animateDice() {
  applyDiceSkin();
  ensureDiceCubes();
  hideDiceScores();
  sfx('dice');
  show($('#dice-area'));
  diceRollSession.active = true;
  diceRollSession.start = Date.now();
  diceRollSession.result = null;
  if (diceRollSession.timer) clearTimeout(diceRollSession.timer);
  const btn = $('#btn-roll');
  if (btn) btn.disabled = true;
  Dice3D.startWildRoll($('#die1'));
  Dice3D.startWildRoll($('#die2'));
  scheduleDiceLanding();
}

// ===================== Échange : modale =====================
let tradeTargetId = null;

function openTradeModal(state) {
  const others = state.players.filter((p) => p.id !== myGameId && !p.bankrupt);
  if (others.length === 0) return toast(t('social.no_player'), 'error');
  tradeTargetId = others[0].id;
  const sel = $('#trade-target');
  sel.innerHTML = others.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}${p.isBot ? ' 🤖' : ''}</option>`).join('');
  sel.value = tradeTargetId;
  $('#trade-cash-amount').value = 0;
  $('#trade-cash-dir').value = 'pay';
  renderTradeTitles(state);
  show($('#trade-modal'));
}

function renderTradeTitles(state) {
  const me = state.players.find((p) => p.id === myGameId);
  const target = state.players.find((p) => p.id === tradeTargetId);
  const giveBox = $('#trade-give');
  const recvBox = $('#trade-receive');

  const renderList = (box, titles) => {
    if (!titles || titles.length === 0) { box.innerHTML = `<p class="trade-empty">${t('titles.none')}</p>`; return; }
    box.innerHTML = titles
      .map((ti) => `<label class="trade-title-opt"><input type="checkbox" value="${ti.id}"> ${ti.resourceName} · ${ti.country} (${ti.percent}%) — ${formatMoney(ti.price)}</label>`)
      .join('');
  };
  renderList(giveBox, me?.titles);
  renderList(recvBox, target?.titles);
}

$('#trade-target').addEventListener('change', (e) => {
  tradeTargetId = e.target.value;
  renderTradeTitles(gameState);
});
$('#trade-close').addEventListener('click', () => hide($('#trade-modal')));
$('#trade-propose').addEventListener('click', () => {
  const give = [...$('#trade-give').querySelectorAll('input:checked')].map((i) => i.value);
  const recv = [...$('#trade-receive').querySelectorAll('input:checked')].map((i) => i.value);
  let cash = Math.max(0, Math.round(Number($('#trade-cash-amount').value) || 0));
  if ($('#trade-cash-dir').value === 'receive') cash = -cash;
  if (give.length === 0 && recv.length === 0 && cash === 0) return toast(t('trade.empty'), 'error');
  socket.emit('propose_trade', { targetId: tradeTargetId, giveTitleIds: give, receiveTitleIds: recv, cash });
  hide($('#trade-modal'));
});

// ===================== Propositions entrantes : overlay =====================
function renderSocialOverlay(state) {
  const overlay = $('#social-overlay');

  if (state.incomingAlliance) {
    const a = state.incomingAlliance;
    $('#social-title').textContent = t('social.alliance_title');
    $('#social-body').innerHTML = `
      <p class="social-body-line">${t('social.alliance_body', { name: escapeHtml(a.fromName) })}</p>
      <div class="social-detail">
        <span>${t('social.alliance_tax', { tax: formatMoney(a.taxTo) })}</span>
        <span>${t('alliance.total_tax', { tax: formatMoney((a.taxFrom || 0) + (a.taxTo || 0)) })}</span>
        <span>${t('social.alliance_perks')}</span>
      </div>`;
    $('#social-accept').onclick = () => { socket.emit('respond_alliance', { accept: true }); };
    $('#social-decline').onclick = () => { socket.emit('respond_alliance', { accept: false }); };
    show(overlay);
    return;
  }

  if (state.incomingTrade) {
    const tr = state.incomingTrade;
    const me = state.players.find((p) => p.id === myGameId);
    const from = state.players.find((p) => p.id === tr.fromId);
    const titleLabel = (owner, ids) =>
      ids.map((id) => { const x = owner?.titles.find((y) => y.id === id); return x ? `${x.resourceName} (${x.percent}%)` : '?'; }).join(', ') || '—';
    const cashLine = tr.cash > 0
      ? t('social.cash_receive', { amount: formatMoney(tr.cash) })
      : tr.cash < 0 ? t('social.cash_pay', { amount: formatMoney(-tr.cash) }) : t('social.cash_none');
    $('#social-title').textContent = t('social.trade_title');
    $('#social-body').innerHTML = `
      <p class="social-body-line">${t('social.trade_body', { name: escapeHtml(tr.fromName) })}</p>
      <div class="social-detail">
        <span>${t('social.trade_recv', { titles: titleLabel(from, tr.giveTitleIds) })}</span>
        <span>${t('social.trade_give', { titles: titleLabel(me, tr.receiveTitleIds) })}</span>
        <span>${cashLine}</span>
      </div>`;
    $('#social-accept').onclick = () => { socket.emit('respond_trade', { accept: true }); };
    $('#social-decline').onclick = () => { socket.emit('respond_trade', { accept: false }); };
    show(overlay);
    return;
  }

  hide(overlay);
}

let lastNewsRevealId = 0;
let showingNewsId = 0;
let newsDismissTimer = null;
let newsFlipStartTimer = null;
let newsFlipEndTimer = null;

function prefersReducedMotion() {
  return settings.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function clearNewsTimers() {
  if (newsDismissTimer) { clearTimeout(newsDismissTimer); newsDismissTimer = null; }
  if (newsFlipStartTimer) { clearTimeout(newsFlipStartTimer); newsFlipStartTimer = null; }
  if (newsFlipEndTimer) { clearTimeout(newsFlipEndTimer); newsFlipEndTimer = null; }
}

function dismissNewsCard() {
  showingNewsId = 0;
  clearNewsTimers();
  hide($('#news-overlay'));
  hide($('#news-card-dismiss'));
  $('#news-card-flipper')?.classList.remove('flipped');
}

function showNewsCardAnimation(nr) {
  const overlay = $('#news-overlay');
  const flipper = $('#news-card-flipper');
  const dismiss = $('#news-card-dismiss');
  if (!overlay || !flipper) return;

  clearNewsTimers();
  $('#news-card-player').textContent = t('news.drawn_by', { name: nr.playerName });
  $('#news-card-text').textContent = nr.text;

  flipper.classList.remove('flipped');
  hide(dismiss);
  show(overlay);

  const reduced = prefersReducedMotion();
  const flipDelay = reduced ? 50 : 550;
  const flipDuration = reduced ? 50 : 900;

  newsFlipStartTimer = setTimeout(() => {
    newsFlipStartTimer = null;
    if (!reduced) sfx('card');
    void flipper.offsetWidth;
    flipper.classList.add('flipped');
    newsFlipEndTimer = setTimeout(() => {
      newsFlipEndTimer = null;
      show(dismiss);
      newsDismissTimer = setTimeout(dismissNewsCard, 7000);
    }, flipDuration);
  }, flipDelay);
}

function handleNewsReveal(state) {
  const nr = state.newsReveal;
  if (!nr || nr.id <= lastNewsRevealId) return;
  if (showingNewsId === nr.id) return;
  if (isGameSequenceActive()) {
    pendingNewsReveal = nr;
    return;
  }
  lastNewsRevealId = nr.id;
  showingNewsId = nr.id;
  showNewsCardAnimation(nr);
}

function updateSurrenderButton(state) {
  const btn = $('#btn-surrender');
  if (!btn) return;
  const me = state.players.find((p) => p.id === myGameId);
  if (!me || me.bankrupt || state.winner) hide(btn);
  else show(btn);
}

function renderGame(state) {
  if (state.phase === 'rolling' && !state.diceResult && !isGameSequenceActive()) {
    resetDiceDisplay();
  }
  renderBoard(state);
  renderPlayersPanel(state);
  renderAlliancePanel(state);
  renderLog(state);
  renderMyTitles(state);
  renderActions(state);
  renderSocialOverlay(state);
  updateSurrenderButton(state);
  handleNewsReveal(state);
  if (state.winner) {
    const wasHidden = $('#winner-overlay').classList.contains('hidden');
    show($('#winner-overlay'));
    if (wasHidden) sfx('win');
    const iWon = state.winningTeam ? state.winningTeam.includes(myGameId) : state.winner.id === myGameId;
    $('#winner-text').textContent = iWon
      ? t('game.win')
      : t('game.win_other', { name: state.winner.name });
  }
}

// ===================== Démarrage =====================
(async function init() {
  if (location.hostname === '127.0.0.1') {
    location.replace(`http://localhost:${location.port || '3000'}${location.pathname}${location.search}${location.hash}`);
    return;
  }
  $$('.screen').forEach((s) => s.classList.remove('active'));
  syncLanguageSelectors();
  applyLanguage();
  const joinParam = new URLSearchParams(location.search).get('join');
  if (joinParam) {
    const joinInput = $('#join-code');
    if (joinInput) joinInput.value = joinParam.toUpperCase();
  }
  socket.connect();
  loadResourcesData();
  const { gerr } = await handleGoogleRedirect();
  const restored = await tryRestoreSession();
  if (restored) {
    await finishLogin();
  } else {
    showScreen('screen-auth');
    await setupGoogleAuth();
    if (gerr) showAuthError(googleErrorMessage(gerr));
  }
})();
