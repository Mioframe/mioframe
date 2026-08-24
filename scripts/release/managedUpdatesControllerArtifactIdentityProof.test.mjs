import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runManagedUpdatesControllerArtifactIdentityProof } from './managedUpdatesControllerArtifactIdentityProof.mjs';

describe('runManagedUpdatesControllerArtifactIdentityProof', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    process.exitCode = 0;
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  afterEach(() => {
    process.exitCode = 0;
  });

  it('builds two managed stable artifacts with distinct release identity and compares dist/sw.js bytes', async () => {
    const runLocalCommand = vi.fn(async ({ args, env }) => {
      const outDirIndex = args.indexOf('--outDir');
      const outDir = args[outDirIndex + 1];
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        join(outDir, 'sw.js'),
        `self.addEventListener("install", () => {}); // stable, ${env.VITE_RELEASE_CHANNEL}`,
      );
      return { status: 0, signal: null };
    });

    await runManagedUpdatesControllerArtifactIdentityProof({ runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(runLocalCommand.mock.calls[0][0].env).toMatchObject({
      VITE_RELEASE_CHANNEL: 'stable',
      VITE_BUILD_ID: 'controller-artifact-identity-a',
      VITE_BUILD_DATE: '2020-01-01T00:00:00.000Z',
    });
    expect(runLocalCommand.mock.calls[1][0].env).toMatchObject({
      VITE_RELEASE_CHANNEL: 'stable',
      VITE_BUILD_ID: 'controller-artifact-identity-b',
      VITE_BUILD_DATE: '2030-06-15T12:00:00.000Z',
    });
    expect(process.exitCode).not.toBe(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[managed-updates-static] passed');
  });

  it('fails and cleans up the temp dist directories when dist/sw.js bytes differ', async () => {
    const distDirs = [];
    const runLocalCommand = vi.fn(async ({ args, env }) => {
      const outDirIndex = args.indexOf('--outDir');
      const outDir = args[outDirIndex + 1];
      distDirs.push(outDir);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'sw.js'), `identity: ${env.VITE_BUILD_ID}`);
      return { status: 0, signal: null };
    });

    await runManagedUpdatesControllerArtifactIdentityProof({ runLocalCommand });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('dist/sw.js differs between managed builds'),
    );
    for (const distDir of distDirs) {
      expect(existsSync(distDir)).toBe(false);
    }
  });

  it('throws when the first build fails', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    await expect(
      runManagedUpdatesControllerArtifactIdentityProof({ runLocalCommand }),
    ).rejects.toThrow('vite build failed');

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });
});
