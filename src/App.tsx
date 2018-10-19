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
20 * 33`;
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
  return lines.map(line => eval(line));
}
