import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveVerifyInvocation } from './lib/verifyInvocation.ts';
import { buildCommands, runVerifyCli } from './verify.ts';
import type { StructuralE2EPlan } from './lib/e2eRisk.ts';
import type { StorybookBehaviorPlan } from './lib/storybookBehaviorRisk.ts';
import type { CommandLockHelpers, CommandLockInput } from './lib/commandLock.ts';

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe('full verification registry validation', () => {
  const validAppE2ESkipPlan: StructuralE2EPlan = { mode: 'skip', reasons: ['not relevant'] };
  const validStorybookBehaviorNonePlan: StorybookBehaviorPlan = {
    mode: 'none',
    specs: [],
    reasons: ['not relevant'],
  };

  it('keeps an invalid app E2E registry blocking in full mode', () => {
    const commands = buildCommands([], {
      fullMode: true,
      structuralE2EPlan: { mode: 'invalid', reasons: ['broken app registry'] },
      storybookBehaviorPlan: validStorybookBehaviorNonePlan,
    });
    const e2e = commands.find((entry) => entry.label === 'e2e');

    expect(e2e).toMatchObject({
      kind: 'failed',
      reason: expect.stringContaining('broken app registry'),
    });
  });

  it('runs full browser lanes when both registries are valid', () => {
    const commands = buildCommands([], {
      fullMode: true,
      structuralE2EPlan: validAppE2ESkipPlan,
      storybookBehaviorPlan: validStorybookBehaviorNonePlan,
    });

    expect(commands.find((entry) => entry.label === 'e2e')?.kind).toBe('run');
    expect(commands.find((entry) => entry.label === 'storybook-behavior')?.kind).toBe('run');
  });
});

describe('runVerifyCli invocation ownership', () => {
  it('passes one invocation to lock metadata and actual execution', async () => {
    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/develop', '--profile', 'github-actions', '--only', 'static'],
      { GITHUB_ACTIONS: 'false' },
    );
    const runMain = vi.fn();
    const captured: { metadata?: CommandLockInput } = {};

    await runVerifyCli({
      invocation,
      runMain,
      withVerifyLock: vi.fn(
        async (
          metadata: CommandLockInput,
          run: (lockEnv: Record<string, string>, helpers?: CommandLockHelpers) => Promise<void>,
        ) => {
          captured.metadata = metadata;
          await run({}, { updateMetadata: vi.fn() });
        },
      ),
    });

    if (captured.metadata === undefined) {
      throw new Error('expected the withVerifyLock callback to run');
    }

    expect(captured.metadata.verifyInvocation).toEqual(invocation);
    expect(runMain).toHaveBeenCalledWith({}, expect.any(Object), invocation);
  });
});
