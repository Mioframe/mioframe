import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveVerifyInvocation } from './lib/verifyInvocation.mjs';
import { buildCommands, runVerifyCli } from './verify.mjs';

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe('full verification registry validation', () => {
  const validSkipPlan = { mode: 'skip', specs: [], reasons: ['not relevant'] };

  it('keeps an invalid app E2E registry blocking in full mode', () => {
    const commands = buildCommands([], {
      fullMode: true,
      appE2EPlan: { mode: 'invalid', specs: [], reasons: ['broken app registry'] },
      storybookBehaviorPlan: validSkipPlan,
    });
    const e2e = commands.find((entry) => entry.label === 'e2e');

    expect(e2e).toMatchObject({
      kind: 'failed',
      reason: expect.stringContaining('broken app registry'),
    });
  });

  it('keeps an invalid Storybook behavior registry blocking in full mode', () => {
    const commands = buildCommands([], {
      fullMode: true,
      appE2EPlan: validSkipPlan,
      storybookBehaviorPlan: {
        mode: 'invalid',
        specs: [],
        reasons: ['broken Storybook registry'],
      },
    });
    const behavior = commands.find((entry) => entry.label === 'storybook-behavior');

    expect(behavior).toMatchObject({
      kind: 'failed',
      reason: expect.stringContaining('broken Storybook registry'),
    });
  });

  it('runs full browser lanes when both registries are valid', () => {
    const commands = buildCommands([], {
      fullMode: true,
      appE2EPlan: validSkipPlan,
      storybookBehaviorPlan: validSkipPlan,
    });

    expect(commands.find((entry) => entry.label === 'e2e')?.kind).toBe('run');
    expect(commands.find((entry) => entry.label === 'storybook-behavior')?.kind).toBe('run');
  });
});

describe('runVerifyCli invocation ownership', () => {
  it('passes one invocation to lock metadata and actual execution', async () => {
    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/develop', '--profile', 'github-actions', '--only', 'type-check'],
      { GITHUB_ACTIONS: 'false' },
    );
    const runMain = vi.fn();
    let lockMetadata = null;

    await runVerifyCli({
      invocation,
      runMain,
      withVerifyLock: vi.fn(async (metadata, run) => {
        lockMetadata = metadata;
        await run({}, { updateMetadata: vi.fn() });
      }),
    });

    expect(lockMetadata.verifyInvocation).toEqual(invocation);
    expect(runMain).toHaveBeenCalledWith({}, expect.any(Object), invocation);
  });
});
