import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  runProductionArtifactStaticProof,
  validateProductionArtifactManifest,
  validateProductionArtifactStatic,
} from './productionArtifactStaticProof.mjs';

function writeValidManifest(distDir, basePath = '/') {
  writeFileSync(
    join(distDir, 'manifest.webmanifest'),
    JSON.stringify({ name: 'App', start_url: basePath, scope: basePath }),
  );
}

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
    writeValidManifest(distDir, '/');

    expect(validateProductionArtifactStatic(distDir, '/')).toEqual([]);
  });
});

describe('validateProductionArtifactManifest', () => {
  let distDir;

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'artifact-static-manifest-'));
  });

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  it('fails when the manifest is missing', () => {
    expect(validateProductionArtifactManifest(distDir, '/')).toEqual([
      `Generated PWA manifest not found at ${join(distDir, 'manifest.webmanifest')}.`,
    ]);
  });

  it('fails when the manifest is not valid JSON', () => {
    writeFileSync(join(distDir, 'manifest.webmanifest'), '{not json');

    const errors = validateProductionArtifactManifest(distDir, '/');

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('is not valid JSON');
  });

  it('fails when "name" is missing or not a string', () => {
    writeFileSync(
      join(distDir, 'manifest.webmanifest'),
      JSON.stringify({ start_url: '/', scope: '/' }),
    );

    expect(validateProductionArtifactManifest(distDir, '/')).toContain(
      `${join(distDir, 'manifest.webmanifest')} "name" must be a string.`,
    );
  });

  it('fails when neither start_url nor scope is scoped to the configured base path', () => {
    writeFileSync(
      join(distDir, 'manifest.webmanifest'),
      JSON.stringify({ name: 'App', start_url: '/other/', scope: '/other/' }),
    );

    const errors = validateProductionArtifactManifest(distDir, '/branch/develop/');

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('must be scoped to the configured release base path');
  });

  it('passes when start_url is scoped to the configured base path', () => {
    writeValidManifest(distDir, '/branch/develop/');

    expect(validateProductionArtifactManifest(distDir, '/branch/develop/')).toEqual([]);
  });

  it('passes when only scope (not start_url) is scoped to the configured base path', () => {
    writeFileSync(
      join(distDir, 'manifest.webmanifest'),
      JSON.stringify({ name: 'App', scope: '/branch/develop/' }),
    );

    expect(validateProductionArtifactManifest(distDir, '/branch/develop/')).toEqual([]);
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
