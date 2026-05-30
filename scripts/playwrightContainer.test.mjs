import { describe, expect, it, vi } from 'vitest';

import { applyContainerProcessResult, runPlaywrightInContainer } from './playwrightContainer.mjs';

const baseOptions = {
  config: 'playwright.config.ts',
  missingBinaryMessage: 'missing binary',
  missingMetadataMessage: 'missing metadata',
  missingPodmanMessage: 'missing podman',
  podmanFailureMessage: 'podman failed',
};

describe('applyContainerProcessResult', () => {
  it('sets process.exitCode for status exits', () => {
    const processObject = {
      exitCode: undefined,
      kill: vi.fn(),
      pid: 123,
    };

    applyContainerProcessResult({ signal: null, status: 5 }, processObject);

    expect(processObject.exitCode).toBe(5);
    expect(processObject.kill).not.toHaveBeenCalled();
  });

  it('re-sends terminating signals after cleanup', () => {
    const processObject = {
      exitCode: undefined,
      kill: vi.fn(),
      pid: 456,
    };

    applyContainerProcessResult({ signal: 'SIGTERM', status: null }, processObject);

    expect(processObject.kill).toHaveBeenCalledWith(456, 'SIGTERM');
    expect(processObject.exitCode).toBeUndefined();
  });
});

describe('runPlaywrightInContainer', () => {
  it('applies the final process result only after the lock callback returns', async () => {
    const events = [];

    await runPlaywrightInContainer(baseOptions, {
      applyContainerProcessResult: vi.fn(() => {
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
});
