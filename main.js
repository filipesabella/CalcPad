const electron = require('electron');

const {
  app,
  BrowserWindow,
  Menu,
  dialog,
} = electron;

const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const {
  autoUpdater
} = require("electron-updater");

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
  });
  mainWindowState.manage(mainWindow);

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './build/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  mainWindow.loadURL(startUrl);

  autoUpdater.checkForUpdates();
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'A new version has been downloaded. ' +
        'Restart the application to apply the updates.'
    };

    dialog.showMessageBox(dialogOpts, (response) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application');
    console.error(message);
  });

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  })

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
