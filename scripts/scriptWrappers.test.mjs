import { describe, expect, it, vi } from 'vitest';

import { runLintEslint } from './lintEslint.mjs';
import { runMutation } from './mutate.mjs';

describe('runLintEslint', () => {
  it('applies the child result only after expensive-lock cleanup', async () => {
    const events = [];
    const applyProcessResult = vi.fn(() => {
      events.push('apply-result');
    });

    await runLintEslint({
      applyProcessResult,
      classifyCommandWeight: vi.fn(() => 'expensive'),
      resolveEslintConcurrency: vi.fn(() => '4'),
      runLocalCommand: vi.fn(async ({ env }) => {
        expect(env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
        return { signal: 'SIGTERM', status: null };
      }),
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
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: 'SIGTERM', status: null });
  });

  it('keeps the non-locked path applying the returned result', async () => {
    const applyProcessResult = vi.fn();
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    await runLintEslint({
      applyProcessResult,
      classifyCommandWeight: vi.fn(() => 'light'),
      resolveEslintConcurrency: vi.fn(() => '2'),
      runLocalCommand,
      withExpensiveCommandLock: vi.fn(),
    });

    expect(runLocalCommand).toHaveBeenCalledOnce();
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: null, status: 0 });
  });
});

describe('runMutation', () => {
  it('applies the child result only after expensive-lock cleanup', async () => {
    const events = [];
    const applyProcessResult = vi.fn(() => {
      events.push('apply-result');
    });

    await runMutation(['--mutate', 'src/foo.ts'], {
      applyProcessResult,
      runLocalCommand: vi.fn(async ({ args, env }) => {
        expect(args).toEqual(['exec', 'stryker', 'run', '--mutate', 'src/foo.ts']);
        expect(env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
        return { signal: null, status: 3 };
      }),
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
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: null, status: 3 });
  });
});
