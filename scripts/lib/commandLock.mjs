import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const expensiveLockConfig = toolingConfig.verification.expensiveLock;
const LOCK_METADATA_FILE = 'metadata.json';
const LOCK_ENV_FLAG = 'MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD';

/**
 * @param input Lock metadata to persist while the command is running.
 * @param input.label Verification label for the lock owner.
 * @param input.command Display command for lock metadata.
 * @param [input.cwd] Working directory for lock metadata.
 * @param run Callback that runs the guarded command.
 * @param [options] Optional overrides (used in testing).
 * @param [options.lockDirectoryPath] Override the lock directory path.
 * @param [options.staleAfterMs] Override the stale threshold in ms.
 * @param [options.heartbeatIntervalMs] Override the heartbeat interval in ms.
 * @param [options.forceLock] When true, bypass the shouldSkipLock check.
 * @returns Callback result after the lock has been released.
 */
export async function withExpensiveCommandLock(input, run, options = {}) {
  const {
    lockDirectoryPath: customLockDir,
    staleAfterMs: customStaleAfterMs,
    heartbeatIntervalMs: customHeartbeatMs,
    forceLock = false,
  } = options ?? {};

  if (!forceLock && shouldSkipLock()) {
    return run({
      [LOCK_ENV_FLAG]: '1',
    });
  }

  const ownerToken = crypto.randomUUID();
  const lockDirectoryPath = path.resolve(customLockDir ?? expensiveLockConfig.directory);
  const metadataPath = path.join(lockDirectoryPath, LOCK_METADATA_FILE);
  const heartbeatIntervalMs = customHeartbeatMs ?? expensiveLockConfig.heartbeatIntervalMs;
  const staleAfterMs = customStaleAfterMs ?? expensiveLockConfig.staleAfterMs;
  const baseMetadata = {
    label: input.label,
    command: input.command,
    pid: process.pid,
    hostname: os.hostname(),
    cwd: input.cwd ?? process.cwd(),
    startedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
    ownerToken,
  };

  acquireLock({
    lockDirectoryPath,
    metadataPath,
    metadata: baseMetadata,
    staleAfterMs,
  });

  let released = false;
  const releaseLock = () => releaseOwnedLock(lockDirectoryPath, metadataPath, ownerToken);
  const heartbeatTimer = setInterval(() => {
    try {
      writeMetadata(metadataPath, {
        ...baseMetadata,
        heartbeatAt: new Date().toISOString(),
      });
    } catch (heartbeatError) {
      console.error(
        `[expensive-lock] heartbeat write failed for \`${input.label}\` at ${metadataPath}: ` +
          `${heartbeatError?.message ?? heartbeatError}`,
      );
    }
  }, heartbeatIntervalMs);

  const cleanup = () => {
    if (released) {
      return;
    }

    released = true;
    clearInterval(heartbeatTimer);
    releaseLock();
  };

  try {
    return await run({
      [LOCK_ENV_FLAG]: '1',
    });
  } finally {
    cleanup();
  }
}

function shouldSkipLock() {
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    return true;
  }

  return process.env[LOCK_ENV_FLAG] === '1';
}

