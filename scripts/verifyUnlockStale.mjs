import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { getMachineLockStatus, releaseOwnedLock } from './lib/commandLock.mjs';

/**
 * Remove the local machine verification lock only when it is already stale.
 * Active and merely corrupt locks are never removed by this command.
 * @param status Structured machine lock status.
 * @returns Process exit code for the unlock attempt.
 */
export function unlockStaleMachineLock(status = getMachineLockStatus()) {
  if (status.state === 'missing') {
    console.log(`machine: no active local verification\n  lockPath: ${status.lockPath}`);
    return 0;
  }

  if (status.state === 'active') {
    console.error([
      'machine: active local verification lock was not removed',
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      `  pid: ${status.metadata?.pid ?? 'unknown'}`,
      `  heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
      `  lockPath: ${status.lockPath}`,
      '  Run `pnpm verify:status` and wait for the active command to finish.',
    ].join('\n'));
    return 1;
  }

  if (status.state === 'corrupt') {
    console.error([
      'machine: corrupt local verification lock was not removed automatically',
      `  lockPath: ${status.lockPath}`,
      `  statusReason: ${status.statusReason ?? 'unknown'}`,
      '  Inspect `.verify/logs` and ask the user before manual recovery.',
    ].join('\n'));
    return 1;
  }

  if (status.metadata !== null && status.metadata !== undefined) {
    const removed = releaseOwnedLock(status.lockPath, status.metadataPath, status.metadata.ownerToken);

    if (removed) {
      console.log(`machine: stale local verification lock removed\n  lockPath: ${status.lockPath}`);
      return 0;
    }

    console.error([
      'machine: stale local verification lock changed before removal',
      `  lockPath: ${status.lockPath}`,
      '  Run `pnpm verify:status` again before retrying.',
    ].join('\n'));
    return 1;
  }

  try {
    fs.rmSync(status.lockPath, { recursive: true, force: false });
    console.log(`machine: stale local verification lock removed\n  lockPath: ${status.lockPath}`);
    return 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log(`machine: no active local verification\n  lockPath: ${status.lockPath}`);
      return 0;
    }

    console.error([
      'machine: stale local verification lock could not be removed',
      `  lockPath: ${status.lockPath}`,
      `  error: ${error?.message ?? error}`,
    ].join('\n'));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = unlockStaleMachineLock();
}
