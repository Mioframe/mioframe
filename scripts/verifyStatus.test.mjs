import { describe, expect, it } from 'vitest';

import { formatVerifyStatusReport } from './verifyStatus.mjs';

describe('formatVerifyStatusReport', () => {
  it('reports when no active local verification exists', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/verify.lock',
      state: 'missing',
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('No active local verification.');
  });

  it('reports an active local verification with metadata', () => {
    const report = formatVerifyStatusReport({
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
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('Active local verification:');
    expect(report.output).toContain('command: pnpm verify');
    expect(report.output).toContain('logPath: .verify/logs');
    expect(report.output).toContain('Do not start another verify.');
  });

  it('reports stale and corrupt locks with recovery guidance', () => {
    const staleReport = formatVerifyStatusReport({
      lockPath: '.verify/locks/verify.lock',
      metadata: {
        heartbeatAt: '2026-06-04T12:00:00.000Z',
      },
      state: 'stale',
    });
    const corruptReport = formatVerifyStatusReport({
      lockPath: '.verify/locks/verify.lock',
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(staleReport.exitCode).toBe(1);
    expect(staleReport.output).toContain('Stale local verification lock detected.');
    expect(staleReport.output).toContain('Inspect `.verify/logs` before removing the stale lock.');
    expect(corruptReport.exitCode).toBe(1);
    expect(corruptReport.output).toContain('Corrupt local verification lock detected.');
    expect(corruptReport.output).toContain('statusReason: metadata missing');
  });
});
