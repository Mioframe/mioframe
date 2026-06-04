import process from 'node:process';
import { describe, expect, it, vi } from 'vitest';

import {
  resolvePlaywrightContainerProfile,
  runPlaywrightInContainer,
} from './playwrightContainer.mjs';
import { runGuardedExpensiveLocalCommand } from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';

const baseOptions = {
  config: 'playwright.config.ts',
  missingBinaryMessage: 'missing binary',
  missingMetadataMessage: 'missing metadata',
  missingPodmanMessage: 'missing podman',
  podmanFailureMessage: 'podman failed',
};

async function withProcessEnv(overrides, run) {
  const previousEntries = Object.fromEntries(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  );

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previousEntries)) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe('applyProcessResult', () => {
  it('sets process.exitCode for status exits', () => {
    const processObject = {
      exitCode: undefined,
      kill: vi.fn(),
      pid: 123,
    };

    applyProcessResult({ signal: null, status: 5 }, processObject);

    expect(processObject.exitCode).toBe(5);
    expect(processObject.kill).not.toHaveBeenCalled();
  });

  it('re-sends terminating signals after cleanup', () => {
    const processObject = {
      exitCode: undefined,
      kill: vi.fn(),
      pid: 456,
    };

    applyProcessResult({ signal: 'SIGTERM', status: null }, processObject);

    expect(processObject.kill).toHaveBeenCalledWith(456, 'SIGTERM');
    expect(processObject.exitCode).toBeUndefined();
  });
});

