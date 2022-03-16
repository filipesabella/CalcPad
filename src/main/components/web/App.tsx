import * as React from 'react';
import { useEffect, useState } from 'react';
import { LocalStorageStore } from '../../lib/LocalStorageStore';
import '../../styles/App.less';
import { configureCSSVars } from '../common';
import { Editor } from '../Editor';
import { Help } from '../Help';
import { Preferences, PreferencesDialog } from '../PreferencesDialog';

export const App = ({ store }: { store: LocalStorageStore }) => {
  const [value, setValue] = useState(null as string | null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [preferences, setPreferences] = useState(store.preferences());

  const updateValue = (value: string) => {
    setValue(value);
    store.save(value);
  };

  useEffect(() => {
    window.onkeyup = e => {
      if (e.key === 'Escape') {
        closeDialogs();
     }
    };

    setValue(store.getContent());

    configureCSSVars(preferences);
  }, []);

  const closeDialogs = () => {
    setShowPreferences(false);
    setShowHelp(false);
    return true;
  };

  const savePreferences = (preferences: Preferences) => {
    setPreferences(preferences);
    configureCSSVars(preferences);
    store.savePreferences(preferences);
  };

  return <div className="app">
    {value !== null && !showHelp && !showPreferences && <Editor
      value={value}
      onUpdate={updateValue}
      preferences={preferences}
      externalFunctions={''} />}
    {showPreferences && <PreferencesDialog
      preferences={preferences}
      close={closeDialogs}
      save={savePreferences}
    />}
    {showHelp && <Help close={() => closeDialogs()} />}
    <div className="menuButton">
      <div className="menu">
        <p onClick={() => closeDialogs() && setShowHelp(true)}>Help</p>
        <p onClick={() => closeDialogs() && setShowPreferences(true)}>
          Preferences
        </p>
      </div>
      ⚙
    </div>
  </div>;
};
