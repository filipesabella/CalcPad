import * as React from 'react';

import './styles/app.less';

export class App extends React.Component {
  public render(): React.ReactNode {
    return <div className="app">
      <textarea
        autofocus="true"
        onChange={e => this.onchange(e)}></textarea>
      <div className="results"></div>
    </div>;
  }

  private onchange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;
    console.log(value);
  }
}
