const electron = require('electron');

const {
  app,
  BrowserWindow,
  Menu,
} = electron;

const fs = require('fs');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('./window-state.js');

// Let electron reloads by itself when webpack watches changes in ./app/
if (process.env.ELECTRON_START_URL) {
  require('electron-reload')(__dirname);
}

// To avoid being garbage collected
let mainWindow;

app.on('ready', () => {
  const monitor = electron.screen.getPrimaryDisplay();
  const width = monitor.size.width / (monitor.size.width > 2000 ? 3 : 2);
  const mainWindowState = windowStateKeeper({
    defaultWidth: width,
    defaultHeight: monitor.size.height,
  });
  mainWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
    }
  });
  mainWindowState.manage(mainWindow);
  mainWindow.webContents.toggleDevTools();

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../../build/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' data:",
          "connect-src 'self' ws: wss:",
          "media-src 'self'",
          "base-uri 'self'",
        ].join(';'),
      }
    });
  });

  const menu = Menu.buildFromTemplate([{
    label: 'CalcPad',
    submenu: [{
      role: 'quit',
    }]
  }, {
    label: 'File',
    submenu: [{
      label: 'New',
      accelerator: process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
      click: () => mainWindow.webContents.send('new-file'),
    }, {
      label: 'Save',
      accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
      click: () => mainWindow.webContents.send('save-file'),
    }, {
      label: 'Open',
      accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
      click: () => mainWindow.webContents.send('open-file'),
    }, {
      type: 'separator'
    }, {
      label: 'Preferences',
      accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
      click: () => mainWindow.webContents.send('open-preferences'),
    }, {
      label: 'Help',
      accelerator: process.platform === 'darwin' ? 'Cmd+?' : 'Ctrl+?',
      click: () => mainWindow.webContents.send('open-help'),
    }, ]
  }, {
    label: 'Edit',
    submenu: [{
      role: 'undo'
    }, {
      role: 'redo'
    }, {
      type: 'separator'
    }, {
      role: 'cut'
    }, {
      role: 'copy'
    }, {
      role: 'paste'
    }, {
      role: 'delete'
    }, {
      role: 'selectall'
    }, {
      role: 'toggledevtools'
    }, ]
  }, ]);

  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// whoa
const { ipcMain } = electron;

ipcMain.handle('electron.app.getPath', (_, path) => {
  return electron.app.getPath(path);
});

ipcMain.handle('fs', (_, fn, args) => {
  // heck
  return fs[fn].apply(null, args);
});

ipcMain.handle('fs.mkdirPSync', (_, dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

ipcMain.handle('fs.touch', (_, file) => {
  if (!fs.existsSync(file)) {
    fs.closeSync(fs.openSync(file, 'w'));
  }
})

ipcMain.handle('path.join', (_, path1, path2) => {
  return path.join(path1, path2);
});

ipcMain.handle('dialog', (_, fn, options) => {
  return electron.dialog[fn].apply(null, options);
});
