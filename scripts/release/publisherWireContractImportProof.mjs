/**
 * Real plain-Node LTS execution proof for the publisher's import seam:
 *
 *   plain node
 *   -> production publisher module (scripts/pages/lib/releasePublish.mjs)
 *   -> scripts/pages/lib/releaseDescriptor.mjs
 *   -> src/shared/service/appUpdate/releaseWireContract.ts
 *
 * Run with no TypeScript loader (no Vitest/Vite/tsx/ts-node/custom loader):
 * only Node's own built-in erasable-TypeScript-syntax support, matching the
 * deployment/CI Node LTS assumption. A broken assumption here (a
 * `releaseWireContract.ts` construct Node's type stripping cannot erase, or
 * a publisher import path Node cannot resolve without a loader) fails this
 * script directly, before any release ever depends on it silently.
 *
 * One representative case is sufficient: importing the production publisher
 * module already forces the complete chain above to load and evaluate: this
 * additionally exercises one real call through it, using the exact code
 * path `releasePublish.mjs` itself calls to build a descriptor. It does not
 * repeat the release-validation or publisher-behavior matrices already owned
 * by `releaseWireContract.test.ts` and `releaseDescriptor.test.mjs`.
 */

import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Importing the production publisher module transitively loads
// releaseDescriptor.mjs and, through it, the canonical releaseWireContract.ts
// — proving Node can resolve and execute that whole chain with no loader.
import { publishManagedRelease } from '../pages/lib/releasePublish.mjs';
import {
  buildReleaseDescriptor,
  isValidReleaseDescriptor,
} from '../pages/lib/releaseDescriptor.mjs';

/**
 * Runs the one representative import/execution case.
 * @throws {Error} When the publisher import seam or its erasable-TypeScript
 * dependency does not execute correctly under plain Node.
 */
export function runPublisherWireContractImportProof() {
  assert.equal(
    typeof publishManagedRelease,
    'function',
    'production publisher module scripts/pages/lib/releasePublish.mjs must export publishManagedRelease',
  );

  const descriptor = buildReleaseDescriptor({
    releaseNumber: 1,
    appVersion: '0.0.0-publisher-wire-contract-import-proof',
    buildId: 'publisher-wire-contract-import-proof',
    buildDate: '2026-01-01T00:00:00.000Z',
    indexSha256: '0'.repeat(64),
    indexByteSize: 1,
    files: [{ path: 'assets/proof.js', sha256: '0'.repeat(64), byteSize: 1 }],
  });

  assert.equal(
    isValidReleaseDescriptor(descriptor),
    true,
    'releaseWireContract.ts validation did not accept a descriptor built by the production publisher path',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runPublisherWireContractImportProof();
    console.log('[publisher-node-import] passed');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