describe('runPlaywrightInContainer', () => {
  it('resolves conservative local resource limits outside GitHub Actions', () => {
    const profile = resolvePlaywrightContainerProfile({
      GITHUB_ACTIONS: 'false',
    });

    expect(profile.name).toBe('local');
    expect(profile.cpus).toBe('2');
    expect(profile.memory).toBe('4g');
    expect(profile.memorySwap).toBe('4g');
    expect(profile.pidsLimit).toBe('384');
    expect(profile.workers).toBe('1');
  });

  it('resolves the GitHub Actions profile when GITHUB_ACTIONS=true', () => {
    const profile = resolvePlaywrightContainerProfile({
      GITHUB_ACTIONS: 'true',
    });

    expect(profile.name).toBe('github-actions');
    expect(profile.memory).toBe('6g');
    expect(profile.memorySwap).toBe('8g');
    expect(profile.pidsLimit).toBe('512');
    expect(profile.workers).toBe('2');
  });

  it('applies the final process result only after the lock callback returns', async () => {
    const events = [];

    await withProcessEnv({ GITHUB_ACTIONS: 'false' }, async () => {
      await runPlaywrightInContainer(baseOptions, {
        applyProcessResult: vi.fn(() => {
          events.push('apply-result');
        }),
        ensureLocalPlaywrightBinary: vi.fn(),
        ensurePodmanAvailable: vi.fn(),
        getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
        runGuardedExpensiveLocalCommand: vi.fn(async ({ run }) => {
          events.push('lock-acquired');

          try {
            const result = await run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' });
            events.push('callback-returned');
            return result;
          } finally {
            events.push('lock-released');
          }
        }),
        runLocalCommand: vi.fn(async () => {
          events.push('command-finished');
          return {
            signal: null,
            status: 0,
          };
        }),
        spawnSync: vi.fn(),
      });
    });

    expect(events).toEqual([
      'lock-acquired',
      'command-finished',
      'callback-returned',
      'lock-released',
      'apply-result',
    ]);
  });

  it('checks the active verify lock before Podman and Playwright setup', async () => {
    const ensureLocalPlaywrightBinary = vi.fn();
    const ensurePodmanAvailable = vi.fn();

    await expect(
      runPlaywrightInContainer(baseOptions, {
        applyProcessResult: vi.fn(),
        ensureLocalPlaywrightBinary,
        ensurePodmanAvailable,
        getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand: vi.fn(),
        spawnSync: vi.fn(),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(ensurePodmanAvailable).not.toHaveBeenCalled();
    expect(ensureLocalPlaywrightBinary).not.toHaveBeenCalled();
  });

  it('blocks through the real guard before Podman and Playwright setup when verify is active', async () => {
    const assertNoActiveVerifyLock = vi.fn(() => {
      throw new Error('Another local pnpm verify is already running.');
    });
    const ensureLocalPlaywrightBinary = vi.fn();
    const ensurePodmanAvailable = vi.fn();

    await expect(
      runPlaywrightInContainer(baseOptions, {
        applyProcessResult: vi.fn(),
        assertNoActiveVerifyLock,
        ensureLocalPlaywrightBinary,
        ensurePodmanAvailable,
        getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
        runGuardedExpensiveLocalCommand,
        runLocalCommand: vi.fn(),
        spawnSync: vi.fn(),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(assertNoActiveVerifyLock).toHaveBeenCalledOnce();
    expect(ensurePodmanAvailable).not.toHaveBeenCalled();
    expect(ensureLocalPlaywrightBinary).not.toHaveBeenCalled();
  });

  it('runs the long podman command through the async runner instead of spawnSync', async () => {
    const runLocalCommand = vi.fn(async () => ({
      signal: null,
      status: 0,
    }));
    const spawnSync = vi.fn();

    await withProcessEnv({ GITHUB_ACTIONS: 'false' }, async () => {
      await runPlaywrightInContainer(baseOptions, {
        applyProcessResult: vi.fn(),
        ensureLocalPlaywrightBinary: vi.fn(),
        ensurePodmanAvailable: vi.fn(),
        getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
        runGuardedExpensiveLocalCommand: vi.fn(async ({ run }) =>
          run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' }),
        ),
        runLocalCommand,
        spawnSync,
      });
    });

    expect(runLocalCommand).toHaveBeenCalledWith({
      args: expect.arrayContaining([
        'run',
        '--rm',
        '--init',
        '--cpus',
        '2',
        '--memory',
        '4g',
        '--memory-swap',
        '4g',
        '--pids-limit',
        '384',
      ]),
      command: 'podman',
      env: process.env,
    });
    expect(runLocalCommand.mock.calls[0][0].args).toContain('--workers');
    expect(runLocalCommand.mock.calls[0][0].args).toContain('1');
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it('prints a project-level diagnostic for non-zero podman exits', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await withProcessEnv({ GITHUB_ACTIONS: 'false' }, async () => {
        await runPlaywrightInContainer(
          {
            ...baseOptions,
            config: 'playwright.visual.config.ts',
            label: 'visual',
          },
          {
            applyProcessResult: vi.fn(),
            ensureLocalPlaywrightBinary: vi.fn(),
            ensurePodmanAvailable: vi.fn(),
            getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
            runGuardedExpensiveLocalCommand: vi.fn(async ({ run }) =>
              run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' }),
            ),
            runLocalCommand: vi.fn(async () => ({
              signal: null,
              status: 125,
            })),
            spawnSync: vi.fn(),
          },
        );
      });

      const output = errorSpy.mock.calls.map(([line]) => String(line)).join('\n');
      expect(output).toContain('Playwright container command failed.');
      expect(output).toContain('label: visual');
      expect(output).toContain('operation: Playwright tests in a Podman container');
      expect(output).toContain('exit status: 125');
      expect(output).toContain('config: playwright.visual.config.ts');
      expect(output).toContain('  cpus: 2  override: PLAYWRIGHT_CONTAINER_CPUS');
      expect(output).toContain('profile: local');
      expect(output).toContain('  memory: 4g  override: PLAYWRIGHT_CONTAINER_MEMORY');
      expect(output).toContain('  memory-swap: 4g  override: PLAYWRIGHT_CONTAINER_MEMORY_SWAP');
      expect(output).toContain('  pids-limit: 384  override: PLAYWRIGHT_CONTAINER_PIDS_LIMIT');
      expect(output).toContain('  timeout: 900  override: PLAYWRIGHT_CONTAINER_TIMEOUT');
      expect(output).toContain('  workers: 1  override: PLAYWRIGHT_CONTAINER_WORKERS');
      expect(output).toContain(
        'If Podman reports an unsupported resource option, rerun with the matching override or adjust config/tooling.json.',
      );
      expect(output).toContain('Raw Podman output is printed above.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('returns a failed status when the async podman runner cannot start', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await withProcessEnv({ GITHUB_ACTIONS: 'false' }, async () => {
        await runPlaywrightInContainer(baseOptions, {
          applyProcessResult: vi.fn(),
          ensureLocalPlaywrightBinary: vi.fn(),
          ensurePodmanAvailable: vi.fn(),
          getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
          runGuardedExpensiveLocalCommand: vi.fn(async ({ run }) =>
            run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' }),
          ),
          runLocalCommand: vi.fn(async () => {
            throw new Error('spawn failed');
          }),
          spawnSync: vi.fn(),
        });
      });

      const output = errorSpy.mock.calls.map(([line]) => String(line)).join('\n');
      expect(output).toContain('Failed to start Podman for Playwright container tests.');
      expect(output).toContain('spawn failed');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
