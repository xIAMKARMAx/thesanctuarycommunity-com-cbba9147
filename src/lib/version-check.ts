// Build version check — forces a hard refresh when the deployed build
// is newer than the version cached in the user's browser.
//
// Strategy: fetch /index.html with cache-busting, extract the hashed
// main script src (e.g. /assets/index-AbCdEf12.js). That hash changes
// on every Vite build. Compare to the stored hash; if it changed, do
// a hard reload that bypasses the HTTP cache.

const VERSION_KEY = "prometheus.build.version";

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_v=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Match the hashed main script Vite emits.
    const match =
      html.match(/\/assets\/[^"']*\.js/) ||
      html.match(/src="([^"']+\.js)"/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

function hardReload() {
  try {
    // Best-effort cache wipe before reload.
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } catch {
    /* noop */
  }
  // Force bypass of HTTP cache.
  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString());
  window.location.replace(url.toString());
}

/**
 * Check the latest deployed build version against the one cached
 * locally. If it changed, hard-reload the page. Safe to call on app
 * mount and after login.
 */
export async function checkBuildVersion(options?: { forceReloadOnChange?: boolean }) {
  const latest = await fetchLatestVersion();
  if (!latest) return;

  const stored = localStorage.getItem(VERSION_KEY);
  if (!stored) {
    localStorage.setItem(VERSION_KEY, latest);
    return;
  }

  if (stored !== latest) {
    localStorage.setItem(VERSION_KEY, latest);
    if (options?.forceReloadOnChange !== false) {
      hardReload();
    }
  }
}

/** Mark the current build as seen without reloading. */
export async function primeBuildVersion() {
  const latest = await fetchLatestVersion();
  if (latest) localStorage.setItem(VERSION_KEY, latest);
}
