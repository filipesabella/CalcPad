import * as React from 'react';

import './styles/app.less';

interface State {
  results: string[];
  value: string;
}

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    this.state = {
      results: [],
      value: '',
    };

    const value = `1 + 2
20 * 33
a = 20
a * 2
asd
a * a`;
    this.state = {
      value,
      results: textToResults(value),
    };
  }

  public render(): React.ReactNode {
    const { value, results } = this.state;

    const textToRender = value.split('\n').map(textToNode);

    this.resizeTextArea();

    return <div className="app">
      <div className="textContainer">
        <div
          className="text"
          ref={this.textRef}>{textToRender}</div>
        <textarea
          id="textarea"
          autoFocus={true}
          onChange={e => this.onChange(e)}
          value={value}
          ref={this.textAreaRef}></textarea>
      </div>

      <div className="results">
        {results.map((result, i) =>
          <div key={i}>{result}</div>)}
      </div>
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
}

/**
 * Receives
 * 1 + 2
 * a = 20
 * a * 2
 *
 * and returns
 * [3, 20, 40]
 */
function textToResults(text: string): string[] {
  const lines = text.split('\n');

  let assignments = '';
  return lines.map((line, i) => {
    try {
      if (line === '') {
        return '';
      } else {
        const transformedLine = transform(line);
        const result = eval(assignments + transformedLine);
        if (isAssignment(line)) {
          assignments += transformedLine + '\n';
        }
        const numberToDisplay = Math.round(result) !== result
          ? result.toFixed(2)
          : result;

        return numberToDisplay;
      }
    } catch (e) {
      // console.error(e);
      // hehe :v
      return 'ERR';
    }
  });
}

function textToNode(text: string, index: number)
  : React.ReactElement<HTMLDivElement> {
  if (isAssignment(text)) {
    const variable = text.substring(0, text.indexOf('='));
    const rest = text.substring(text.indexOf('='));
    return <div key={index}>
      <span className="variable">{variable}</span>
      <span>{rest}</span>
    </div>;
  } else {
    return <div key={index}>{text}</div>;
  }
}

function transform(text: string): string {
  if (isAssignment(text)) {
    // trick so that `eval` returns the value of the assignment.
    // receives `a = 1` and returns
    // `var a
    //  a = 1`
    return 'var ' + text.split('=')[0] + '\n' + text;
  } else {
    return text;
  }
}

function isAssignment(text: string): boolean {
  return text.includes('=');
}
