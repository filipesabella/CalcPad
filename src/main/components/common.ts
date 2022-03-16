import * as darkTheme from '../codemirror/DarkTheme';
import * as lightTheme from '../codemirror/LightTheme';
import { Preferences } from './PreferencesDialog';

export function configureCSSVars(preferences: Preferences): void {
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

