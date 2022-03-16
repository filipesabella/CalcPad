import * as React from 'react';
import { useEffect, useState } from 'react';
import '../styles/PreferencesDialog.less';

export type Theme = 'dark' | 'light';
export interface Preferences {
  fontSize: number;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  theme: Theme;
}

export const defaultPreferences: Preferences = {
  fontSize: 18,
  decimalPlaces: 2,
  theme: 'dark',
  decimalSeparator: '.',
  thousandsSeparator: ',',
};

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
  const [decimalSeparator, setDecimalSeparator] =
    useState(preferences.decimalSeparator);
  const [thousandsSeparator, setThousandsSeparator] =
    useState(preferences.thousandsSeparator);

  useEffect(() => {
    save({
      fontSize,
      decimalPlaces,
      theme,
      decimalSeparator,
      thousandsSeparator,
    });
  }, [fontSize, decimalPlaces, theme, thousandsSeparator, decimalSeparator]);

  return <div className="preferencesDialog">
    <div className="field">
      <label>Theme</label>
      <select
        value={theme}
        onChange={e => setTheme(e.target.value as any)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>
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
      <label>Decimal Separator</label>
      <input
        type="text"
        className="separator"
        maxLength={1}
        value={decimalSeparator}
        onChange={e => setDecimalSeparator(e.target.value)} />
    </div>
    <div className="field">
      <label>Thousands Separator</label>
      <input
        type="text"
        className="separator"
        maxLength={1}
        value={thousandsSeparator}
        onChange={e => setThousandsSeparator(e.target.value)} />
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
    <div className="buttons">
      <span onClick={() => close()}>Close</span>
    </div>
  </div>;
};
