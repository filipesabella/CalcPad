import '@fontsource/jetbrains-mono';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FileStore } from '../../lib/store';
import { App } from './App';

const store = new FileStore();
store.init().then(() => {
  ReactDOM.render(
    <App store={store} />,
    document.getElementById('root')
  );
});
