// the manifest and version are filled in at build time, see vite.config.ts
const manifest = __MANIFEST__;
const version = __VERSION__;

async function install() {
  const cache = await caches.open(version);
  await cache.addAll(manifest);
}
addEventListener('install', e => e.waitUntil(install()));

async function activate() {
  const keys = await caches.keys();
  await Promise.all(
    keys.map(key => key !== version && caches.delete(key)),
  );
}
addEventListener('activate', e => e.waitUntil(activate()));
