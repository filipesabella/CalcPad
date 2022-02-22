import * as React from 'react';
import ReactDOM from 'react-dom';
import { Store } from '../store';
import { App } from './App';

const store = new Store();
store.init().then(() => {
  ReactDOM.render(
    <App store={store} />,
    document.getElementById('root')
  );
});
