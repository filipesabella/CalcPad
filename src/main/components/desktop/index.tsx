import '@fontsource/jetbrains-mono';
import { render } from 'preact';
import { FileStore } from '../../lib/store';
import { App } from './App';

const store = new FileStore();
store.init().then(() => {
  render(<App store={store} />, document.getElementById('root')!);
});
