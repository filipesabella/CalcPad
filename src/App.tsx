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
a * 2`;
    this.state = {
      value,
      results: doit(value),
    };
  }

  public render(): React.ReactNode {
    return <div className="app">
      <textarea
        autoFocus={true}
        onChange={e => this.onChange(e)}
        value={this.state.value}></textarea>

      <div className="results">
        {this.state.results.map((result, i) =>
          <div key={i}>{result}</div>)}
      </div>
    </div>;
  }

  private onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;
    this.setState({
      value,
      results: doit(value)
    });
  }
}

function doit(text: string): string[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    try {
      if (line === '') {
        return '';
      } else {
        return eval(lines.slice(0, i + 1).map(transform).join('\n'));
      }
    } catch (e) {
      // console.error(e);
      // hehe :v
      return '';
    }
  });
}

function transform(text: string): string {
  if (text.includes('=')) {
    // trick so that `eval` returns the value of the assignment
    // receives `a = 1` and returns
    // `var a
    //  a = 1`
    return 'var ' + text.split('=')[0] + '\n' + text;
  } else {
    return text;
  }
}