function acquireLock({ lockDirectoryPath, metadataPath, metadata, staleAfterMs }) {
  fs.mkdirSync(path.dirname(lockDirectoryPath), { recursive: true });

  try {
    fs.mkdirSync(lockDirectoryPath, { recursive: false });
    writeMetadata(metadataPath, metadata);
    return;
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  const existingMetadata = readMetadata(metadataPath);

  if (existingMetadata !== null && isStaleLock(existingMetadata, staleAfterMs)) {
    const removed = releaseOwnedLock(
      lockDirectoryPath,
      metadataPath,
      existingMetadata.ownerToken,
    );

    if (removed) {
      return acquireLock({ lockDirectoryPath, metadataPath, metadata, staleAfterMs });
    }
  }

  if (existingMetadata === null && isStaleLockDirectory(lockDirectoryPath, staleAfterMs)) {
    const removed = releaseStaleLockDirectory(lockDirectoryPath);

    if (removed) {
      return acquireLock({ lockDirectoryPath, metadataPath, metadata, staleAfterMs });
    }
  }

  throw new Error(formatLockBusyMessage(existingMetadata, staleAfterMs));
}

function isStaleLock(metadata, staleAfterMs) {
  const heartbeatMs = Date.parse(metadata.heartbeatAt ?? '');

  if (Number.isNaN(heartbeatMs)) {
    return true;
  }

  const heartbeatAgeMs = Date.now() - heartbeatMs;

  if (heartbeatAgeMs <= staleAfterMs) {
    return false;
  }

  if (metadata.hostname !== os.hostname()) {
    return true;
  }

  return !isProcessAlive(metadata.pid);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/**
 * Check whether a lock directory is stale by inspecting its modification time.
 * This is used as a fallback when `metadata.json` is missing or corrupted and
 * the normal owner-token-based stale check cannot run.
 *
 * A directory's mtime is typically set to the creation time when `mkdirSync`
 * creates it, so the directory age is a reasonable proxy for lock age.
 * @param lockDirectoryPath Lock directory to check.
 * @param staleAfterMs Stale threshold in milliseconds.
 * @returns `true` when the directory mtime is older than `staleAfterMs`.
 */
function isStaleLockDirectory(lockDirectoryPath, staleAfterMs) {
  try {
    const directoryStat = fs.statSync(lockDirectoryPath);

    if (!directoryStat.isDirectory()) {
      return false;
    }

    const directoryAgeMs = Date.now() - directoryStat.mtimeMs;
    return directoryAgeMs > staleAfterMs;
  } catch {
    return false;
  }
}

/**
 * Force-remove a stale lock directory whose metadata is missing or corrupted.
 * This is a last-resort recovery that does not check the owner token because
 * the metadata is not available to verify ownership.
 *
 * Use only when the lock is confirmed stale (e.g. the directory is older than
 * the stale threshold) and the normal owner-token release path cannot apply.
 * @param lockDirectoryPath Lock directory to remove.
 * @returns `true` when the directory was removed, `false` when it was already
 * gone or removal failed.
 */
function releaseStaleLockDirectory(lockDirectoryPath) {
  try {
    fs.rmSync(lockDirectoryPath, { recursive: true, force: false });
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    return false;
  }
}

/**
 * Removes the lock directory only when the owner token on disk still matches.
 *
 * Re-reads the current on-disk metadata and compares the owner token before
 * removal so a stale-lock recovery does not delete a lock that was already
 * re-acquired by a new owner. Note that there is still a TOCTOU window
 * between the metadata read and `fs.rmSync`; this function does not provide
 * atomic cross-process lock release.
 * @param lockDirectoryPath Lock directory to remove.
 * @param metadataPath Path to the lock metadata file.
 * @param ownerToken Expected owner token from the process that acquired the lock.
 * @returns `true` when the lock was owned and removed, `false` otherwise.
 */
export function releaseOwnedLock(lockDirectoryPath, metadataPath, ownerToken) {
  const currentMetadata = readMetadata(metadataPath);

  if (currentMetadata === null || currentMetadata.ownerToken !== ownerToken) {
    return false;
  }

  try {
    fs.rmSync(lockDirectoryPath, { recursive: true, force: false });
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

/**
 * Write lock metadata atomically using a temporary file and rename.
 * Exported for testing.
 * @param metadataPath Target metadata file path.
 * @param metadata Object to serialize as JSON.
 */
export function writeMetadata(metadataPath, metadata) {
  const payload = JSON.stringify(metadata, null, 2);
  const tempPath = `${metadataPath}.tmp`;
  fs.writeFileSync(tempPath, `${payload}\n`, 'utf8');
  fs.renameSync(tempPath, metadataPath);
}

function readMetadata(metadataPath) {
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

function formatLockBusyMessage(metadata, staleAfterMs) {
  const staleAfterSeconds = Math.floor(staleAfterMs / 1000);

  if (metadata === null) {
    return [
      'Another expensive local verification command is already running.',
      `Wait for it to finish, or inspect ${expensiveLockConfig.directory}.`,
    ].join('\n');
  }

  return [
    `Another expensive local verification command is already running: ${metadata.label ?? 'unknown'}.`,
    `command: ${metadata.command ?? 'unknown'}`,
    `pid: ${metadata.pid ?? 'unknown'}`,
    `hostname: ${metadata.hostname ?? 'unknown'}`,
    `cwd: ${metadata.cwd ?? 'unknown'}`,
    `startedAt: ${metadata.startedAt ?? 'unknown'}`,
    `heartbeatAt: ${metadata.heartbeatAt ?? 'unknown'}`,
    `If this lock is stale, wait at least ${staleAfterSeconds}s after the last heartbeat before retrying.`,
  ].join('\n');
}

function isAlreadyExistsError(error) {
  return error !== null && typeof error === 'object' && 'code' in error && error.code === 'EEXIST';
}
