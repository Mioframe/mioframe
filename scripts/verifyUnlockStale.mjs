import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { getMachineLockStatus, releaseOwnedLock } from './lib/commandLock.mjs';

/**
 * Remove the local machine verification marker only when it is already stale.
 * Active and merely inconsistent verification states are never removed by this command.
 * @param status Structured machine lock status.
 * @returns Process exit code for the unlock attempt.
 */
export function unlockStaleMachineLock(status = getMachineLockStatus()) {
  if (status.state === 'missing') {
    console.log('verification: idle');
    return 0;
  }

  if (status.state === 'active') {
    console.error([
      'verification: active command was not interrupted',
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      '  Run `pnpm verify:status` and wait for the active command to finish.',
    ].join('\n'));
    return 1;
  }

  if (status.state === 'corrupt') {
    console.error([
      'verification: status is inconsistent and was not changed automatically',
      `  statusReason: ${status.statusReason ?? 'unknown'}`,
      '  Inspect `.verify/logs` and ask the user before manual recovery.',
    ].join('\n'));
    return 1;
  }

  if (status.metadata !== null && status.metadata !== undefined) {
    const removed = releaseOwnedLock(status.lockPath, status.metadataPath, status.metadata.ownerToken);

    if (removed) {
      console.log('verification: stale run marker removed');
      return 0;
    }

    console.error([
      'verification: stale run marker changed before recovery',
      '  Run `pnpm verify:status` again before retrying.',
    ].join('\n'));
    return 1;
  }

  try {
    fs.rmSync(status.lockPath, { recursive: true, force: false });
    console.log('verification: stale run marker removed');
    return 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('verification: idle');
      return 0;
    }

    console.error([
      'verification: stale run marker could not be removed',
      `  error: ${error?.message ?? error}`,
    ].join('\n'));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = unlockStaleMachineLock();
}
