// the manifest and version are filled in at build time, see vite.config.ts
const manifest = ["assets/index-BcMUVO0c.css","assets/index-D3UUC2Cf.js","assets/jetbrains-mono-cyrillic-400-normal-BEIGL1Tu.woff2","assets/jetbrains-mono-cyrillic-400-normal-ugxPyKxw.woff","assets/jetbrains-mono-greek-400-normal-B9oWc5Lo.woff","assets/jetbrains-mono-greek-400-normal-C190GLew.woff2","assets/jetbrains-mono-latin-400-normal-6-qcROiO.woff","assets/jetbrains-mono-latin-400-normal-V6pRDFza.woff2","assets/jetbrains-mono-latin-ext-400-normal-Bc8Ftmh3.woff2","assets/jetbrains-mono-latin-ext-400-normal-fXTG6kC5.woff","assets/jetbrains-mono-vietnamese-400-normal-CqNFfHCs.woff","index.html"];
const version = "1fac6b37c562b898";

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
