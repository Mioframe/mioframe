import { pathToFileURL } from 'node:url';

import { getMachineLockStatus, type LockStatus } from './lib/commandLock.ts';

/**
 * Format the verification status block for CLI output.
 * @param status Structured verification status.
 * @returns Formatted status lines as a string.
 */
function formatMachineLockBlock(status: LockStatus): string {
  if (status.state === 'missing') {
    return 'verification: idle';
  }

  if (status.state === 'active') {
    const kindLabel =
      status.metadata.kind === 'verify' ? 'pnpm verify' : 'expensive verification command';
    const lines = [
      `verification: busy (${kindLabel})`,
      `  command: ${status.metadata.activeCommand ?? status.metadata.command}`,
      `  startedAt: ${status.metadata.startedAt}`,
      `  logPath: ${status.metadata.logPath ?? '.verify/logs'}`,
      '  Wait for it to finish. Do not start another heavy verification command.',
    ];

    return lines.join('\n');
  }

  if (status.state === 'stale') {
    return [
      'verification: ready to resume',
      '  Inspect `.verify/logs`, then run `pnpm verify:resume` and retry.',
    ].join('\n');
  }

  return [
    'verification: needs user decision',
    '  Inspect `.verify/logs` and ask the user before proceeding.',
  ].join('\n');
}

/** Rendered `verify:status` report. */
export interface VerifyStatusReport {
  exitCode: number;
  output: string;
}

/**
 * Format the machine lock status for CLI output.
 * @param machineStatus Structured machine lock status.
 * @returns Rendered output and process exit code.
 */
export function formatVerifyStatusReport(machineStatus: LockStatus): VerifyStatusReport {
  const output = formatMachineLockBlock(machineStatus);

  const hasStaleOrCorrupt = machineStatus.state === 'stale' || machineStatus.state === 'corrupt';

  const exitCode = hasStaleOrCorrupt ? 1 : 0;

  return { exitCode, output };
}

/**
 * Print the current verification status for local agents.
 * @returns Exit code for the status command.
 */
export function printVerifyStatus(): number {
  const report = formatVerifyStatusReport(getMachineLockStatus());
  console.log(report.output);
  process.exitCode = report.exitCode;
  return report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printVerifyStatus();
}
