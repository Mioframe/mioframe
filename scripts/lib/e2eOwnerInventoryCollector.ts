import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RawE2ESpecInventoryEntry } from './e2eOwnerInventory.ts';

/**
 * Collects the target E2E ownership inventory (spec path plus its union of
 * test annotations) through the repository's existing Playwright container
 * boundary: every Playwright invocation in this repository runs inside that
 * container, so this ownership inventory reuses the same boundary instead of
 * invoking Playwright directly from the synchronous planner. This
 * synchronous adapter never invokes Playwright itself; it spawns one narrow
 * async Node child collector (`scripts/lib/e2eOwnerInventoryContainer.ts`)
 * that runs Playwright's `--list` mode against both configs that own target
 * `.e2e.spec.ts` discovery — `playwright.config.ts` for ordinary target E2E
 * and `playwright.release.config.ts` for `productionArtifact/` target E2E —
 * through `runPlaywrightInContainer`, launching no
 * browser. Filters the merged result down to `.e2e.spec.ts` files only,
 * dropping the release config's colocated appUpdate browser-integration
 * corpus.
 */

const COLLECTOR_SCRIPT = 'scripts/lib/e2eOwnerInventoryContainer.ts';
const TARGET_SUFFIX = '.e2e.spec.ts';
const RESULT_FILE_ENV = 'MIOFRAME_E2E_OWNER_INVENTORY_RESULT_FILE';
const TEMP_DIR = 'temp';

/** Raw collector-process result, as returned by {@link spawnSync}. */
export interface RunOwnerInventoryCollectorResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Test-only dependencies for {@link collectE2EOwnerInventory}. */
export interface CollectE2EOwnerInventoryDeps {
  runCollector?: (resultFile: string) => RunOwnerInventoryCollectorResult;
  readResultFile?: (resultFile: string) => string;
  removeResultFile?: (resultFile: string) => void;
}

function isRawE2ESpecInventoryEntry(value: unknown): value is RawE2ESpecInventoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('specPath' in value) || typeof value.specPath !== 'string') {
    return false;
  }

  return 'annotations' in value && Array.isArray(value.annotations);
}

function isRawE2ESpecInventoryEntryArray(value: unknown): value is RawE2ESpecInventoryEntry[] {
  return Array.isArray(value) && value.every(isRawE2ESpecInventoryEntry);
}

function uniqueResultFilePath(): string {
  return path.join(
    TEMP_DIR,
    `e2e-owner-inventory-result-${process.pid}-${crypto.randomBytes(6).toString('hex')}.json`,
  );
}

/**
 * Executable and arguments used to launch the async Node child collector.
 * Exported so tests can prove the adapter launches the narrow Node collector
 * script rather than a Playwright binary, without spawning a real process.
 */
export const COLLECTOR_INVOCATION = { command: 'node', args: [COLLECTOR_SCRIPT] } as const;

function defaultRunCollector(resultFile: string): RunOwnerInventoryCollectorResult {
  const result = spawnSync(COLLECTOR_INVOCATION.command, [...COLLECTOR_INVOCATION.args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, [RESULT_FILE_ENV]: resultFile },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function defaultReadResultFile(resultFile: string): string {
  return fs.readFileSync(resultFile, 'utf8');
}

function defaultRemoveResultFile(resultFile: string): void {
  fs.rmSync(resultFile, { force: true });
}

/**
 * Collect and merge the ordinary and productionArtifact target E2E
 * ownership inventory, filtered to `.e2e.spec.ts` files, via the narrow
 * containerized Node child collector.
 * @param [deps] Test-only dependencies.
 * @returns Merged inventory entries.
 */
export function collectE2EOwnerInventory({
  runCollector = defaultRunCollector,
  readResultFile = defaultReadResultFile,
  removeResultFile = defaultRemoveResultFile,
}: CollectE2EOwnerInventoryDeps = {}): RawE2ESpecInventoryEntry[] {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const resultFile = uniqueResultFilePath();

  try {
    const { status, stdout, stderr } = runCollector(resultFile);

    if (status !== 0) {
      throw new Error(
        `E2E owner inventory container collection failed (exit ${status ?? 'null'}): ${
          stderr.trim() || stdout.trim() || 'no output'
        }`,
      );
    }

    let raw: string;

    try {
      raw = readResultFile(resultFile);
    } catch (error) {
      throw new Error(
        `E2E owner inventory result file ${resultFile} was not produced: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    let entries: unknown;

    try {
      entries = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `E2E owner inventory result file ${resultFile} could not be parsed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    if (!isRawE2ESpecInventoryEntryArray(entries)) {
      throw new Error(
        `E2E owner inventory result file ${resultFile} did not contain a valid inventory array.`,
      );
    }

    return entries.filter((entry) => entry.specPath.endsWith(TARGET_SUFFIX));
  } finally {
    removeResultFile(resultFile);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(collectE2EOwnerInventory()));
}
