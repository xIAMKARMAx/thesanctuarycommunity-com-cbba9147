// Minimal service worker: enables install prompt, network-first, no stale caching.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Pass through to network (default behavior). No offline cache to avoid stale app versions.
});
