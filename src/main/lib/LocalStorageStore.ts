import { defaultPreferences, Preferences } from '../components/PreferencesDialog';


const contentKey = 'calcpad-content';
const preferencesKey = 'calcpad-preferences';

export class LocalStorageStore {
  public save(value: string): void {
    localStorage.setItem(contentKey, value);
  }

  public getContent(): string {
    return localStorage.getItem(contentKey) || '';
  }

  public preferences(): Preferences {
    try {
      return JSON.parse(localStorage.getItem(preferencesKey) || 'invalid');
    } catch {
      return defaultPreferences;
    }
  }

  public savePreferences(preferences: Preferences): void {
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }
}
