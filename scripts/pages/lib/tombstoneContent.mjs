/**
 * Build the Cache Storage name prefix owned by a branch channel's service
 * worker. Must match the prefix `config/plugins/pwa.ts` uses when building
 * `runtimeCaching` cache names for the same branch channel, so a tombstone
 * clears exactly (and only) the caches its own branch ever wrote.
 * @param slug Branch slug.
 * @returns Cache name prefix, e.g. `branch-develop-`.
 */
export function buildBranchCacheNamePrefix(slug) {
  return `branch-${slug}-`;
}

/**
 * Build the literal `sw.js` source for a branch tombstone.
 *
 * On activation, deletes only caches in this branch's own namespace
 * (`buildBranchCacheNamePrefix`) — never stable, PR, or other branch
 * caches — then claims existing clients so the next navigation in this
 * scope is served fresh. Registers no `fetch` handler (network passthrough)
 * and never messages open clients to reload: this is passive self-cleanup,
 * not forced-reload coordination.
 * @param slug Branch slug the tombstone belongs to.
 * @returns Service worker source text.
 */
export function buildTombstoneServiceWorker(slug) {
  const cachePrefix = buildBranchCacheNamePrefix(slug);

  return `// Tombstone service worker for the removed "${slug}" branch deployment.
// Clears only this branch's own cache namespace; does not touch stable, PR,
// or other branch caches, and does not force any client reload.
const CACHE_PREFIX = ${JSON.stringify(cachePrefix)};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});
`;
}

/**
 * Build the `manifest.webmanifest` object for a branch tombstone. Keeps the
 * same `scope`/`start_url`/`id` as the removed branch deployment so an
 * already-installed PWA icon still resolves to this page.
 * @param slug Branch slug.
 * @param baseUrl Branch base URL, e.g. `/branch/develop/`.
 * @returns Web app manifest object.
 */
export function buildTombstoneManifest(slug, baseUrl) {
  return {
    name: `Mioframe ${slug} (removed)`,
    short_name: 'Removed',
    start_url: baseUrl,
    scope: baseUrl,
    id: baseUrl,
    display: 'minimal-ui',
  };
}

/**
 * Build the `index.html` source for a branch tombstone: a static page
 * announcing the branch was removed, linking to the stable app root, and
 * registering the tombstone service worker at the branch's own scope.
 * @param slug Branch slug.
 * @param baseUrl Branch base URL, e.g. `/branch/develop/`.
 * @returns HTML source text.
 */
export function buildTombstoneHtml(slug, baseUrl) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Branch removed — Mioframe</title>
  <link rel="manifest" href="manifest.webmanifest" />
</head>
<body>
  <main>
    <h1>This branch preview was removed</h1>
    <p>The "${slug}" branch no longer exists, so this preview is no longer updated.</p>
    <p><a href="/">Go to the stable app</a></p>
  </main>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js', { scope: ${JSON.stringify(baseUrl)} });
    }
  </script>
</body>
</html>
`;
}

/**
 * Build the full set of static tombstone files for a removed branch
 * deployment, keyed by filename relative to the branch's `branch/<slug>/`
 * directory.
 * @param slug Branch slug.
 * @param baseUrl Branch base URL, e.g. `/branch/develop/`.
 * @returns Map of relative filename to file content (strings; the manifest
 * value is a JSON string).
 */
export function buildTombstoneFiles(slug, baseUrl) {
  return {
    'index.html': buildTombstoneHtml(slug, baseUrl),
    'sw.js': buildTombstoneServiceWorker(slug),
    'manifest.webmanifest': JSON.stringify(buildTombstoneManifest(slug, baseUrl), null, 2) + '\n',
  };
}
