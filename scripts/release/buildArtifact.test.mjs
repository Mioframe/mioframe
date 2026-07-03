import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveArtifactBasePath,
  resolveArtifactDistDir,
  runBuildArtifact,
} from './buildArtifact.mjs';

describe('resolveArtifactBasePath', () => {
  it('uses the tooling.json release base path by default', () => {
    expect(resolveArtifactBasePath([], {})).toBe('/');
  });

  it('prefers an explicit --base flag', () => {
    expect(resolveArtifactBasePath(['--base', '/custom/'], { BASE_URL: '/env/' })).toBe('/custom/');
  });

  it('falls back to the BASE_URL environment variable', () => {
    expect(resolveArtifactBasePath([], { BASE_URL: '/env/' })).toBe('/env/');
  });
});

describe('resolveArtifactDistDir', () => {
  it('defaults to dist', () => {
    expect(resolveArtifactDistDir([])).toBe('dist');
  });

  it('uses an explicit --dist flag', () => {
    expect(resolveArtifactDistDir(['--dist', 'custom-dist'])).toBe('custom-dist');
  });
});

describe('runBuildArtifact with RELEASE_ARTIFACT_SKIP_BUILD', () => {
  let distDir;

  beforeEach(() => {
    process.exitCode = 0;
  });

  afterEach(() => {
    if (distDir) {
      rmSync(distDir, { recursive: true, force: true });
      distDir = undefined;
    }
  });

  it('reuses an existing dist/index.html instead of rebuilding', async () => {
    distDir = mkdtempSync(join(tmpdir(), 'release-artifact-'));
    writeFileSync(join(distDir, 'index.html'), '<html></html>');
    const deps = {
      applyProcessResult: vi.fn(),
      runGuardedExpensiveLocalCommand: vi.fn(),
      runLocalCommand: vi.fn(),
    };

    await runBuildArtifact(['--dist', distDir], deps, { RELEASE_ARTIFACT_SKIP_BUILD: '1' });

    expect(deps.runGuardedExpensiveLocalCommand).not.toHaveBeenCalled();
    expect(existsSync(join(distDir, '404.html'))).toBe(true);
    expect(process.exitCode).not.toBe(1);
  });

  it('fails clearly when asked to reuse a build that does not exist', async () => {
    distDir = mkdtempSync(join(tmpdir(), 'release-artifact-'));
    const deps = {
      applyProcessResult: vi.fn(),
      runGuardedExpensiveLocalCommand: vi.fn(),
      runLocalCommand: vi.fn(),
    };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runBuildArtifact(['--dist', distDir], deps, { RELEASE_ARTIFACT_SKIP_BUILD: '1' });

    expect(deps.runGuardedExpensiveLocalCommand).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no existing production build'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('builds normally when the skip flag is not set', async () => {
    distDir = mkdtempSync(join(tmpdir(), 'release-artifact-'));
    const deps = {
      applyProcessResult: vi.fn(),
      runGuardedExpensiveLocalCommand: vi.fn(async () => {
        writeFileSync(join(distDir, 'index.html'), '<html></html>');
        return { status: 0, signal: null };
      }),
      runLocalCommand: vi.fn(),
    };

    await runBuildArtifact(['--dist', distDir], deps, {});

    expect(deps.runGuardedExpensiveLocalCommand).toHaveBeenCalledTimes(1);
    expect(existsSync(join(distDir, '404.html'))).toBe(true);
    expect(deps.applyProcessResult).toHaveBeenCalledWith({ status: 0, signal: null });
  });
});
