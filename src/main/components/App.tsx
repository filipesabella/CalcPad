import * as React from 'react';
import { useEffect, useState } from 'react';
import * as darkTheme from '../codemirror/DarkTheme';
import * as lightTheme from '../codemirror/LightTheme';
import { Store } from '../lib/store';
import '../styles/App.less';
import { Editor } from './Editor';
import { Help } from './Help';
import { Preferences, PreferencesDialog } from './PreferencesDialog';

const { ipcRenderer } = window.require('electron');

export const App = ({ store }: { store: Store }) => {
  const [value, setValue] = useState(null as string | null);
  const [externalFunctions, setExternalFunctions] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [preferences, setPreferences] = useState(store.preferences());

  const updateValue = (value: string) => {
    setValue(value);
    store.save(value);
  };

  useEffect(() => {
    // sent by the menus
    ipcRenderer.on('new-file', () => newFile());
    ipcRenderer.on('save-file', () => showSaveDialog());
    ipcRenderer.on('open-file', () => showOpenDialog());
    ipcRenderer.on('open-preferences', () => setShowPreferences(true));
    ipcRenderer.on('open-help', () => setShowHelp(true));

    window.onkeyup = e => {
      if (e.key === 'Escape') {
        setShowPreferences(false);
        setShowHelp(false);
      }
    };

    store.readExternalFunctionsFile().then(value => {
      setExternalFunctions(value);

      store.getLastFileContent().then(value => {
        setValue(value);
      });
    });

    configureCSSVars(preferences);

    setTitle();
  }, []);

  const newFile = () => {
    store.newFile();
    setValue('');
    setTitle();
  };

  const closePreferencesDialog = () => {
    setShowPreferences(false);
  };

  const closeHelp = () => {
    setShowHelp(false);
  };

  const savePreferences = (preferences: Preferences) => {
    setPreferences(preferences);
    configureCSSVars(preferences);
    store.savePreferences(preferences);
  };

  const setTitle = () => {
    const title = store.isTempFile()
      ? 'CalcPad - Untitled'
      : 'CalcPad - ' + store.getLastFile();

    ipcRenderer.invoke('setWindowTitle', title);
  };

  const showSaveDialog = () => {
    // we already save on change
    if (!store.isTempFile()) return;

    ipcRenderer.invoke('dialog', 'showSaveDialog', {
      title: 'Save'
    }).then((result: any) => {
      const file = result.filePath;
      file && store.saveFile(file, value);
    });
  };

  const showOpenDialog = () => {
    ipcRenderer.invoke('dialog', 'showOpenDialog', {
      title: 'Open',
      properties: ['openFile'],
    }).then(async (result: any) => {
      const files = result.filePaths;
      if (!files || files.length === 0) return; // user cancelled

      const contents = await store.open(files[0]);
      setValue(contents);
      setTitle();
    });
  };

  return <div className="app">
    {value !== null && !showHelp && !showPreferences && <Editor
      // this `key` ensures that the Editor fully unmounts when changing
      // files, and thus not messing up the history and state
      key={store.getLastFile()}
      value={value}
      onUpdate={updateValue}
      preferences={preferences}
      externalFunctions={externalFunctions} />}
    {showPreferences && <PreferencesDialog
      preferences={store.preferences()}
      close={() => closePreferencesDialog()}
      save={(preferences: Preferences) => savePreferences(preferences)}
    />}
    {showHelp && <Help close={() => closeHelp()} />}
  </div>;
};

function configureCSSVars(preferences: Preferences): void {
  if (document.documentElement) {
    const style = document.documentElement.style;
    style.setProperty('--font-size', preferences.fontSize + 'px');

    const isDark = preferences.theme === 'dark';
    const colors = isDark ? darkTheme.colors : lightTheme.colors;

    style.setProperty('--text-color', isDark
      ? colors.light
      : colors.medium);

    style.setProperty('--dialog-bg-color', isDark
      ? colors.background
      : colors.darkBackground);
  }
}
