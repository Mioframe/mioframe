import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Run a command synchronously and return its exit status.
 * @param {string} root Repository root.
 * @param {string} command Executable name.
 * @param {string[]} args Command arguments.
 * @param {'inherit' | 'pipe'} stdio Child stdio mode.
 * @returns {number} Process exit status.
 */
function run(root, command, args, stdio = 'inherit') {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

/**
 * Read stdout from a successful Git command.
 * @param {string} root Repository root.
 * @param {string[]} args Git arguments.
 * @returns {string} Command stdout.
 */
function readGit(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }

  return result.stdout;
}

/**
 * Describe one untracked path without modifying the Git index.
 * @param {string} root Repository root.
 * @param {string} relPath Repository-relative path.
 * @returns {string} Stable path description.
 */
function describeUntrackedPath(root, relPath) {
  const absPath = path.join(root, relPath);
  const stat = fs.lstatSync(absPath);

  if (stat.isSymbolicLink()) {
    return `link:${fs.readlinkSync(absPath)}`;
  }

  if (stat.isFile()) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
    return `file:${stat.mode}:${stat.size}:${digest}`;
  }

  return `other:${stat.mode}`;
}

/**
 * Create a stable snapshot of tracked and untracked working-tree changes.
 * The snapshot intentionally ignores the index state and never stages files.
 * @param {string} root Repository root.
 * @returns {string} SHA-256 snapshot digest.
 */
export function snapshotWorkingTree(root) {
  const trackedDiff = readGit(root, ['diff', '--binary', '--no-ext-diff', 'HEAD', '--']);
  const untrackedPaths = readGit(root, ['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const untracked = untrackedPaths
    .map((relPath) => `${relPath}\0${describeUntrackedPath(root, relPath)}`)
    .join('\0');

  return crypto
    .createHash('sha256')
    .update(trackedDiff)
    .update('\0--untracked--\0')
    .update(untracked)
    .digest('hex');
}

/**
 * Run the complete autofix pipeline twice and require the second pass to be a
 * fixed point. A stable non-zero fixer status is preserved so the workflow may
 * still commit mechanical changes before reporting unresolved failures.
 * @param {string} root Repository root.
 * @param {() => number} runFixers Complete autofix runner.
 * @returns {{ firstStatus: number, secondStatus: number, stable: boolean }} Result.
 */
export function runAutofixIdempotencyCheck(root, runFixers) {
  const firstStatus = runFixers();
  const firstSnapshot = snapshotWorkingTree(root);
  const secondStatus = runFixers();
  const secondSnapshot = snapshotWorkingTree(root);

  return {
    firstStatus,
    secondStatus,
    stable: firstSnapshot === secondSnapshot,
  };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = runAutofixIdempotencyCheck(root, () =>
    run(root, process.execPath, ['scripts/verify.mjs', '--fix-only']),
  );

  if (!result.stable) {
    console.error(
      '[ci:autofix] the second complete fixer pass changed the working tree; refusing to push a non-idempotent autofix result.',
    );
    console.error(
      '[ci:autofix] fix conflicting generators/formatters so one pass reaches a stable fixed point.',
    );
    run(root, 'git', ['status', '--short'], 'inherit');
    process.exit(1);
  }

  process.exit(result.secondStatus !== 0 ? result.secondStatus : result.firstStatus);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
