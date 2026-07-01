import { describe, expect, it } from 'vitest';

import { formatVerifyStatusReport } from './verifyStatus.mjs';

describe('formatVerifyStatusReport', () => {
  it('reports when no active verification exists without exposing internals', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'missing',
    });

    expect(report.exitCode).toBe(0);
    expect(report.output).toBe('verification: idle');
    expect(report.output).not.toContain('.verify/locks');
  });

  it('reports an active verify through public command status only', () => {
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
    expect(report.output).toContain('verification: busy (pnpm verify)');
    expect(report.output).toContain('command: pnpm verify');
    expect(report.output).toContain('logPath: .verify/logs');
    expect(report.output).toContain('Do not start another heavy verification command');
    expect(report.output).not.toContain('kind:');
    expect(report.output).not.toContain('pid:');
    expect(report.output).not.toContain('hostname:');
    expect(report.output).not.toContain('cwd:');
    expect(report.output).not.toContain('heartbeat');
    expect(report.output).not.toContain('.verify/locks');
  });

  it('reports an active expensive command through public command status only', () => {
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
    expect(report.output).toContain('verification: busy (expensive verification command)');
    expect(report.output).toContain('command: pnpm test:visual');
    expect(report.output).toContain('Do not start another heavy verification command');
    expect(report.output).not.toContain('kind:');
    expect(report.output).not.toContain('pid:');
    expect(report.output).not.toContain('heartbeat');
    expect(report.output).not.toContain('.verify/locks');
  });

  it('reports stale verification state with command-only recovery guidance', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      metadata: { heartbeatAt: '2026-06-04T12:00:00.000Z' },
      state: 'stale',
      statusReason: null,
    });

    expect(report.exitCode).toBe(1);
    expect(report.output).toContain('verification: stale run marker detected');
    expect(report.output).toContain('pnpm verify:unlock-stale');
    expect(report.output).not.toContain('rm ');
    expect(report.output).not.toContain('rmdir');
    expect(report.output).not.toContain('heartbeat');
    expect(report.output).not.toContain('.verify/locks');
  });

  it('reports inconsistent verification status without automatic recovery instructions', () => {
    const report = formatVerifyStatusReport({
      lockPath: '.verify/locks/machine.lock',
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(report.exitCode).toBe(1);
    expect(report.output).toContain('verification: status is inconsistent');
    expect(report.output).toContain('statusReason: metadata missing');
    expect(report.output).toContain('ask the user before manual recovery');
    expect(report.output).not.toContain('rm ');
    expect(report.output).not.toContain('rmdir');
    expect(report.output).not.toContain('.verify/locks');
  });
});
