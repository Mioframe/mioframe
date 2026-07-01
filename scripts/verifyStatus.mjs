import { pathToFileURL } from 'node:url';

import { getMachineLockStatus } from './lib/commandLock.mjs';

/**
 * Format the verification status block for CLI output.
 * @param status Structured verification status.
 * @returns Formatted status lines as a string.
 */
function formatMachineLockBlock(status) {
  if (status.state === 'missing') {
    return 'verification: idle';
  }

  if (status.state === 'active') {
    const kind = status.metadata?.kind ?? 'unknown';
    const kindLabel =
      kind === 'verify'
        ? 'pnpm verify'
        : kind === 'expensive'
          ? 'expensive verification command'
          : 'verification command';
    const lines = [
      `verification: busy (${kindLabel})`,
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      `  startedAt: ${status.metadata?.startedAt ?? 'unknown'}`,
      `  logPath: ${status.metadata?.logPath ?? '.verify/logs'}`,
      '  Wait for it to finish. Do not start another heavy verification command.',
    ];

    return lines.join('\n');
  }

  if (status.state === 'stale') {
    return [
      'verification: recovery available',
      `  statusReason: ${status.statusReason ?? 'previous verification did not finish cleanly'}`,
      '  Inspect `.verify/logs`.',
      '  If no verification command is still running, run `pnpm verify:resume` and retry.',
    ].join('\n');
  }

  return [
    'verification: recovery needs user decision',
    `  statusReason: ${status.statusReason ?? 'unknown'}`,
    '  Inspect `.verify/logs` and ask the user before manual recovery.',
  ].join('\n');
}

/**
 * Format the machine lock status for CLI output.
 * @param machineStatus Structured machine lock status.
 * @returns Rendered output and process exit code.
 */
export function formatVerifyStatusReport(machineStatus) {
  const output = formatMachineLockBlock(machineStatus);

  const hasStaleOrCorrupt = machineStatus.state === 'stale' || machineStatus.state === 'corrupt';

  const exitCode = hasStaleOrCorrupt ? 1 : 0;

  return { exitCode, output };
}

/**
 * Print the current verification status for local agents.
 * @returns Exit code for the status command.
 */
export function printVerifyStatus() {
  const report = formatVerifyStatusReport(getMachineLockStatus());
  console.log(report.output);
  process.exitCode = report.exitCode;
  return report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printVerifyStatus();
}
