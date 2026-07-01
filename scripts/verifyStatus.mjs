import { pathToFileURL } from 'node:url';

import { getMachineLockStatus } from './lib/commandLock.mjs';

/**
 * Format the machine lock status block for CLI output.
 * @param status Structured machine lock status.
 * @returns Formatted status lines as a string.
 */
function formatMachineLockBlock(status) {
  if (status.state === 'missing') {
    return `machine: no active local verification\n  lockPath: ${status.lockPath}`;
  }

  if (status.state === 'active') {
    const kind = status.metadata?.kind ?? 'unknown';
    const kindLabel =
      kind === 'verify'
        ? 'pnpm verify'
        : kind === 'expensive'
          ? 'expensive command'
          : 'unknown command';
    const lines = [
      `machine: ACTIVE (${kindLabel})`,
      `  kind: ${kind}`,
      `  command: ${status.metadata?.activeCommand ?? status.metadata?.command ?? 'unknown'}`,
      `  pid: ${status.metadata?.pid ?? 'unknown'}`,
      `  hostname: ${status.metadata?.hostname ?? 'unknown'}`,
      `  cwd: ${status.metadata?.cwd ?? 'unknown'}`,
      `  startedAt: ${status.metadata?.startedAt ?? 'unknown'}`,
      `  heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
      `  lockPath: ${status.lockPath}`,
      `  logPath: ${status.metadata?.logPath ?? '.verify/logs'}`,
      '  Do not start another heavy local verification command while this is active.',
    ];

    return lines.join('\n');
  }

  const title =
    status.state === 'stale' ? 'machine: stale lock detected' : 'machine: corrupt lock detected';
  const recoveryHint =
    status.state === 'stale'
      ? '  Run `pnpm verify:unlock-stale` only after inspecting `.verify/logs`.'
      : '  Do not remove this lock automatically. Inspect `.verify/logs` and ask the user before manual recovery.';

  return [
    title,
    `  lockPath: ${status.lockPath}`,
    `  statusReason: ${status.statusReason ?? 'unknown'}`,
    `  heartbeatAt: ${status.metadata?.heartbeatAt ?? 'unknown'}`,
    recoveryHint,
    '  Do not use raw `rm`, `rmdir`, or `rm -rf` against `.verify/locks`.',
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
 * Print the current machine lock status for local agents.
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
