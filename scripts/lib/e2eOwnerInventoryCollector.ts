import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RawE2ESpecInventoryEntry } from './e2eOwnerInventory.ts';

/**
 * Collects the target E2E ownership inventory (spec path plus its union of
 * test annotations) via Playwright's own `--list` mode against both configs
 * that own target `.e2e.spec.ts` discovery: `playwright.config.ts` for
 * ordinary target E2E and `playwright.release.config.ts` for
 * `productionArtifact/` target E2E (see
 * docs/testing/verify-redesign-pass-d-implementation.md's "Exceptional
 * additional owners"). List mode never launches a browser or a webServer, so
 * this runs directly, without the Podman container used by real E2E
 * execution. Filters the merged result down to `.e2e.spec.ts` files only,
 * dropping the release config's colocated appUpdate browser-integration
 * corpus.
 */

const PLAYWRIGHT_BIN = 'node_modules/.bin/playwright';
const REPORTER = 'scripts/lib/e2eOwnerInventoryReporter.mjs';
const TARGET_SUFFIX = '.e2e.spec.ts';
const OUTPUT_FILE_ENV = 'MIOFRAME_E2E_OWNER_INVENTORY_OUTPUT_FILE';

function collectFromConfig(configPath: string): RawE2ESpecInventoryEntry[] {
  const outputFile = path.join(
    os.tmpdir(),
    `mioframe-e2e-owner-inventory-${path.basename(configPath, '.ts')}-${process.pid}-${Math.random()
      .toString(36)
      .slice(2)}.json`,
  );

  try {
    const result = spawnSync(
      PLAYWRIGHT_BIN,
      ['test', '--config', configPath, '--list', `--reporter=${REPORTER}`],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          [OUTPUT_FILE_ENV]: outputFile,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
      },
    );

    if (result.status !== 0) {
      throw new Error(
        `playwright --list failed for ${configPath} (exit ${result.status ?? 'null'}): ${
          result.stderr.trim() || result.stdout.trim() || 'no output'
        }`,
      );
    }

    return JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  } finally {
    fs.rmSync(outputFile, { force: true });
  }
}

/**
 * Collect and merge the ordinary and productionArtifact target E2E
 * ownership inventory, filtered to `.e2e.spec.ts` files.
 * @returns Merged inventory entries.
 */
export function collectE2EOwnerInventory(): RawE2ESpecInventoryEntry[] {
  const entries = [
    ...collectFromConfig('playwright.config.ts'),
    ...collectFromConfig('playwright.release.config.ts'),
  ];

  return entries.filter((entry) => entry.specPath.endsWith(TARGET_SUFFIX));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(collectE2EOwnerInventory()));
}
