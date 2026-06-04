import { pathToFileURL } from 'node:url';

import { getExpensiveLockStatus, getVerifyLockStatus } from './lib/commandLock.mjs';

/**
 * Format a single lock status block for CLI output.
 * @param kind Lock kind label used in headings.
 * @param status Structured lock status.
 * @returns Formatted status lines as a string.
 */
function formatLockBlock(kind, status) {
  const isVerify = kind === 'verify';
  const label = isVerify ? 'verify' : 'expensive-command';

  if (status.state === 'missing') {
    return `${label}: no active lock\n  lockPath: ${status.lockPath}`;
  }

  if (status.state === 'active') {
    const lines = [
      `${label}: ACTIVE`,
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      `  pid: ${status.metadata?.pid ?? 'unknown'}`,
      `  hostname: ${status.metadata?.hostname ?? 'unknown'}`,
      `  cwd: ${status.metadata?.cwd ?? 'unknown'}`,
      `  startedAt: ${status.metadata?.startedAt ?? 'unknown'}`,
      `  heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
      `  lockPath: ${status.lockPath}`,
      `  logPath: ${status.metadata?.logPath ?? '.verify/logs'}`,
    ];

    if (isVerify) {
      lines.push('  Do not start another verify.');
    } else {
      lines.push('  Do not start another expensive verification command.');
    }

    return lines.join('\n');
  }

  const title =
    status.state === 'stale' ? `${label}: stale lock detected` : `${label}: corrupt lock detected`;

  return [
    title,
    `  lockPath: ${status.lockPath}`,
    `  statusReason: ${status.statusReason ?? 'unknown'}`,
    `  heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
    '  Inspect `.verify/logs` before removing the stale lock.',
    '  If no process is still active, remove the lock directory and retry.',
  ].join('\n');
}

/**
 * Format both verify and expensive-command lock statuses for CLI output.
 * @param verifyStatus Structured verify lock status.
 * @param expensiveStatus Structured expensive-command lock status.
 * @returns Rendered output and process exit code.
 */
export function formatVerifyStatusReport(verifyStatus, expensiveStatus) {
  const verifyBlock = formatLockBlock('verify', verifyStatus);
  const expensiveBlock = formatLockBlock('expensive', expensiveStatus);
  const output = [verifyBlock, '', expensiveBlock].join('\n');

  const hasStaleOrCorrupt =
    verifyStatus.state === 'stale' ||
    verifyStatus.state === 'corrupt' ||
    expensiveStatus.state === 'stale' ||
    expensiveStatus.state === 'corrupt';

  const exitCode = hasStaleOrCorrupt ? 1 : 0;

  return { exitCode, output };
}

/**
 * Print the current verify and expensive-command lock status for local agents.
 * @returns Exit code for the status command.
 */
export function printVerifyStatus() {
  const report = formatVerifyStatusReport(getVerifyLockStatus(), getExpensiveLockStatus());
  console.log(report.output);
  process.exitCode = report.exitCode;
  return report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printVerifyStatus();
}
