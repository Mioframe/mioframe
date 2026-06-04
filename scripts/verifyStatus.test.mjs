import { describe, expect, it } from 'vitest';

import { formatVerifyStatusReport } from './verifyStatus.mjs';

const MISSING_EXPENSIVE = { lockPath: '.verify/locks/expensive.lock', state: 'missing' };

describe('formatVerifyStatusReport', () => {
  it('reports when no active local verification or expensive command exists', () => {
    const report = formatVerifyStatusReport(
      { lockPath: '.verify/locks/verify.lock', state: 'missing' },
      MISSING_EXPENSIVE,
    );

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('verify: no active lock');
    expect(report.output).toContain('expensive-command: no active lock');
  });

  it('reports an active local verification with metadata', () => {
    const report = formatVerifyStatusReport(
      {
        lockPath: '.verify/locks/verify.lock',
        state: 'active',
        metadata: {
          command: 'pnpm verify',
          cwd: '/repo',
          heartbeatAt: '2026-06-04T12:05:00.000Z',
          hostname: 'host-a',
          logPath: '.verify/logs',
          pid: 1234,
          startedAt: '2026-06-04T12:00:00.000Z',
        },
      },
      MISSING_EXPENSIVE,
    );

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('verify: ACTIVE');
    expect(report.output).toContain('command: pnpm verify');
    expect(report.output).toContain('logPath: .verify/logs');
    expect(report.output).toContain('Do not start another verify.');
  });

  it('reports an active expensive command with metadata', () => {
    const report = formatVerifyStatusReport(
      { lockPath: '.verify/locks/verify.lock', state: 'missing' },
      {
        lockPath: '.verify/locks/expensive.lock',
        state: 'active',
        metadata: {
          command: 'pnpm test:visual',
          cwd: '/repo',
          heartbeatAt: '2026-06-04T12:05:00.000Z',
          hostname: 'host-a',
          logPath: '.verify/logs',
          pid: 5678,
          startedAt: '2026-06-04T12:00:00.000Z',
        },
      },
    );

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('expensive-command: ACTIVE');
    expect(report.output).toContain('command: pnpm test:visual');
    expect(report.output).toContain('Do not start another expensive verification command.');
  });

  it('reports stale and corrupt locks with recovery guidance', () => {
    const staleReport = formatVerifyStatusReport(
      {
        lockPath: '.verify/locks/verify.lock',
        metadata: { heartbeatAt: '2026-06-04T12:00:00.000Z' },
        state: 'stale',
      },
      MISSING_EXPENSIVE,
    );
    const corruptReport = formatVerifyStatusReport(
      {
        lockPath: '.verify/locks/verify.lock',
        state: 'corrupt',
        statusReason: 'metadata missing',
      },
      MISSING_EXPENSIVE,
    );

    expect(staleReport.exitCode).toBe(1);
    expect(staleReport.output).toContain('verify: stale lock detected');
    expect(staleReport.output).toContain('Inspect `.verify/logs` before removing the stale lock.');
    expect(corruptReport.exitCode).toBe(1);
    expect(corruptReport.output).toContain('verify: corrupt lock detected');
    expect(corruptReport.output).toContain('statusReason: metadata missing');
  });

  it('exits with code 1 when expensive lock is stale', () => {
    const report = formatVerifyStatusReport(
      { lockPath: '.verify/locks/verify.lock', state: 'missing' },
      {
        lockPath: '.verify/locks/expensive.lock',
        state: 'stale',
        statusReason: 'metadata unreadable',
      },
    );

    expect(report.exitCode).toBe(1);
    expect(report.output).toContain('expensive-command: stale lock detected');
  });
});
