import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

/**
 * Determine whether two `package.json` contents differ only in the
 * top-level "version" field.
 * @param oldContent Raw package.json content before the change.
 * @param newContent Raw package.json content after the change.
 * @returns `true` when every field except "version" is unchanged; `false`
 * when another field differs, or when either content cannot be parsed as a
 * JSON object.
 */
export function isPackageJsonVersionOnlyChange(oldContent, newContent) {
  const oldJson = parseJsonObject(oldContent);
  const newJson = parseJsonObject(newContent);

  if (oldJson === null || newJson === null) {
    return false;
  }

  const { version: _oldVersion, ...oldRest } = oldJson;
  const { version: _newVersion, ...newRest } = newJson;

  return deepEqual(oldRest, newRest);
}

/**
 * Determine whether a `package.json` change is visual-relevant. The change
 * is treated as visual-relevant unless it can be positively confirmed as a
 * version-only change; any failure to resolve a comparison fails closed
 * (visual-relevant), so unknown `package.json` impact never skips visual
 * checks.
 * @param [options] Comparison inputs.
 * @param [options.oldRef] Git ref to read the prior `package.json` content
 * from, or `null` when no reliable base ref is known for the current verify
 * scope.
 * @param [options.packageJsonPath] Path to `package.json`, relative to the
 * repository root.
 * @param [options.spawn] Injectable `spawnSync`, for tests.
 * @param [options.readFile] Injectable file reader, for tests.
 * @returns `true` when visual checks should still run for this change.
 */
export function isVisualRelevantPackageJsonChange({
  oldRef = null,
  packageJsonPath = 'package.json',
  spawn = spawnSync,
  readFile = readFileSync,
} = {}) {
  if (typeof oldRef !== 'string' || oldRef.length === 0) {
    return true;
  }

  const oldContent = readGitFileAtRef(oldRef, packageJsonPath, spawn);

  if (oldContent === null) {
    return true;
  }

  let newContent;

  try {
    newContent = readFile(packageJsonPath, 'utf8');
  } catch {
    return true;
  }

  return !isPackageJsonVersionOnlyChange(oldContent, newContent);
}

function readGitFileAtRef(ref, filePath, spawn) {
  const result = spawn('git', ['show', `${ref}:${filePath}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }

  return result.stdout;
}

function parseJsonObject(content) {
  if (typeof content !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function deepEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
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
