import * as React from 'react';

import './styles/app.less';

interface State {
  results: string[];
  value: string;
}

export class App extends React.Component<{}, State> {
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

    const textToRender = value.split('\n').map((line, i) => {
      return <div key={i}>{line}</div>;
    });

    return <div className="app">
      <div className="textContainer">
        <div className="text">{textToRender}</div>
        <textarea
          autoFocus={true}
          onChange={e => this.onChange(e)}
          value={value}></textarea>
      </div>

      <div className="results">
        {results.map((result, i) =>
          <div key={i}>{result}</div>)}
      </div>
    </div>;
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
        return result.toFixed(4);
      }
    } catch (e) {
      // console.error(e);
      // hehe :v
      return 'ERR';
    }
  });
}

function transform(text: string): string {
  if (isAssignment(text)) {
    // trick so that `eval` returns the value of the assignment
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
