// from https://github.com/mawie81/electron-window-state/blob/master/index.js

let fs, path, electron, platform;

try { // running in renderer process
  const r = window.require;
  electron = r('electron');
  const remote = electron.remote;
  fs = remote.require('fs');
  path = remote.require('path');
  platform = remote.getGlobal('process').platform;
} catch (e) { // running in main process
  electron = require('electron');
  fs = require('fs');
  path = require('path');
  platform = process.platform;
}

const eventHandlingDelay = 100;

const app = electron.app || electron.remote.app;
const screen = electron.screen || electron.remote.screen;

module.exports = function(options) {
  let state;
  let winRef;
  let stateChangeTimer;

  const config = Object.assign({
    file: 'window-state.json',
    path: app.getPath('userData'),
    maximize: true,
  }, options);
  const fullStoreFileName = path.join(config.path, config.file);

  function isNormal(win) {
    return !win.isMaximized() && !win.isMinimized();
  }

  function updateState(win) {
    win = win || winRef;
    if (!win) return;

    // Don't throw an error when window was closed
    try {
      const winBounds = win.getBounds();
      if (isNormal(win)) {
        state.x = winBounds.x;
        state.y = winBounds.y;
        state.width = winBounds.width;
        state.height = winBounds.height;
      }
      state.isMaximized = win.isMaximized();
      state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
    } catch (err) {
      console.error(err);
    }

    saveState();
  }

  function saveState() {
    try {
      fs.mkdirSync(path.dirname(fullStoreFileName), {
        recursive: true
      });
      fs.writeFileSync(fullStoreFileName, JSON.stringify(state));
    } catch (err) {
      console.error(err);
    }
  }

  function stateChangeHandler() {
    clearTimeout(stateChangeTimer);
    stateChangeTimer = setTimeout(updateState, eventHandlingDelay);
  }

  function manage(win) {
    if (config.maximize && state.isMaximized) {
      win.maximize();
    }
    win.on('resize', stateChangeHandler);
    win.on('move', stateChangeHandler);
    winRef = win;

    return win;
  }

  try {
    // to remove a parcel bundler warning
    const rfs = fs;

    if (rfs.existsSync(fullStoreFileName)) {
      state = JSON.parse(rfs.readFileSync(fullStoreFileName));
    } else {
      state = null;
    }
  } catch (err) {
    console.error(err);
  }

  state = validateState(config, state);

  // Set state fallback values
  state = Object.assign({
    width: config.defaultWidth || 800,
    height: config.defaultHeight || 600
  }, state);

  return {
    get x() {
      return state.x;
    },
    get y() {
      // https://github.com/electron/electron/issues/10388
      if (platform === 'linux') {
        return state.y - 30;
      } else {
        return state.y;
      }
    },
    get width() {
      return state.width;
    },
    get height() {
      return state.height;
    },
    manage,
  };
};

function validateState(config, state) {
  const isValid = state && (hasBounds(state) || state.isMaximized);
  if (!isValid) {
    return null;
  }

  if (hasBounds(state) && state.displayBounds) {
    return ensureWindowVisibleOnSomeDisplay(config, state);
  }

  return state;
}

function ensureWindowVisibleOnSomeDisplay(config, state) {
  const visible = screen.getAllDisplays().some(display => {
    return windowWithinBounds(state, display.bounds);
  });

  if (!visible) {
    // Window is partially or fully not visible now.
    // Reset it to safe defaults.
    return resetStateToDefault(config);
  }

  return state;
}

function resetStateToDefault(config) {
  const displayBounds = screen.getPrimaryDisplay().bounds;

  // Reset state to default values on the primary display
  return {
    width: config.defaultWidth || 800,
    height: config.defaultHeight || 600,
    x: 0,
    y: 0,
    displayBounds
  };
}

function hasBounds(state) {
  return state &&
    Number.isInteger(state.x) &&
    Number.isInteger(state.y) &&
    Number.isInteger(state.width) && state.width > 0 &&
    Number.isInteger(state.height) && state.height > 0;
}

function windowWithinBounds(state, bounds) {
  // in Windows, even after simply sizing the widow with "win+left_arrow", the
  // state was stored with a negative `x` value, and a height greater than the
  // monitor's size
  const arbitraryAllowance = 10;
  return (
    state.x + arbitraryAllowance >= bounds.x &&
    state.y >= bounds.y &&
    state.x + state.width <= bounds.x + bounds.width &&
    state.y + state.height - arbitraryAllowance <= bounds.y + bounds.height
  );
}
