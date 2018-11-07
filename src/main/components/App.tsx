import * as React from 'react';
import { textToNode } from '../renderer';
import { textToResults } from '../evaluator';
import { Store } from '../store';
import { PreferencesDialog, Preferences } from './PreferencesDialog';
import { requestForex, Forex, DefaultForex } from '../forex';

const { remote, ipcRenderer } = (window as any).require('electron');
const { dialog } = remote;

import '../styles/app.less';
import { Help } from './Help';

interface State {
  results: string[];
  value: string;
  currentLine: number;
  showPreferences: boolean;
  showHelp: boolean;
  preferences: Preferences;
  forex: Forex;
}

const store = new Store();

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    const value = store.getLastFileContent();
    const preferences = store.loadPreferences();

    this.state = {
      results: textToResults(value, preferences.decimalPlaces, DefaultForex),
      value,
      currentLine: 0,
      showPreferences: false,
      showHelp: false,
      preferences,
      forex: DefaultForex,
    };

    // sent by the menus
    ipcRenderer.on('new-file', () => this.newFile());
    ipcRenderer.on('save-file', () => this.showSaveDialog());
    ipcRenderer.on('open-file', () => this.showOpenDialog());
    ipcRenderer.on('open-preferences', () => this.showPreferences());
    ipcRenderer.on('open-help', () => this.showHelp());

    window.onkeyup = e => {
      if (e.which === 27) { // escape
        this.setState({
          showPreferences: false,
          showHelp: false,
        });
      }
    };
  }

  public componentWillMount(): void {
    requestForex(store).then(forex => this.setState(s => ({
      forex,
      results: textToResults(s.value,
        s.preferences.decimalPlaces,
        forex),
    })));
  }

  public render(): React.ReactNode {
    this.setTitle();
    this.resizeTextArea();

    const {
      value,
      results,
      currentLine,
      showPreferences,
      showHelp,
      preferences, } = this.state;

    this.setPreferences(this.state.preferences);

    const linesToRender = value.split('\n').map(textToNode);

    return <div className="app">
      <div className="texts" ref={this.textRef}>
        {linesToRender.map((line, i) =>
          <div key={i}
            className={'line ' + (currentLine === i ? 'current' : '')}>
            <div className="text">{line}</div>
            <div className="result">{results[i]}</div>
          </div>)}
      </div>
      <textarea
        id="textarea"
        className="mousetrap"
        autoFocus={true}
        onChange={e => this.onChange(e)}
        onClick={_ => this.cursorChanged()}
        onKeyDown={_ => this.cursorChanged()}
        value={value}
        ref={this.textAreaRef}></textarea>
      {showPreferences && <PreferencesDialog
        preferences={preferences}
        close={() => this.closePreferencesDialog()}
        save={(preferences: Preferences) => this.savePreferences(preferences)}
      />}
      {showHelp && <Help close={() => this.closeHelp()} />}
    </div>;
  }

  public componentDidMount(): void {
    this.resizeTextArea();
  }

  private resizeTextArea(): void {
    if (this.textAreaRef.current) {
      this.textAreaRef.current.style.height =
        this.textRef.current!.clientHeight + 10 + 'px';
    }
  }

  private onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;
    this.setState({
      value,
      results: textToResults(
        value,
        this.state.preferences.decimalPlaces,
        this.state.forex),
    });

    store.save(value);
  }

  private cursorChanged(): void {
    if (this.textAreaRef.current) {
      const ref = this.textAreaRef.current;
      // using timeout otherwise it lags one event because of the
      // keydown instead of keyup
      setTimeout(() => {
        this.setState({
          currentLine: this.state.value
            .substr(0, ref.selectionStart)
            .split('\n').length - 1,
        });
      }, 0);
    }
  }

  private showSaveDialog(): void {
    // we already save on change
    if (!store.isTempFile()) return;

    dialog.showSaveDialog(null, {
      title: 'Save'
    }, (file: string) => {
      file && store.saveFile(file, this.state.value);
    });
  }

  private showOpenDialog(): void {
    dialog.showOpenDialog(null, {
      title: 'Open',
      properties: ['openFile'],
    }, (files: string) => {
      if (!files || files.length === 0) return; // user cancelled

      const contents = store.open(files[0]);

      this.setState({
        value: contents,
        results: textToResults(
          contents,
          this.state.preferences.decimalPlaces,
          this.state.forex),
      });
    });
  }

  private newFile() {
    store.newFile();
    this.setState({
      results: [],
      value: '',
      currentLine: 0,
    });
  }

  private setTitle() {
    const title = store.isTempFile()
      ? 'CalcPad'
      : 'CalcPad - ' + store.getLastFile();

    remote.BrowserWindow.getAllWindows()[0].setTitle(title);
  }

  private showPreferences(): void {
    this.setState({
      showPreferences: true,
    });
  }

  private savePreferences(preferences: Preferences): void {
    store.savePreferences(preferences);
    this.setState({ preferences });

    // recalculate results as precision might have been changed
    this.setState(s => ({
      results: textToResults(
        s.value,
        preferences.decimalPlaces,
        this.state.forex),
    }));
  }

  private closePreferencesDialog(): void {
    this.setState({ showPreferences: false });
    this.textAreaRef.current!.focus();
  }

  private setPreferences(preferences: Preferences): void {
    if (document.documentElement) {
      const style = document.documentElement.style;
      style.setProperty('--font-size', preferences.fontSize + 'px');
      style.setProperty('--line-height', preferences.fontSize + 10 + 'px');

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

  private showHelp(): void {
    this.setState({ showHelp: true, });
  }

  private closeHelp(): void {
    this.setState({ showHelp: false, });
  }
}
