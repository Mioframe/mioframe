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

  it('works with partial deps when only the local runner is injected', async () => {
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    const result = await runGuardedLocalCommand(
      {
        command: 'pnpm exec vue-tsc --build',
        executable: 'pnpm',
        args: ['exec', 'vue-tsc', '--build'],
        label: 'type-check',
      },
      {
        processEnv: {
          ...process.env,
          GITHUB_ACTIONS: 'false',
          MIOFRAME_VERIFY_LOCK_HELD: '1',
        },
        runLocalCommand,
      },
    );

    expect(result).toEqual({ signal: null, status: 0 });
    expect(runLocalCommand).toHaveBeenCalledWith({
      args: ['exec', 'vue-tsc', '--build'],
      command: 'pnpm',
      env: process.env,
    });
  });

  it('uses the default verify-lock status dependency when partial deps omit guard internals', async () => {
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    await expect(
      runGuardedLocalCommand(
        {
          command: 'pnpm exec vue-tsc --build',
          executable: 'pnpm',
          args: ['exec', 'vue-tsc', '--build'],
          label: 'type-check',
        },
        {
          runLocalCommand,
        },
      ),
    ).resolves.toEqual({ signal: null, status: 0 });

    expect(runLocalCommand).toHaveBeenCalledOnce();
  });

  it('still honors an injected verify-lock assertion override', async () => {
    const assertVerifyLockOverride = vi.fn();
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    await runGuardedLocalCommand(
      {
        command: 'pnpm exec vue-tsc --build',
        executable: 'pnpm',
        args: ['exec', 'vue-tsc', '--build'],
        label: 'type-check',
      },
      {
        assertNoActiveVerifyLock: assertVerifyLockOverride,
        runLocalCommand,
      },
    );

    expect(assertVerifyLockOverride).toHaveBeenCalledOnce();
    expect(runLocalCommand).toHaveBeenCalledOnce();
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

  it('works with partial deps when only the local runner is injected', async () => {
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    const result = await runGuardedExpensiveLocalCommand(
      {
        command: 'pnpm exec vitest run',
        executable: 'pnpm',
        args: ['exec', 'vitest', 'run'],
        label: 'test:run',
      },
      {
        processEnv: {
          ...process.env,
          GITHUB_ACTIONS: 'false',
          MIOFRAME_VERIFY_LOCK_HELD: '1',
        },
        runLocalCommand,
      },
    );

    expect(result).toEqual({ signal: null, status: 0 });
    expect(runLocalCommand).toHaveBeenCalledWith({
      args: ['exec', 'vitest', 'run'],
      command: 'pnpm',
      env: {
        ...process.env,
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1',
        MIOFRAME_VERIFY_LOCK_HELD: '1',
      },
    });
  });

  it('uses the default expensive lock when partial deps omit withExpensiveCommandLock', async () => {
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    await expect(
      runGuardedExpensiveLocalCommand(
        {
          command: 'pnpm exec vitest run',
          executable: 'pnpm',
          args: ['exec', 'vitest', 'run'],
          label: 'test:run',
        },
        {
          processEnv: {
            ...process.env,
            GITHUB_ACTIONS: 'false',
            MIOFRAME_VERIFY_LOCK_HELD: '1',
          },
          runLocalCommand,
        },
      ),
    ).resolves.toEqual({ signal: null, status: 0 });

    expect(runLocalCommand).toHaveBeenCalledOnce();
  });

  it('still honors an injected expensive-lock override', async () => {
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));
    const withExpensiveCommandLock = vi.fn(async (_input, run) =>
      run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' }),
    );

    await runGuardedExpensiveLocalCommand(
      {
        command: 'pnpm exec vitest run',
        executable: 'pnpm',
        args: ['exec', 'vitest', 'run'],
        label: 'test:run',
      },
      {
        processEnv: {
          ...process.env,
          GITHUB_ACTIONS: 'false',
          MIOFRAME_VERIFY_LOCK_HELD: '1',
        },
        runLocalCommand,
        withExpensiveCommandLock,
      },
    );

    expect(withExpensiveCommandLock).toHaveBeenCalledOnce();
    expect(runLocalCommand).toHaveBeenCalledOnce();
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
