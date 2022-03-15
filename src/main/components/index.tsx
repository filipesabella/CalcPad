import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Store } from '../lib/store';
import { App } from './App';
require('typeface-jetbrains-mono');

const store = new Store();
store.init().then(() => {
  ReactDOM.render(
    <App store={store} />,
    document.getElementById('root')
  );
});
