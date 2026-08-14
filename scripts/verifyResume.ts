import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { getMachineLockStatus, releaseOwnedLock, type LockStatus } from './lib/commandLock.ts';
import {
  formatVerifyInvocationCommand,
  isResolvedVerifyInvocation,
} from './lib/verifyInvocation.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * Build the retry instruction for a released verification state.
 * Accepts loosely metadata-shaped input (or `null`): real lock metadata is
 * `LockMetadata`, but persisted state may also be legacy/malformed, so only
 * the `verifyInvocation` field is trusted, and only after independent
 * validation.
 * @param metadata Verification lock metadata, when available.
 * @returns Instruction that preserves a validated structured invocation or
 * explicitly reports that the scope must be reconstructed.
 */
export function getRetryInstruction(metadata: unknown): string {
  const verifyInvocation = isRecord(metadata) ? metadata.verifyInvocation : undefined;

  if (isResolvedVerifyInvocation(verifyInvocation)) {
    return `  Run \`${formatVerifyInvocationCommand(verifyInvocation)}\` again.`;
  }

  return '  Re-run the original task-scope verify command; do not default to plain `pnpm verify`.';
}

/**
 * Resume local verification when the previous run is known to be no longer active.
 * Active and inconsistent verification states are never changed by this command.
 * @param status Structured verification status.
 * @returns Process exit code for the resume attempt.
 */
export function resumeVerification(status: LockStatus = getMachineLockStatus()): number {
  if (status.state === 'missing') {
    console.log('verification: idle');
    return 0;
  }

  if (status.state === 'active') {
    console.error(
      [
        'verification: busy',
        `  command: ${status.metadata.activeCommand ?? status.metadata.command}`,
        '  Wait for the current verification command to finish, then retry.',
      ].join('\n'),
    );
    return 1;
  }

  if (status.state === 'corrupt') {
    console.error(
      [
        'verification: needs user decision',
        '  Inspect `.verify/logs` and ask the user before proceeding.',
      ].join('\n'),
    );
    return 1;
  }

  if (status.metadata !== null) {
    const resumed = releaseOwnedLock(
      status.lockPath,
      status.metadataPath,
      status.metadata.ownerToken,
    );

    if (resumed) {
      console.log(
        ['verification: ready to retry', getRetryInstruction(status.metadata)].join('\n'),
      );
      return 0;
    }

    console.error(
      [
        'verification: state changed before resuming',
        '  Run `pnpm verify:status` again before retrying.',
      ].join('\n'),
    );
    return 1;
  }

  try {
    fs.rmSync(status.lockPath, { recursive: true, force: false });
    console.log(['verification: ready to retry', getRetryInstruction(null)].join('\n'));
    return 0;
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('verification: idle');
      return 0;
    }

    console.error(
      [
        'verification: resume failed',
        `  error: ${error instanceof Error ? error.message : String(error)}`,
      ].join('\n'),
    );
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = resumeVerification();
}
