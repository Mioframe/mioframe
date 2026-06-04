import { describe, expect, it } from 'vitest';

import { formatVerifyStatusReport } from './verifyStatus.mjs';

describe('formatVerifyStatusReport', () => {
  it('reports when no active local verification exists', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'missing',
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('machine: no active local verification');
    expect(report.output).toContain('.verify/locks/machine.lock');
  });

  it('reports an active verify with kind and metadata', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'active',
      metadata: {
        kind: 'verify',
        command: 'pnpm verify',
        cwd: '/repo',
        heartbeatAt: '2026-06-04T12:05:00.000Z',
        hostname: 'host-a',
        logPath: '.verify/logs',
        pid: 1234,
        startedAt: '2026-06-04T12:00:00.000Z',
      },
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('machine: ACTIVE (pnpm verify)');
    expect(report.output).toContain('kind: verify');
    expect(report.output).toContain('command: pnpm verify');
    expect(report.output).toContain('logPath: .verify/logs');
    expect(report.output).toContain('Do not start another heavy local verification command');
  });

  it('reports an active expensive command with kind and metadata', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'active',
      metadata: {
        kind: 'expensive',
        command: 'pnpm test:visual',
        cwd: '/repo',
        heartbeatAt: '2026-06-04T12:05:00.000Z',
        hostname: 'host-a',
        logPath: '.verify/logs',
        pid: 5678,
        startedAt: '2026-06-04T12:00:00.000Z',
      },
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('machine: ACTIVE (expensive command)');
    expect(report.output).toContain('kind: expensive');
    expect(report.output).toContain('command: pnpm test:visual');
    expect(report.output).toContain('Do not start another heavy local verification command');
  });

  it('reports stale machine lock with recovery guidance and exits with code 1', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      metadata: { heartbeatAt: '2026-06-04T12:00:00.000Z' },
      state: 'stale',
      statusReason: null,
    });

    expect(report.exitCode).toBe(1);
    expect(report.output).toContain('machine: stale lock detected');
    expect(report.output).toContain('Inspect `.verify/logs` before removing the stale lock.');
  });

  it('reports corrupt machine lock with statusReason and exits with code 1', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(report.exitCode).toBe(1);
    expect(report.output).toContain('machine: corrupt lock detected');
    expect(report.output).toContain('statusReason: metadata missing');
  });
});
