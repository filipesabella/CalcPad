import * as React from 'react';
import { textToNode } from './renderer';

import './styles/app.less';
import { textToResults } from './evaluator';

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
}
