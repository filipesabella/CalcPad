import * as React from 'react';
import { textToNode } from './renderer';
import { textToResults } from './evaluator';
import { Store } from './store';

const Mousetrap = require('mousetrap');
const { remote, ipcRenderer } = (window as any).require('electron');
const fs = remote.require('fs');
const { dialog } = remote;

import './styles/app.less';

interface State {
  results: string[];
  value: string;
  currentLine: number;
}

const store = new Store();

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    this.setTitle();

    const value = store.getLastFileContent();

    this.state = {
      results: textToResults(value),
      value,
      currentLine: 0,
    };

    Mousetrap.bind(['command+s', 'ctrl+s'], () => {
      this.showSaveDialog();
      return false;
    });

    Mousetrap.bind(['command+o', 'ctrl+o'], () => {
      this.showOpenDialog();
      return false;
    });

    Mousetrap.bind(['command+n', 'ctrl+n'], () => {
      this.newFile();
      return false;
    });

    ipcRenderer.on('new-file', () => this.newFile());
    ipcRenderer.on('save-file', () => this.showSaveDialog());
    ipcRenderer.on('open-file', () => this.showOpenDialog());
  }

  public render(): React.ReactNode {
    this.resizeTextArea();

    const { value, results, currentLine } = this.state;

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
        onKeyUp={_ => this.cursorChanged()}
        value={value}
        ref={this.textAreaRef}></textarea>
    </div>;
  }

  public componentDidMount(): void {
    this.resizeTextArea();
  }

  private resizeTextArea(): void {
    if (this.textAreaRef.current) {
      this.textAreaRef.current.style.height =
        this.textRef.current!.clientHeight + 'px';
    }
  }

  private onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;
    this.setState({
      value,
      results: textToResults(value)
    });

    store.save(value);
  }

  private cursorChanged(): void {
    if (this.textAreaRef.current) {
      this.setState({
        currentLine: this.textAreaRef.current.value
          .substr(0, this.textAreaRef.current.selectionStart)
          .split('\n').length - 1,
      });
    }
  }

  private showSaveDialog(): void {
    // we already save on change
    if (!store.isTempFile()) return;

    dialog.showSaveDialog(null, {
      title: 'Save'
    }, (file: string) => {
      if (!file) return; // user cancelled

      fs.writeFileSync(file, this.state.value);
      store.setLastFile(file);
    });
  }

  private showOpenDialog(): void {
    dialog.showOpenDialog(null, {
      title: 'Open',
      properties: ['openFile'],
    }, (files: string) => {
      if (!files || files.length === 0) return; // user cancelled

      const file = files[0];

      const contents = fs.readFileSync(file).toString();
      this.setState({
        value: contents,
        results: textToResults(contents),
      });

      store.setLastFile(file);
      this.setTitle();
    });
  }

  private newFile() {
    store.setLastFile(null);
    store.save('');
    this.setState({
      results: [],
      value: '',
      currentLine: 0,
    });
    this.setTitle();
  }

  private setTitle() {
    const title = store.isTempFile()
      ? 'PCalc'
      : 'PCalc - ' + store.getLastFile();

    remote.BrowserWindow.getAllWindows()[0].setTitle(title);
  }

}
