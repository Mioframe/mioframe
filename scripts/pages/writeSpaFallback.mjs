/**
 * Write the org-root GitHub Pages 404.html SPA fallback dispatcher.
 *
 * GitHub Pages serves the single site-wide root 404.html for any URL that
 * maps to no physical file anywhere in the Mioframe/mioframe.github.io
 * deployment. The inline script classifies the 404'd path into one of the
 * three channel roots (stable `/`, a branch `/branch/<slug>/`, or a PR
 * preview `/pr/<number>/`), redirects to that root's index.html, and stores
 * the original path in sessionStorage so the app can restore it via the
 * History API after loading (see `src/app/ghPagesSpaFallback.ts`).
 *
 * This file is channel-independent: trusted Pages publish tooling enforces it
 * at the repository root for stable, branch, and PR preview publishes. Its
 * content does not depend on which channel triggered the write, so it is safe
 * to regenerate from any deployment.
 *
 * Usage:
 *   node scripts/pages/writeSpaFallback.mjs --output-dir ./pages-staging
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildSpaFallbackHtml } from './lib/spaFallback.mjs';

/**
 * @param argv Process arguments (`process.argv.slice(2)`).
 */
export function writeSpaFallback(argv = process.argv.slice(2)) {
  const outputIndex = argv.indexOf('--output-dir');

  if (outputIndex === -1 || !argv[outputIndex + 1]) {
    throw new Error('Usage: writeSpaFallback.mjs --output-dir <dir>');
  }

  const outputDir = argv[outputIndex + 1];

  const html = buildSpaFallbackHtml();
  writeFileSync(join(outputDir, '404.html'), html, 'utf8');
  console.log(`Wrote SPA fallback 404.html to ${outputDir}/404.html`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    writeSpaFallback();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
