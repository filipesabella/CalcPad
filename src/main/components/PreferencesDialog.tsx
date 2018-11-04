import * as React from 'react';

export interface Preferences {
  fontSize: number;
  decimalPlaces: number;
  theme: 'dark' | 'light';
  windowPosition: {
    x: number,
    y: number,
    width: number,
    height: number,
  } | null;
}

interface Props {
  preferences: Preferences;
  close: () => void;
  save: (preferences: Preferences) => void;
}

interface State extends Preferences { }

export class PreferencesDialog extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p);

    const { fontSize, decimalPlaces, theme, windowPosition } = p.preferences;
    this.state = {
      fontSize,
      decimalPlaces,
      theme,
      windowPosition,
    };
  }

  public render(): React.ReactNode {
    const { preferences, close } = this.props;
    const { fontSize, decimalPlaces, theme } = this.state;

    return <div className="preferencesDialog">
      <div className="field">
        <label>Font Size</label>
        <input
          className="fontSize"
          type="number"
          min="8"
          value={fontSize}
          onChange={this.onChange('fontSize', 8)} />
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
          onChange={this.onChange('decimalPlaces', 2)} />
      </div>
      <div className="field">
        <label>Theme</label>
        <select
          value={theme}
          onChange={e =>
            this.setState({ theme: e.target.value as any }, this.save)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div className="buttons">
        <span onClick={() => close()}>Close</span>
      </div>
    </div>;
  }

  private onChange(key: keyof State, minValue: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (!value || value < minValue) return;

      this.setState(s => ({
        ...s,
        [key]: value,
      }), this.save);
    };
  }

  private save(): void {
    this.props.save(this.state);
  }
}
