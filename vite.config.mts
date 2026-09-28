import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, Plugin } from 'vite';

const root = resolve(import.meta.dirname, 'src');

// fills in the list of built files and a version for the service worker to cache
const serviceWorker = (): Plugin => ({
  name: 'service-worker',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.values(bundle);
    const version = files
      .reduce((hash, file) =>
        hash.update(file.type === 'chunk' ? file.code : file.source),
        createHash('sha256'))
      .digest('hex')
      .slice(0, 16);
    const source = readFileSync(resolve(root, 'service-worker.js'), 'utf8')
      .replace('__MANIFEST__', JSON.stringify(files.map(f => f.fileName).sort()))
      .replace('__VERSION__', JSON.stringify(version));
    this.emitFile({ type: 'asset', fileName: 'service-worker.js', source });
  },
});

const targets = {
  web: { input: 'index.html', outDir: 'docs', plugins: [serviceWorker()] },
  desktop: { input: 'index-desktop.html', outDir: 'build', plugins: [] },
};

export default defineConfig(({ mode }) => {
  const target = targets[mode as keyof typeof targets] ?? targets.web;
  return {
    root,
    base: './',
    publicDir: 'html/assets',
    plugins: target.plugins,
    // convert-units depends on lodash 2, which expects node's `global`
    define: { global: 'globalThis' },
    server: { port: 1234, strictPort: true },
    build: {
      outDir: resolve(import.meta.dirname, target.outDir),
      emptyOutDir: true,
      rollupOptions: { input: resolve(root, target.input) },
    },
  };
});
