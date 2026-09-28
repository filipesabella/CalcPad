import '@fontsource/jetbrains-mono';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { FileStore } from '../../lib/store';
import { App } from './App';

const store = new FileStore();
store.init().then(() => {
  createRoot(document.getElementById('root')!)
    .render(<App store={store} />);
});
