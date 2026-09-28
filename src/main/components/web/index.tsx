import '@fontsource/jetbrains-mono';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { LocalStorageStore } from '../../lib/LocalStorageStore';
import { App } from './App';

createRoot(document.getElementById('root')!)
  .render(<App store={new LocalStorageStore()} />);

if (import.meta.env.PROD) {
  navigator.serviceWorker.register('service-worker.js');
}
