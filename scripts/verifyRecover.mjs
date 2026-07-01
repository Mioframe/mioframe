import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { getMachineLockStatus, releaseOwnedLock } from './lib/commandLock.mjs';

/**
 * Recover local verification when the previous run is known to be no longer active.
 * Active and inconsistent verification states are never changed by this command.
 * @param status Structured verification status.
 * @returns Process exit code for the recovery attempt.
 */
export function recoverVerificationState(status = getMachineLockStatus()) {
  if (status.state === 'missing') {
    console.log('verification: idle');
    return 0;
  }

  if (status.state === 'active') {
    console.error([
      'verification: still running',
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      '  Wait for the current verification command to finish, then retry.',
    ].join('\n'));
    return 1;
  }

  if (status.state === 'corrupt') {
    console.error([
      'verification: recovery needs user decision',
      `  statusReason: ${status.statusReason ?? 'unknown'}`,
      '  Inspect `.verify/logs` and ask the user before manual recovery.',
    ].join('\n'));
    return 1;
  }

  if (status.metadata !== null && status.metadata !== undefined) {
    const recovered = releaseOwnedLock(status.lockPath, status.metadataPath, status.metadata.ownerToken);

    if (recovered) {
      console.log('verification: recovery complete');
      return 0;
    }

    console.error([
      'verification: state changed before recovery',
      '  Run `pnpm verify:status` again before retrying.',
    ].join('\n'));
    return 1;
  }

  try {
    fs.rmSync(status.lockPath, { recursive: true, force: false });
    console.log('verification: recovery complete');
    return 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('verification: idle');
      return 0;
    }

    console.error([
      'verification: recovery failed',
      `  error: ${error?.message ?? error}`,
    ].join('\n'));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = recoverVerificationState();
}
