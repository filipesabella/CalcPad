import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  open,
  save,
} from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import {
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { FileStore } from '../../lib/store';
import '../../styles/App.less';
import { configureCSSVars } from '../common';
import { Editor } from '../Editor';
import { Help } from '../Help';
import {
  Preferences,
  PreferencesDialog,
} from '../PreferencesDialog';
import { setupMenu } from './menu';

export const App = ({ store }: { store: FileStore }) => {
  const [value, setValue] = useState(null as string | null);
  const [externalFunctions, setExternalFunctions] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [preferences, setPreferences] = useState(store.preferences());
  // the menu actions are bound once, so they read the content from here
  const valueRef = useRef(value);

  const updateValue = (value: string) => {
    valueRef.current = value;
    setValue(value);
    store.save(value);
  };

  useEffect(() => {
    setupMenu({
      newFile,
      saveFile: showSaveDialog,
      openFile: showOpenDialog,
      openPreferences: () => setShowPreferences(true),
      openHelp: () => setShowHelp(true),
      editFunctionsFile: () =>
        store.externalFunctionsFile().then(file => openPath(file)),
    });

    window.onkeyup = e => {
      if (e.key === 'Escape') {
        setShowPreferences(false);
        setShowHelp(false);
      }
    };

    store.readExternalFunctionsFile().then(value => {
      setExternalFunctions(value);

      store.getLastFileContent().then(value => {
        valueRef.current = value;
        setValue(value);
      });
    });

    configureCSSVars(preferences);

    setTitle();
  }, []);

  const newFile = () => {
    store.newFile();
    valueRef.current = '';
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

    getCurrentWindow().setTitle(title);
  };

  const showSaveDialog = () => {
    // we already save on change
    if (!store.isTempFile()) return;

    save({ title: 'Save' }).then(file => {
      file && store.saveFile(file, valueRef.current || '').then(setTitle);
    });
  };

  const showOpenDialog = () => {
    open({ title: 'Open', multiple: false, directory: false })
      .then(async file => {
        if (!file) return; // user cancelled

        const contents = await store.open(file);
        valueRef.current = contents;
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
      close={closePreferencesDialog}
      save={savePreferences} />}
    {showHelp && <Help close={() => closeHelp()} />}
  </div>;
};
