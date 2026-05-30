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
 * @returns Callback result after the lock has been released.
 */
export async function withExpensiveCommandLock(input, run) {
  if (shouldSkipLock()) {
    return run({
      [LOCK_ENV_FLAG]: '1',
    });
  }

  const ownerToken = crypto.randomUUID();
  const lockDirectoryPath = path.resolve(expensiveLockConfig.directory);
  const metadataPath = path.join(lockDirectoryPath, LOCK_METADATA_FILE);
  const heartbeatIntervalMs = expensiveLockConfig.heartbeatIntervalMs;
  const staleAfterMs = expensiveLockConfig.staleAfterMs;
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

  await acquireLock({
    lockDirectoryPath,
    metadataPath,
    metadata: baseMetadata,
    staleAfterMs,
  });

  let released = false;
  const releaseLock = () => releaseOwnedLock(lockDirectoryPath, metadataPath, ownerToken);
  const heartbeatTimer = setInterval(() => {
    writeMetadata(metadataPath, {
      ...baseMetadata,
      heartbeatAt: new Date().toISOString(),
    });
  }, heartbeatIntervalMs);

  const cleanup = async () => {
    if (released) {
      return;
    }

    released = true;
    clearInterval(heartbeatTimer);
    await releaseLock();
  };

  const onSignal = (signal) => {
    void cleanup().finally(() => {
      process.removeListener(signal, onSignal);
      process.kill(process.pid, signal);
    });
  };

  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  try {
    return await run({
      [LOCK_ENV_FLAG]: '1',
    });
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    await cleanup();
  }
}

function shouldSkipLock() {
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    return true;
  }

  return process.env[LOCK_ENV_FLAG] === '1';
}

async function acquireLock({ lockDirectoryPath, metadataPath, metadata, staleAfterMs }) {
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
    const removed = await releaseOwnedLock(
      lockDirectoryPath,
      metadataPath,
      existingMetadata.ownerToken,
    );

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
 * Removes the lock directory only when the caller still owns the lock.
 *
 * Always re-reads the current on-disk metadata to prevent a stale-lock
 * recovery from deleting a lock acquired by another process after the
 * stale metadata was read.
 * @param lockDirectoryPath Lock directory to remove.
 * @param metadataPath Path to the lock metadata file.
 * @param ownerToken Expected owner token from the process that acquired the lock.
 * @returns `true` when the lock was owned and removed, `false` otherwise.
 */
export async function releaseOwnedLock(lockDirectoryPath, metadataPath, ownerToken) {
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

function writeMetadata(metadataPath, metadata) {
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
