import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { runPlaywrightInContainer } from '../playwrightContainer.ts';

/**
 * Narrow async child collector for the target E2E ownership inventory. Run as its own Node child
 * process from the synchronous `scripts/lib/e2eOwnerInventoryCollector.ts`
 * adapter so the verifier planner never has to await a promise. Collects
 * Playwright `--list` inventory for both configs that own target
 * `.e2e.spec.ts` discovery through the repository's existing Playwright
 * container boundary (`runPlaywrightInContainer`), never the host Playwright
 * binary, and writes the merged result to the `temp/` file named by
 * `MIOFRAME_E2E_OWNER_INVENTORY_RESULT_FILE`.
 */

const REPORTER = 'scripts/lib/e2eOwnerInventoryReporter.ts';
const OUTPUT_FILE_ENV = 'MIOFRAME_E2E_OWNER_INVENTORY_OUTPUT_FILE';
const RESULT_FILE_ENV = 'MIOFRAME_E2E_OWNER_INVENTORY_RESULT_FILE';
const CONTAINER_WORKDIR = '/work';
const TEMP_DIR = 'temp';

const CONFIGS = [
  { config: 'playwright.config.ts', label: 'e2e-owner-inventory' },
  { config: 'playwright.release.config.ts', label: 'e2e-owner-inventory-release' },
];

function uniqueTempFile(tag: string): string {
  return path.join(
    TEMP_DIR,
    `e2e-owner-inventory-${tag}-${process.pid}-${crypto.randomBytes(6).toString('hex')}.json`,
  );
}

// Reads `process.exitCode` from its own function scope so TypeScript can't
// carry over the `undefined` narrowing from the reset assignment just before
// each `runPlaywrightInContainer` call; the actual runtime value comes from
// `applyProcessResult` inside that call.
function currentExitCode(): number | string | null | undefined {
  return process.exitCode;
}

async function collectFromConfig({
  config,
  label,
}: {
  config: string;
  label: string;
}): Promise<unknown[]> {
  const hostOutputFile = uniqueTempFile(path.basename(config, '.ts'));

  try {
    process.exitCode = undefined;

    await runPlaywrightInContainer({
      label,
      config,
      extraArgs: ['--list', `--reporter=${REPORTER}`],
      extraEnv: {
        [OUTPUT_FILE_ENV]: `${CONTAINER_WORKDIR}/${hostOutputFile}`,
      },
      missingPodmanMessage:
        'Podman is required for containerized Playwright E2E ownership inventory collection.\nInstall Podman before running the verifier.',
      missingMetadataMessage:
        'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before E2E ownership inventory collection.',
      missingBinaryMessage:
        'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before E2E ownership inventory collection.',
      podmanFailureMessage:
        'Podman is required for containerized Playwright E2E ownership inventory collection, but `podman --version` failed.',
    });

    const listExitCode = currentExitCode();

    if (listExitCode !== 0) {
      throw new Error(
        `Playwright container list run failed for ${config} (exit ${listExitCode ?? 'unset'}).`,
      );
    }

    process.exitCode = undefined;

    return JSON.parse(fs.readFileSync(hostOutputFile, 'utf8'));
  } finally {
    fs.rmSync(hostOutputFile, { force: true });
  }
}

async function main() {
  const resultFile = process.env[RESULT_FILE_ENV];

  if (!resultFile) {
    throw new Error(
      `${RESULT_FILE_ENV} is required for the E2E owner inventory container collector.`,
    );
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const entries: unknown[] = [];

  for (const target of CONFIGS) {
    // Sequential by design: each container run acquires the shared
    // expensive-command lock, and running the two list collections
    // concurrently would contend for it instead of reusing it in turn.
    // oxlint-disable-next-line no-await-in-loop -- Sequential container runs share the expensive-command lock; see comment above.
    // eslint-disable-next-line no-await-in-loop -- Sequential container runs share the expensive-command lock; see comment above.
    entries.push(...(await collectFromConfig(target)));
  }

  fs.writeFileSync(resultFile, JSON.stringify(entries));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
}
