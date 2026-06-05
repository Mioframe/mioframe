/**
 * Write the root GitHub Pages 404.html SPA fallback dispatcher.
 *
 * GitHub Pages serves the root 404.html for any URL that maps to no physical
 * file in the deployment.  The inline script detects whether the 404'd path
 * belongs to a PR preview slot or the stable app, redirects to the correct
 * index.html root, and stores the original path in sessionStorage so the app
 * can restore it via History API after loading.
 *
 * Usage:
 *   node scripts/pages/writeSpaFallback.mjs --base /mioframe/ --output-dir ./pages-staging
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Classify a URL pathname for the SPA fallback redirect.
 * @param pathname - `window.location.pathname` of the 404'd URL.
 * @param base - Repository base path, e.g. `/mioframe/`.
 * @returns The index.html root to redirect to (`base` for stable,
 *   `base + pr-N/` for PR previews), or `null` when the path is outside the
 *   repository base and should remain a genuine 404.
 */
export function classifySpaPath(pathname, base) {
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length);
  const prMatch = rest.match(/^(pr-\d+)(?:\/|$)/);
  return prMatch ? base + prMatch[1] + '/' : base;
}

/**
 * Build the HTML content for the root GitHub Pages SPA fallback.
 *
 * The generated `404.html` is served by GitHub Pages for every missing path
 * under the deployment.  Its inline script classifies the path, stores it in
 * `sessionStorage` for post-load restoration, and redirects to the right
 * index.html root without exposing the app to a 404 error page.
 * @param base - The Vite base path, e.g. `/mioframe/`.
 * @returns HTML string for `404.html`.
 */
export function buildSpaFallbackHtml(base) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <script>
    (function () {
      var base = ${JSON.stringify(base)};
      var path = window.location.pathname;

      if (!path.startsWith(base)) {
        // Path is outside the repository base — genuine 404.
        return;
      }

      var rest = path.slice(base.length);
      var prMatch = rest.match(/^(pr-\\d+)(?:\\/|$)/);
      var targetRoot = prMatch ? base + prMatch[1] + '/' : base;

      sessionStorage.setItem('ghPagesSpaFallback', path + window.location.search + window.location.hash);
      window.location.replace(targetRoot);
    })();
  </script>
</head>
<body></body>
</html>
`;
}

/**
 * @param argv Process arguments (`process.argv.slice(2)`).
 */
export function writeSpaFallback(argv = process.argv.slice(2)) {
  const baseIndex = argv.indexOf('--base');
  const outputIndex = argv.indexOf('--output-dir');

  if (baseIndex === -1 || !argv[baseIndex + 1]) {
    throw new Error('Usage: writeSpaFallback.mjs --base <base-path> --output-dir <dir>');
  }
  if (outputIndex === -1 || !argv[outputIndex + 1]) {
    throw new Error('Usage: writeSpaFallback.mjs --base <base-path> --output-dir <dir>');
  }

  const base = argv[baseIndex + 1];
  const outputDir = argv[outputIndex + 1];

  const html = buildSpaFallbackHtml(base);
  writeFileSync(join(outputDir, '404.html'), html, 'utf8');
  console.log(`Wrote SPA fallback 404.html to ${outputDir}/404.html (base: ${base})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    writeSpaFallback();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
