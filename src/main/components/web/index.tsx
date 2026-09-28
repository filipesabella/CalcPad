import '@fontsource/jetbrains-mono';
import { render } from 'preact';
import { LocalStorageStore } from '../../lib/LocalStorageStore';
import { App } from './App';

render(
  <App store={new LocalStorageStore()} />,
  document.getElementById('root')!,
);

if (import.meta.env.PROD) {
  navigator.serviceWorker.register('service-worker.js');
}
