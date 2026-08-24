import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  runProductionArtifactStaticProof,
  validateProductionArtifactStatic,
} from './productionArtifactStaticProof.mjs';

describe('validateProductionArtifactStatic', () => {
  let distDir;

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'artifact-static-'));
  });

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  it('fails when the artifact directory does not exist', () => {
    rmSync(distDir, { recursive: true, force: true });

    expect(validateProductionArtifactStatic(distDir)).toEqual([
      `Production artifact directory not found at ${distDir}.`,
    ]);
  });

  it('fails when no JS chunks and no sw.js are found', () => {
    const errors = validateProductionArtifactStatic(distDir);

    expect(errors).toContain(`No .js/.mjs chunks found under ${distDir}.`);
    expect(errors).toContain(
      `Managed controller worker artifact not found at ${join(distDir, 'sw.js')}.`,
    );
  });

  it('fails when a chunk embeds a forbidden legacy-fixture or release-identity pattern', () => {
    writeFileSync(join(distDir, 'sw.js'), 'self.addEventListener("install", () => {});');
    mkdirSync(join(distDir, 'assets'));
    writeFileSync(
      join(distDir, 'assets', 'app.js'),
      'const RELEASE_TEST_LEGACY_PWA_FIXTURE_MARKER = "RELEASE_TEST_LEGACY_PWA_FIXTURE";',
    );

    const errors = validateProductionArtifactStatic(distDir);

    expect(errors).toContain(
      `${join(distDir, 'assets', 'app.js')} embeds forbidden pattern "RELEASE_TEST_LEGACY_PWA_FIXTURE".`,
    );
  });

  it('fails when the managed controller worker calls skipWaiting() or clients.claim()', () => {
    writeFileSync(join(distDir, 'app.js'), 'console.log("ok");');
    writeFileSync(join(distDir, 'sw.js'), 'self.skipWaiting(); self.clients.claim();');

    const errors = validateProductionArtifactStatic(distDir);

    expect(errors).toContain(`${join(distDir, 'sw.js')} must never call skipWaiting().`);
    expect(errors).toContain(`${join(distDir, 'sw.js')} must never call clients.claim().`);
  });

  it('passes for a clean managed controller worker artifact', () => {
    writeFileSync(join(distDir, 'app.js'), 'console.log("ok");');
    writeFileSync(join(distDir, 'sw.js'), 'self.addEventListener("install", () => {});');

    expect(validateProductionArtifactStatic(distDir)).toEqual([]);
  });
});

describe('runProductionArtifactStaticProof', () => {
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

  it('fails closed without validating when the build step fails', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    await runProductionArtifactStaticProof({ runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledWith({
      command: 'node',
      args: ['scripts/release/buildArtifact.mjs'],
      env: process.env,
    });
    expect(process.exitCode).toBe(1);
  });

  it('fails closed when the build was terminated by a signal', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: null, signal: 'SIGTERM' });

    await runProductionArtifactStaticProof({ runLocalCommand });

    expect(process.exitCode).toBe(1);
  });
});
