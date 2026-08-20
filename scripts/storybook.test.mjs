import { beforeEach, describe, expect, it, vi } from 'vitest';

import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { runStorybook } from './storybook.mjs';

const staticDir = toolingConfig.storybook.staticDir;

describe('runStorybook build with STORYBOOK_STATIC_SKIP_BUILD', () => {
  beforeEach(() => {
    process.exitCode = 0;
  });

  it('reuses an existing Storybook static build instead of recompiling', async () => {
    const deps = {
      applyProcessResult: vi.fn(),
      fileExists: vi.fn(() => true),
      runGuardedExpensiveLocalCommand: vi.fn(),
      runLocalCommand: vi.fn(),
      spawnStorybook: vi.fn(),
    };

    await runStorybook('build', deps, { STORYBOOK_STATIC_SKIP_BUILD: '1' });

    expect(deps.runGuardedExpensiveLocalCommand).not.toHaveBeenCalled();
    expect(deps.spawnStorybook).not.toHaveBeenCalled();
    expect(deps.fileExists).toHaveBeenCalledWith(`${staticDir}/index.html`);
    expect(deps.fileExists).toHaveBeenCalledWith(`${staticDir}/iframe.html`);
    expect(process.exitCode).not.toBe(1);
  });

  it('fails clearly when asked to reuse a build that does not exist', async () => {
    const deps = {
      applyProcessResult: vi.fn(),
      fileExists: vi.fn(() => false),
      runGuardedExpensiveLocalCommand: vi.fn(),
      runLocalCommand: vi.fn(),
      spawnStorybook: vi.fn(),
    };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runStorybook('build', deps, { STORYBOOK_STATIC_SKIP_BUILD: '1' });

    expect(deps.runGuardedExpensiveLocalCommand).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('STORYBOOK_STATIC_SKIP_BUILD=1'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('fails closed when only one required output file exists', async () => {
    const deps = {
      applyProcessResult: vi.fn(),
      fileExists: vi.fn((filePath) => filePath.endsWith('index.html')),
      runGuardedExpensiveLocalCommand: vi.fn(),
      runLocalCommand: vi.fn(),
      spawnStorybook: vi.fn(),
    };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runStorybook('build', deps, { STORYBOOK_STATIC_SKIP_BUILD: '1' });

    expect(deps.runGuardedExpensiveLocalCommand).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    consoleErrorSpy.mockRestore();
  });

  it('builds normally when the skip flag is not set', async () => {
    const deps = {
      applyProcessResult: vi.fn(),
      fileExists: vi.fn(() => true),
      runGuardedExpensiveLocalCommand: vi.fn(async () => ({ status: 0, signal: null })),
      runLocalCommand: vi.fn(),
      spawnStorybook: vi.fn(),
    };

    await runStorybook('build', deps, {});

    expect(deps.runGuardedExpensiveLocalCommand).toHaveBeenCalledTimes(1);
    expect(deps.applyProcessResult).toHaveBeenCalledWith({ status: 0, signal: null });
  });
});
