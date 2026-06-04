import { pathToFileURL } from 'node:url';

import { getVerifyLockStatus } from './lib/commandLock.mjs';

/**
 * Format the current verify lock status for CLI output.
 * @param status Structured verify lock status.
 * @returns Rendered output and process exit code.
 */
export function formatVerifyStatusReport(status) {
  if (status.state === 'missing') {
    return {
      exitCode: 0,
      output: ['No active local verification.', `lockPath: ${status.lockPath}`].join('\n'),
    };
  }

  if (status.state === 'active') {
    return {
      exitCode: 0,
      output: [
        'Active local verification:',
        `command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
        `pid: ${status.metadata?.pid ?? 'unknown'}`,
        `hostname: ${status.metadata?.hostname ?? 'unknown'}`,
        `cwd: ${status.metadata?.cwd ?? 'unknown'}`,
        `startedAt: ${status.metadata?.startedAt ?? 'unknown'}`,
        `heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
        `lockPath: ${status.lockPath}`,
        `logPath: ${status.metadata?.logPath ?? '.verify/logs'}`,
        'Do not start another verify.',
        'Inspect `.verify/logs` or rerun `pnpm verify:status` for the latest heartbeat.',
      ].join('\n'),
    };
  }

  const title =
    status.state === 'stale'
      ? 'Stale local verification lock detected.'
      : 'Corrupt local verification lock detected.';

  return {
    exitCode: 1,
    output: [
      title,
      `lockPath: ${status.lockPath}`,
      `statusReason: ${status.statusReason ?? 'unknown'}`,
      `heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
      'Inspect `.verify/logs` before removing the stale lock.',
      'If no verify process is still active, remove the lock directory and rerun `pnpm verify`.',
    ].join('\n'),
  };
}

/**
 * Print the current verify lock status for local agents.
 * @returns Exit code for the status command.
 */
export function printVerifyStatus() {
  const report = formatVerifyStatusReport(getVerifyLockStatus());
  console.log(report.output);
  process.exitCode = report.exitCode;
  return report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printVerifyStatus();
}
