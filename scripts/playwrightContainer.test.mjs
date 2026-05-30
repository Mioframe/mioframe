import { describe, expect, it, vi } from 'vitest';

import { runPlaywrightInContainer } from './playwrightContainer.mjs';
import { applyProcessResult } from './lib/processResult.mjs';

const baseOptions = {
  config: 'playwright.config.ts',
  missingBinaryMessage: 'missing binary',
  missingMetadataMessage: 'missing metadata',
  missingPodmanMessage: 'missing podman',
  podmanFailureMessage: 'podman failed',
};

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
  it('applies the final process result only after the lock callback returns', async () => {
    const events = [];

    await runPlaywrightInContainer(baseOptions, {
      applyProcessResult: vi.fn(() => {
        events.push('apply-result');
      }),
      ensureLocalPlaywrightBinary: vi.fn(),
      ensurePodmanAvailable: vi.fn(),
      getInstalledPlaywrightVersion: vi.fn(() => '1.59.1'),
      spawnSync: vi.fn(() => ({
        error: undefined,
        signal: null,
        status: 0,
      })),
      withExpensiveCommandLock: vi.fn(async (_input, run) => {
        events.push('lock-acquired');

        try {
          const result = await run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' });
          events.push('callback-returned');
          return result;
        } finally {
          events.push('lock-released');
        }
      }),
    });

    expect(events).toEqual(['lock-acquired', 'callback-returned', 'lock-released', 'apply-result']);
  });

  it('prints a project-level diagnostic for non-zero podman exits', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
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
          spawnSync: vi.fn(() => ({
            error: undefined,
            signal: null,
            status: 125,
          })),
          withExpensiveCommandLock: vi.fn(async (_input, run) =>
            run({ MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' }),
          ),
        },
      );

      const output = errorSpy.mock.calls.map(([line]) => String(line)).join('\n');
      expect(output).toContain('Playwright container command failed.');
      expect(output).toContain('label: visual');
      expect(output).toContain('operation: Playwright tests in a Podman container');
      expect(output).toContain('exit status: 125');
      expect(output).toContain('config: playwright.visual.config.ts');
      expect(output).toContain('  cpus: 2  override: PLAYWRIGHT_CONTAINER_CPUS');
      expect(output).toContain('  memory: 6g  override: PLAYWRIGHT_CONTAINER_MEMORY');
      expect(output).toContain('  memory-swap: 8g  override: PLAYWRIGHT_CONTAINER_MEMORY_SWAP');
      expect(output).toContain('  pids-limit: 512  override: PLAYWRIGHT_CONTAINER_PIDS_LIMIT');
      expect(output).toContain('  timeout: 900  override: PLAYWRIGHT_CONTAINER_TIMEOUT');
      expect(output).toContain('  workers: 2  override: PLAYWRIGHT_CONTAINER_WORKERS');
      expect(output).toContain(
        'If Podman reports an unsupported resource option, rerun with the matching override or adjust config/tooling.json.',
      );
      expect(output).toContain('Raw Podman output is printed above.');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
