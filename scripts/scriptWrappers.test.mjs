import { describe, expect, it, vi } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };

import { runBuild } from './build.mjs';
import { runBuildOnly } from './buildOnly.mjs';
import { runE2eHost } from './e2eHost.mjs';
import { runLintEslint } from './lintEslint.mjs';
import { runLintOxlint } from './lintOxlint.mjs';
import { runMutation } from './mutate.mjs';
import { runStorybook } from './storybook.mjs';
import { runTypeCheck } from './typeCheck.mjs';
import { runVitest } from './vitestRun.mjs';

describe('runLintEslint', () => {
  it('applies the child result only after expensive-lock cleanup', async () => {
    const events = [];
    const applyProcessResult = vi.fn(() => {
      events.push('apply-result');
    });

    await runLintEslint({
      applyProcessResult,
      classifyCommandWeight: vi.fn(() => 'expensive'),
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
      runGuardedLocalCommand: vi.fn(),
      resolveEslintConcurrency: vi.fn(() => '4'),
      runLocalCommand: vi.fn(async ({ env }) => {
        expect(env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
        return { signal: 'SIGTERM', status: null };
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
      runGuardedExpensiveLocalCommand: vi.fn(),
      runGuardedLocalCommand: vi.fn(async ({ command, args, env }) =>
        runLocalCommand({ command, args, env }),
      ),
      resolveEslintConcurrency: vi.fn(() => '2'),
      runLocalCommand,
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
      runLocalCommand: vi.fn(async ({ args, env }) => {
        expect(args).toEqual(['exec', 'stryker', 'run', '--mutate', 'src/foo.ts']);
        expect(env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
        return { signal: null, status: 3 };
      }),
    });

    expect(events).toEqual(['lock-acquired', 'callback-returned', 'lock-released', 'apply-result']);
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: null, status: 3 });
  });
});

describe('runTypeCheck', () => {
  it('runs vue-tsc normally when no verify lock is active', async () => {
    const applyProcessResult = vi.fn();
    const runLocalCommand = vi.fn(async () => ({ signal: null, status: 0 }));

    await runTypeCheck({
      applyProcessResult,
      runGuardedLocalCommand: vi.fn(async ({ command, executable, args, env }) =>
        runLocalCommand({ command: executable ?? command, args, env }),
      ),
      runLocalCommand,
    });

    expect(runLocalCommand).toHaveBeenCalledWith({
      args: ['exec', 'vue-tsc', '--build'],
      command: 'pnpm',
      env: expect.any(Object),
    });
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: null, status: 0 });
  });

  it('blocks immediately when a local verify lock is active', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runTypeCheck({
        applyProcessResult: vi.fn(),
        runGuardedLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

describe('runBuildOnly', () => {
  it('blocks immediately when a local verify lock is active', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runBuildOnly({
        applyProcessResult: vi.fn(),
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

describe('runBuild', () => {
  it('does not start vite build when a verify lock blocks the build step', async () => {
    const applyProcessResult = vi.fn();
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce({ signal: null, status: 0 })
      .mockResolvedValueOnce({ signal: null, status: 0 });
    const runGuardedLocalCommand = vi.fn(async ({ command, executable, args, env }) =>
      runLocalCommand({ command: executable ?? command, args, env }),
    );
    const runGuardedExpensiveLocalCommand = vi.fn(async () => {
      throw new Error('Another local pnpm verify is already running.');
    });

    await expect(
      runBuild({
        applyProcessResult,
        runGuardedExpensiveLocalCommand,
        runGuardedLocalCommand,
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runGuardedLocalCommand).toHaveBeenCalledOnce();
    expect(runGuardedExpensiveLocalCommand).toHaveBeenCalledOnce();
    expect(runLocalCommand).toHaveBeenCalledOnce();
    expect(runLocalCommand).toHaveBeenCalledWith({
      args: ['exec', 'vue-tsc', '--build'],
      command: 'pnpm',
      env: expect.any(Object),
    });
    expect(applyProcessResult).not.toHaveBeenCalled();
  });
});

describe('runLintOxlint', () => {
  it('blocks immediately when a local verify lock is active', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runLintOxlint({
        applyProcessResult: vi.fn(),
        runGuardedLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

describe('runE2eHost', () => {
  it('applies the child result only after expensive-lock cleanup', async () => {
    const events = [];
    const applyProcessResult = vi.fn(() => {
      events.push('apply-result');
    });

    await runE2eHost([], {
      applyProcessResult,
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
      runLocalCommand: vi.fn(async ({ args, env }) => {
        expect(args).toEqual(['exec', 'playwright', 'test']);
        expect(env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
        return { signal: null, status: 0 };
      }),
    });

    expect(events).toEqual(['lock-acquired', 'callback-returned', 'lock-released', 'apply-result']);
    expect(applyProcessResult).toHaveBeenCalledWith({ signal: null, status: 0 });
  });

  it('surfaces verify-lock failures before starting host playwright', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runE2eHost(['--headed'], {
        applyProcessResult: vi.fn(),
        runLocalCommand,
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

describe('runStorybook', () => {
  it('guards the build mode before starting Storybook build', async () => {
    const spawnStorybook = vi.fn();

    await expect(
      runStorybook('build', {
        applyProcessResult: vi.fn(),
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        spawnStorybook,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(spawnStorybook).not.toHaveBeenCalled();
  });
});

describe('runVitest', () => {
  it('guards full test runs before starting Vitest', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runVitest([], {
        applyProcessResult: vi.fn(),
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('guards coverage runs before starting Vitest', async () => {
    const runLocalCommand = vi.fn();

    await expect(
      runVitest(['--coverage'], {
        applyProcessResult: vi.fn(),
        runGuardedExpensiveLocalCommand: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
        runLocalCommand,
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

describe('package scripts', () => {
  it('routes the default e2e command through the container wrapper', () => {
    expect(packageJson.scripts.e2e).toBe('node scripts/e2eContainer.mjs');
  });

  it('routes direct heavy commands through guarded wrappers', () => {
    expect(packageJson.scripts.build).toBe('node scripts/build.mjs');
    expect(packageJson.scripts['build-only']).toBe('node scripts/buildOnly.mjs');
    expect(packageJson.scripts['storybook:build']).toBe('node scripts/storybook.mjs build');
    expect(packageJson.scripts['type-check']).toBe('node scripts/typeCheck.mjs');
    expect(packageJson.scripts['lint:oxlint']).toBe('node scripts/lintOxlint.mjs');
    expect(packageJson.scripts['test:run']).toBe('node scripts/vitestRun.mjs');
    expect(packageJson.scripts['test:coverage']).toBe('node scripts/vitestRun.mjs --coverage');
    expect(packageJson.scripts['test:mutate']).toBe('node scripts/mutate.mjs');
    expect(packageJson.scripts['e2e:host']).toBe('node scripts/e2eHost.mjs');
    expect(packageJson.scripts['e2e:headed']).toBe('node scripts/e2eHost.mjs --headed');
    expect(packageJson.scripts['e2e:ui']).toBe('node scripts/e2eHost.mjs --ui');
  });
});
