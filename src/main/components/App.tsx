import * as React from 'react';
import { useEffect, useState } from 'react';
import { textToResults } from '../evaluator';
import { textToNode } from '../renderer';
import { Store } from '../store';
import { Help } from './Help';
import { Preferences, PreferencesDialog } from './PreferencesDialog';

const { ipcRenderer } = window.require('electron');

require('../styles/app.less');

export const App = ({ store }: { store: Store }) => {
  const textRef: React.RefObject<HTMLDivElement> = React.createRef();
  const textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  const [results, setResults] = useState([] as string[]);
  const [value, setValue] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

    store.getLastFileContent().then(value => {
      setValue(value);
      setResults(textToResults(value, store.preferences()));
    });

    setTitle();
  }, []);

  useEffect(() => {
    resizeTextArea(textAreaRef, textRef);
  }, [value]);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValue(value);
    setResults(textToResults(
      value,
      store.preferences()));

    store.save(value);
  };

  const cursorChanged = () => {
    if (textAreaRef.current) {
      const ref = textAreaRef.current;
      // using timeout otherwise it lags one event because of the
      // keydown instead of keyup
      setTimeout(() => {
        setCurrentLine(value
          .substring(0, ref.selectionStart)
          .split('\n').length - 1);
      }, 0);
    }
  };

  const newFile = () => {
    store.newFile();
    setResults([]);
    setValue('');
    setCurrentLine(0);
  };

  const closePreferencesDialog = () => {
    setShowPreferences(false);
    textAreaRef.current!.focus();
  };

  const closeHelp = () => {
    setShowHelp(false);
    textAreaRef.current!.focus();
  };

  const savePreferences = (preferences: Preferences) => {
    setPreferences(preferences);
    store.savePreferences(preferences);

    // recalculate results as precision might have been changed
    setResults(textToResults(value, preferences));
  };

  const setTitle = () => {
    const title = store.isTempFile()
      ? 'CalcPad'
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
      setResults(textToResults(
        contents,
        store.preferences()));
      setTitle();
    });
  };

  const linesToRender = value.split('\n').map(textToNode);

  return <div className="app">
    <div className="texts" ref={textRef}>
      {linesToRender.map((line, i) =>
        <div key={i}
          className={'line ' + (currentLine === i ? 'current' : '')}>
          <div className="text">{line}</div>
          <div className="result">{results[i]}</div>
        </div>)}
    </div>
    <textarea
      id="textarea"
      spellCheck={false}
      className="mousetrap"
      autoFocus={true}
      onChange={e => onChange(e)}
      onClick={_ => cursorChanged()}
      onKeyDown={_ => cursorChanged()}
      value={value}
      ref={textAreaRef}></textarea>
    {showPreferences && <PreferencesDialog
      preferences={store.preferences()}
      close={() => closePreferencesDialog()}
      save={(preferences: Preferences) => savePreferences(preferences)}
    />}
    {showHelp && <Help close={() => closeHelp()} />}
  </div>;
};

function resizeTextArea(
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  textRef: React.RefObject<HTMLDivElement>): void {
  if (textAreaRef.current) {
    textAreaRef.current.style.height =
      textRef.current!.clientHeight + 10 + 'px';
  }
}

function setPreferences(preferences: Preferences): void {
  if (document.documentElement) {
    const style = document.documentElement.style;
    style.setProperty('--font-size', preferences.fontSize + 'px');
    style.setProperty('--line-height', preferences.fontSize + 12 + 'px');

    const isDark = preferences.theme === 'dark';
    style.setProperty('--text-color', isDark
      ? 'rgb(227, 230, 232)'
      : 'rgb(109, 125, 141)');

    style.setProperty('--result-text-color', isDark
      ? 'rgb(155, 207, 77)'
      : 'rgb(155, 207, 77)');

    style.setProperty('--bg-color', isDark
      ? 'rgb(33, 34, 38)'
      : 'rgb(255, 255, 255)');

    style.setProperty('--current-line-bg-color', isDark
      ? 'rgb(39, 41, 45)'
      : 'rgb(250, 250, 250)');
  }
}
