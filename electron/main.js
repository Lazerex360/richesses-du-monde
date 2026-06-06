const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { fork } = require('child_process');
const fs = require('fs');

const PORT = Number(process.env.PORT) || 3000;
let serverProcess = null;
let mainWindow = null;

function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  return path.join(__dirname, '..');
}

function getUserDataDir() {
  return path.join(app.getPath('userData'), 'data');
}

function seedUserData() {
  const userDir = getUserDataDir();
  const bundleDir = path.join(getAppRoot(), 'data');
  fs.mkdirSync(userDir, { recursive: true });
  for (const file of ['accounts.json', 'sessions.json', 'promo_usage.json']) {
    const dest = path.join(userDir, file);
    if (!fs.existsSync(dest)) {
      const src = path.join(bundleDir, file);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      else if (file === 'accounts.json') fs.writeFileSync(dest, '{}');
      else if (file === 'sessions.json') fs.writeFileSync(dest, '{}');
      else fs.writeFileSync(dest, '{}');
    }
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    seedUserData();
    const root = getAppRoot();
    const serverPath = path.join(root, 'server.js');
    serverProcess = fork(serverPath, [], {
      cwd: root,
      env: {
        ...process.env,
        PORT: String(PORT),
        ELECTRON_APP: '1',
        NO_TUNNEL: '1',
        RDM_USER_DATA: getUserDataDir(),
        RDM_BUNDLE_DATA: path.join(root, 'data'),
      },
      stdio: 'inherit',
    });
    serverProcess.on('error', reject);
    serverProcess.on('exit', (code) => {
      if (code && code !== 0 && mainWindow) {
        dialog.showErrorBox(
          'Richesses du Monde',
          `Le serveur du jeu s'est arrêté (code ${code}).`
        );
      }
    });
    waitForServer(resolve, reject);
  });
}

function waitForServer(resolve, reject) {
  let attempts = 0;
  const tryOnce = () => {
    const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
      res.resume();
      resolve();
    });
    req.on('error', () => {
      attempts += 1;
      if (attempts > 80) reject(new Error('Le serveur met trop de temps à démarrer.'));
      else setTimeout(tryOnce, 250);
    });
    req.setTimeout(2000, () => req.destroy());
  };
  tryOnce();
}

function createWindow() {
  const root = getAppRoot();
  const iconPath = path.join(root, 'public', 'icon.png');
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Richesses du Monde',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await startServer();
      createWindow();
    } catch (err) {
      dialog.showErrorBox('Richesses du Monde', err.message || String(err));
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    stopServer();
    app.quit();
  });

  app.on('before-quit', () => stopServer());
}
