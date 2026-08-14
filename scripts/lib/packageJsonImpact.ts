import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

/** Minimal shape of a `git show <ref>:<path>` runner, matching `node:child_process#spawnSync`. */
export type GitShowRunner = (
  command: string,
  args: readonly string[],
  options: { encoding: 'utf8'; stdio: ['ignore', 'pipe', 'pipe'] },
) => { status: number | null; stdout: string | null };

/** Minimal file-read shape used for reading the current `package.json`. */
export type ReadPackageJsonFile = (path: string, encoding: 'utf8') => string;

function isIndexable(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function defaultGitShowRunner(
  command: string,
  args: readonly string[],
  options: { encoding: 'utf8'; stdio: ['ignore', 'pipe', 'pipe'] },
): { status: number | null; stdout: string | null } {
  return spawnSync(command, args, options);
}

/**
 * Determine whether two `package.json` contents differ only in the
 * top-level "version" field.
 * @param oldContent Raw package.json content before the change.
 * @param newContent Raw package.json content after the change.
 * @returns `true` when every field except "version" is unchanged; `false`
 * when another field differs, or when either content cannot be parsed as a
 * JSON object.
 */
export function isPackageJsonVersionOnlyChange(oldContent: string, newContent: string): boolean {
  const oldJson = parseJsonObject(oldContent);
  const newJson = parseJsonObject(newContent);

  if (oldJson === null || newJson === null) {
    return false;
  }

  const { version: _oldVersion, ...oldRest } = oldJson;
  const { version: _newVersion, ...newRest } = newJson;

  return deepEqual(oldRest, newRest);
}

/** Comparison inputs for a `package.json` runtime-relevance check. */
export interface PackageJsonRelevanceOptions {
  /**
   * Git ref to read the prior `package.json` content from, or `null` when no
   * reliable base ref is known for the current verify scope.
   */
  oldRef?: string | null;
  /** Path to `package.json`, relative to the repository root. */
  packageJsonPath?: string;
  /** Injectable `spawnSync`, for tests. */
  spawn?: GitShowRunner;
  /** Injectable file reader, for tests. */
  readFile?: ReadPackageJsonFile;
}

/**
 * Determine whether a `package.json` change is runtime-relevant, i.e. it
 * changes anything other than the top-level `version` field. The change is
 * treated as runtime-relevant unless it can be positively confirmed as a
 * version-only change; any failure to resolve a comparison fails closed
 * (runtime-relevant), so unknown `package.json` impact never skips
 * downstream checks.
 * @param [options] Comparison inputs.
 * @returns `true` when downstream checks should still treat this change as
 * relevant.
 */
export function isPackageJsonRuntimeRelevantChange({
  oldRef = null,
  packageJsonPath = 'package.json',
  spawn = defaultGitShowRunner,
  readFile = readFileSync,
}: PackageJsonRelevanceOptions = {}): boolean {
  if (typeof oldRef !== 'string' || oldRef.length === 0) {
    return true;
  }

  const oldContent = readGitFileAtRef(oldRef, packageJsonPath, spawn);

  if (oldContent === null) {
    return true;
  }

  let newContent: string;

  try {
    newContent = readFile(packageJsonPath, 'utf8');
  } catch {
    return true;
  }

  return !isPackageJsonVersionOnlyChange(oldContent, newContent);
}

/**
 * Determine whether a `package.json` change is visual-relevant. Wraps
 * {@link isPackageJsonRuntimeRelevantChange}: the same version-only
 * confirmation logic determines whether visual checks can be skipped.
 * @param [options] Comparison inputs; see
 * {@link isPackageJsonRuntimeRelevantChange} for details.
 * @returns `true` when visual checks should still run for this change.
 */
export function isVisualRelevantPackageJsonChange(
  options: PackageJsonRelevanceOptions = {},
): boolean {
  return isPackageJsonRuntimeRelevantChange(options);
}

function readGitFileAtRef(ref: string, filePath: string, spawn: GitShowRunner): string | null {
  const result = spawn('git', ['show', `${ref}:${filePath}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }

  return result.stdout;
}

function parseJsonObject(content: unknown): Record<string, unknown> | null {
  if (typeof content !== 'string') {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    return isIndexable(parsed) && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (!isIndexable(left) || !isIndexable(right)) {
    return false;
  }

  if (Array.isArray(left) !== Array.isArray(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
}
