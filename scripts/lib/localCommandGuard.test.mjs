import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertNoActiveVerifyLock,
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
} from './localCommandGuard.mjs';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('assertNoActiveVerifyLock', () => {
  it('does not bypass the guard when only CI=true is set locally', () => {
    const getVerifyLockStatus = vi.fn(() => ({
      lockPath: '/tmp/verify.lock',
      metadata: {
        command: 'pnpm verify',
        cwd: '/repo',
        heartbeatAt: '2026-06-04T10:00:00.000Z',
        hostname: 'local',
        logPath: '.verify/logs/verify.log',
        pid: 123,
        startedAt: '2026-06-04T09:59:00.000Z',
      },
      state: 'active',
    }));

    expect(() =>
      assertNoActiveVerifyLock(
        {
          processEnv: {
            ...process.env,
            CI: 'true',
            GITHUB_ACTIONS: 'false',
            MIOFRAME_VERIFY_LOCK_HELD: undefined,
          },
        },
        {
          getVerifyLockStatus,
        },
      ),
    ).toThrow('Another local pnpm verify is already running.');
    expect(getVerifyLockStatus).toHaveBeenCalledOnce();
  });

  it('skips the guard in GitHub Actions', () => {
    const getVerifyLockStatus = vi.fn();

    expect(() =>
      assertNoActiveVerifyLock(
        {
          processEnv: {
            ...process.env,
            GITHUB_ACTIONS: 'true',
            MIOFRAME_VERIFY_LOCK_HELD: undefined,
          },
        },
        {
          getVerifyLockStatus,
        },
      ),
    ).not.toThrow();
    expect(getVerifyLockStatus).not.toHaveBeenCalled();
  });
});

describe('runGuardedLocalCommand', () => {
  it('blocks before starting a guarded local command when verify is active', async () => {
    const run = vi.fn();

    await expect(
      runGuardedLocalCommand(
        {
          command: 'pnpm exec vue-tsc --build',
          label: 'type-check',
          run,
        },
        {
          assertNoActiveVerifyLock: vi.fn(() => {
            throw new Error('Another local pnpm verify is already running.');
          }),
        },
      ),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(run).not.toHaveBeenCalled();
  });
});

describe('runGuardedExpensiveLocalCommand', () => {
  it('blocks before expensive-lock setup when verify is active', async () => {
    const run = vi.fn();
    const withExpensiveCommandLock = vi.fn();

    await expect(
      runGuardedExpensiveLocalCommand(
        {
          command: 'pnpm exec vitest run',
          label: 'test:run',
          run,
        },
        {
          assertNoActiveVerifyLock: vi.fn(() => {
            throw new Error('Another local pnpm verify is already running.');
          }),
          withExpensiveCommandLock,
        },
      ),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(withExpensiveCommandLock).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('lets verify-child commands proceed without deadlock', async () => {
    const withExpensiveCommandLock = vi.fn(async (_input, run) =>
      run({ MIOFRAME_VERIFY_LOCK_HELD: '1' }),
    );
    const run = vi.fn(async (lockEnv) => ({
      signal: null,
      status: lockEnv.MIOFRAME_VERIFY_LOCK_HELD === '1' ? 0 : 1,
    }));

    const result = await runGuardedExpensiveLocalCommand(
      {
        command: 'pnpm exec vitest run',
        label: 'test:run',
        run,
      },
      {
        processEnv: {
          ...process.env,
          GITHUB_ACTIONS: 'false',
          MIOFRAME_VERIFY_LOCK_HELD: '1',
        },
        withExpensiveCommandLock,
      },
    );

    expect(result).toEqual({ signal: null, status: 0 });
    expect(withExpensiveCommandLock).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith({ MIOFRAME_VERIFY_LOCK_HELD: '1' }, undefined);
  });
});
