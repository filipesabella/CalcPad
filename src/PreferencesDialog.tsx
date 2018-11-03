import * as React from 'react';

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

interface State extends Preferences { }

export class PreferencesDialog extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p);

    this.state = {
      fontSize: p.preferences.fontSize,
      decimalPlaces: p.preferences.decimalPlaces,
      theme: p.preferences.theme,
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
          onChange={e => this.setState(
            { fontSize: parseInt(e.target.value) }, this.save)} />
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
          onChange={e => this.setState(
            { decimalPlaces: parseInt(e.target.value) }, this.save)} />
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

  private save(): void {
    this.props.save(this.state);
  }
}
