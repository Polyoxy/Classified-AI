const { app, BrowserWindow, ipcMain, shell, session, globalShortcut } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');
const waitOn = require('wait-on');

// Initialize electron-store
const store = new Store();

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

async function createWindow() {
  // In development mode, wait for the Next.js server to be ready
  if (isDev) {
    try {
      console.log('Waiting for Next.js server to be ready...');
      await waitOn({ resources: ['http://localhost:3000'], timeout: 15000 });
      console.log('Next.js server is ready!');
    } catch (err) {
      console.error('Error waiting for Next.js server:', err);
      // Try port 3001 if 3000 failed
      try {
        await waitOn({ resources: ['http://localhost:3001'], timeout: 15000 });
        console.log('Next.js server is ready on port 3001!');
      } catch (err) {
        console.error('Error waiting for Next.js server on both ports:', err);
      }
    }
  }

  // Create the browser window with a custom frame
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // No default frame for custom title bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Add security options
      sandbox: true,
      webSecurity: isDev ? false : true, // Disable web security in development
      allowRunningInsecureContent: isDev ? true : false,
      enableRemoteModule: false,
      nativeWindowOpen: true, // Enable this for Firebase auth popups
    },
    backgroundColor: '#1E1E1E', // Dark background color
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev 
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.google-analytics.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:11434 http://127.0.0.1:11434 ws://localhost:11434 wss://localhost:11434 wss://*.firebaseio.com https://*.firebaseio.com https://*.openai.com https://*.deepseek.com https://*.firebaseio.com https://firestore.googleapis.com https://*.firebase.com https://*.googleapis.com https://*.google-analytics.com https://identitytoolkit.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com"
            : "default-src 'self'; script-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.google-analytics.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:11434 http://127.0.0.1:11434 wss://*.firebaseio.com https://*.firebaseio.com https://*.openai.com https://*.deepseek.com https://*.firebaseio.com https://firestore.googleapis.com https://*.firebase.com https://*.googleapis.com https://*.google-analytics.com https://identitytoolkit.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com"
        ],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['SAMEORIGIN'], // Changed from DENY to SAMEORIGIN for Firebase auth
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['no-referrer']
      }
    });
  });

  // Load the app
  const startUrl = isDev
    ? process.env.PORT === '3001' 
      ? 'http://localhost:3001' 
      : 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  console.log(`Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  // Set up permission handler
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Deny all permissions that aren't necessary for the app
    const allowedPermissions = ['clipboard-read', 'clipboard-write'];
    callback(allowedPermissions.includes(permission));
  });

  // Always open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
    
    // Add keyboard shortcut for DevTools
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      mainWindow.webContents.openDevTools();
    });
  }

  // Handle window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  ipcMain.on('window-reload', () => {
    mainWindow.reload();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  // Disable CSP warnings in development
  if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  }
  
  createWindow();

  // Set up IPC handlers for electron-store
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    return true;
  });

  ipcMain.handle('store-clear', () => {
    store.clear();
    return true;
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 