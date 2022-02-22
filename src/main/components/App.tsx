import * as React from 'react';
import { textToResults } from '../evaluator';
import { textToNode } from '../renderer';
import { Store } from '../store';
import { Help } from './Help';
import { Preferences, PreferencesDialog } from './PreferencesDialog';

const { ipcRenderer } = window.require('electron');

require('../styles/app.less');

interface State {
  loading: boolean;
  results: string[];
  value: string;
  currentLine: number;
  showPreferences: boolean;
  showHelp: boolean;
  preferences: Preferences;
}

const store = new Store();

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    this.state = {
      loading: true,
      results: [],
      value: '',
      currentLine: 0,
      showPreferences: false,
      showHelp: false,
      preferences: {} as any,
    };

    // sent by the menus
    ipcRenderer.on('new-file', () => this.newFile());
    ipcRenderer.on('save-file', () => this.showSaveDialog());
    ipcRenderer.on('open-file', () => this.showOpenDialog());
    ipcRenderer.on('open-preferences', () => this.showPreferences());
    ipcRenderer.on('open-help', () => this.showHelp());

    window.onkeyup = e => {
      if (e.key === 'Escape') {
        this.setState({
          showPreferences: false,
          showHelp: false,
        });
      }
    };
  }

  public componentDidMount(): void {
    this.resizeTextArea();

    store.init().then(async () => {
      const value = await store.getLastFileContent();
      const preferences = store.loadPreferences();

      this.setState({
        loading: false,
        results: textToResults(value, preferences),
        value,
        currentLine: 0,
        showPreferences: false,
        showHelp: false,
        preferences,
      });
    });
  }

  public render(): React.ReactNode {
    this.setTitle();
    this.resizeTextArea();

    const {
      loading,
      value,
      results,
      currentLine,
      showPreferences,
      showHelp,
      preferences, } = this.state;

    this.setPreferences(this.state.preferences);

    const linesToRender = value.split('\n').map(textToNode);

    if (loading) {
      return <div>loading</div>;
    }

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
        spellCheck={false}
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
        this.state.preferences),
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
            .substring(0, ref.selectionStart)
            .split('\n').length - 1,
        });
      }, 0);
    }
  }

  private showSaveDialog(): void {
    // we already save on change
    if (!store.isTempFile()) return;

    ipcRenderer.invoke('dialog', 'showSaveDialog', {
      title: 'Save'
    }).then((result: any) => {
      const file = result.filePath;
      file && store.saveFile(file, this.state.value);
    });
  }

  private showOpenDialog(): void {
    ipcRenderer.invoke('dialog', 'showOpenDialog', {
      title: 'Open',
      properties: ['openFile'],
    }).then(async (result: any) => {
      const files = result.filePaths;
      if (!files || files.length === 0) return; // user cancelled

      const contents = await store.open(files[0]);

      this.setState({
        value: contents,
        results: textToResults(
          contents,
          this.state.preferences),
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
    // TODO
    // const title = store.isTempFile()
    //   ? 'CalcPad'
    //   : 'CalcPad - ' + store.getLastFile();

    // TODO
    // remote.BrowserWindow.getAllWindows()[0].setTitle(title);
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
        preferences),
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

  private showHelp(): void {
    this.setState({ showHelp: true, });
  }

  private closeHelp(): void {
    this.setState({ showHelp: false, });
  }
}
