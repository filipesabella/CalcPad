import * as React from 'react';
import { textToNode } from './renderer';
import { textToResults } from './evaluator';

const Mousetrap = require('mousetrap');
const remote = (window as any).require('electron').remote;
const dialog = remote.dialog;
const fs = remote.require('fs');

import './styles/app.less';

interface State {
  results: string[];
  value: string;
  currentLine: number;
}

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    this.state = {
      results: [],
      value: '',
      currentLine: 0,
    };

    let value = `1 + 2
20 * 33
a = 20
a * 2
asd
# comment test
a * a
2 ^ 3 ^ 2
b = sqrt 9 + 2k
20% of 10K
20% on 10M
20% off 10 billion
2 * PI
E / 2`;
    this.state = {
      value,
      results: textToResults(value),
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

    Mousetrap.bind('/', () => {
      console.log('argh');
      return false;
    });
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
  }

  private cursorChanged(): void {
    if (this.textAreaRef.current) {
      this.setState({
        currentLine: this.textAreaRef.current.value
          .substr(0, this.textAreaRef.current.selectionStart)
          .split('\n').length - 1
      });
    }
  }

  private showSaveDialog(): void {
    console.log('???');
    dialog.showSaveDialog(null, {
      title: 'Save'
    }, (file: string) => {
      console.log('saveaaa', file);
      if (!file) return; // user cancelled
    });
  }

  private showOpenDialog(): void {
    dialog.showOpenDialog(null, {
      title: 'Open',
      properties: ['openFile'],
    }, (file: string) => {
      if (!file || file.length === 0) return;

      const contents = fs.readFileSync(file[0]).toString();
      this.setState({
        value: contents,
        results: textToResults(contents),
      });
    });
  }
}
