import * as React from 'react';
import { useEffect, useState } from 'react';

export interface Preferences {
  fontSize: number;
  decimalPlaces: number;
  theme: 'dark' | 'light';
}

interface Props {
  preferences: Preferences;
  close: () => void;
  save: (preferences: Preferences) => void;
}

export const PreferencesDialog = ({ preferences, save, close }: Props) => {
  const [fontSize, setFontSize] = useState(preferences.fontSize);
  const [decimalPlaces, setDecimalPlaces] =
    useState(preferences.decimalPlaces);
  const [theme, setTheme] = useState(preferences.theme);

  useEffect(() => {
    save({
      fontSize,
      decimalPlaces,
      theme,
    });
  }, [fontSize, decimalPlaces, theme]);

  return <div className="preferencesDialog">
    <div className="field">
      <label>Font Size</label>
      <input
        className="fontSize"
        type="number"
        min="8"
        value={fontSize}
        onChange={e => setFontSize(parseInt(e.target.value))} />
      px
    </div>
    <div className="field">
      <label>Decimal Places</label>
      <input
        className="decimalPlaces"
        type="number"
        min="2"
        max="8"
        value={decimalPlaces}
        onChange={e => setDecimalPlaces(parseInt(e.target.value))} />
    </div>
    <div className="field">
      <label>Theme</label>
      <select
        value={theme}
        onChange={e => setTheme(e.target.value as any)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>
    <div className="buttons">
      <span onClick={() => close()}>Close</span>
    </div>
  </div>;
};
