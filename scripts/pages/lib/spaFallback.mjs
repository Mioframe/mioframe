/**
 * Classify a URL pathname for the SPA fallback redirect.
 * @param pathname - `window.location.pathname` of the 404'd URL.
 * @returns The index.html root to redirect to: `/` for stable, `/branch/<slug>/`
 *   for a branch deployment, or `/pr/<number>/` for a PR preview.
 */
export function classifySpaPath(pathname) {
  const branchMatch = pathname.match(/^\/branch\/([^/]+)(?:\/|$)/);
  if (branchMatch) return `/branch/${branchMatch[1]}/`;

  const prMatch = pathname.match(/^\/pr\/(\d+)(?:\/|$)/);
  if (prMatch) return `/pr/${prMatch[1]}/`;

  return '/';
}

/**
 * Build the HTML content for the org-root GitHub Pages SPA fallback.
 * @returns HTML string for `404.html`.
 */
export function buildSpaFallbackHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <script>
    (function () {
      var path = window.location.pathname;
      var branchMatch = path.match(/^\\/branch\\/([^/]+)(?:\\/|$)/);
      var prMatch = path.match(/^\\/pr\\/(\\d+)(?:\\/|$)/);
      var targetRoot = branchMatch
        ? '/branch/' + branchMatch[1] + '/'
        : prMatch
          ? '/pr/' + prMatch[1] + '/'
          : '/';

      try {
        sessionStorage.setItem('ghPagesSpaFallback', path + window.location.search + window.location.hash);
      } catch {
        // Best-effort path restoration only.
      }
      window.location.replace(targetRoot);
    })();
  </script>
</head>
<body></body>
</html>
`;
}
