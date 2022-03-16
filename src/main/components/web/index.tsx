import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LocalStorageStore } from '../../lib/LocalStorageStore';
import { App } from './App';
require('typeface-jetbrains-mono');

ReactDOM.render(
  <App store={new LocalStorageStore()} />,
  document.getElementById('root')
);
