// @vitest-environment node
// This test exercises a real Node HTTP server; the default happy-dom
// environment's fetch() enforces same-origin/CORS semantics that do not
// apply to plain Node-to-Node requests.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createArtifactServer, resolveArtifactFilePath } from './artifactServer.mjs';

describe('resolveArtifactFilePath', () => {
  it('maps the base root to index.html', () => {
    expect(resolveArtifactFilePath('dist', '/', '/')).toBe(resolve('dist', 'index.html'));
  });

  it('maps a nested asset path under the base', () => {
    expect(resolveArtifactFilePath('dist', '/', '/assets/app.js')).toBe(
      resolve('dist', 'assets', 'app.js'),
    );
  });

  it('returns null for a path outside a non-root base', () => {
    expect(resolveArtifactFilePath('dist', '/branch/develop/', '/other/app.js')).toBeNull();
  });

  it('returns null when a path traversal would escape distDir', () => {
    expect(resolveArtifactFilePath('dist', '/', '/../../etc/passwd')).toBeNull();
  });

  it('keeps a distDir-relative path that stays within distDir', () => {
    const filePath = resolveArtifactFilePath('dist', '/', '/sub/dir/file.txt');
    expect(filePath).toBe(resolve('dist', 'sub', 'dir', 'file.txt'));
    expect(filePath.startsWith(resolve('dist') + sep)).toBe(true);
  });
});

describe('createArtifactServer', () => {
  let distDir = '';
  let server;

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'artifact-server-'));
    writeFileSync(join(distDir, 'index.html'), '<!doctype html><title>app</title>');
    writeFileSync(join(distDir, 'manifest.webmanifest'), '{"name":"app"}');
  });

  afterEach(async () => {
    await server?.close();
    rmSync(distDir, { recursive: true, force: true });
  });

  it('serves an existing file under the base path with a 200 status', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });

    const response = await fetch(`${server.url}manifest.webmanifest`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'app' });
  });

  it('serves index.html at the base root', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });

    const response = await fetch(server.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<title>app</title>');
  });

  it('returns the site-wide SPA fallback with a 404 status for an unmatched deep route', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });

    const response = await fetch(`${server.url}some/deep/route`);
    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toContain("sessionStorage.setItem('ghPagesSpaFallback'");
  });

  it('returns the same fallback for a path outside a non-root base', async () => {
    server = await createArtifactServer({ distDir, basePath: '/branch/develop/' });

    const response = await fetch(`${server.url.replace(/\/branch\/develop\/$/, '/')}other-app/`);
    expect(response.status).toBe(404);
  });
});

describe('managed fixture legacy worker mode', () => {
  let distDir = '';
  let server;

  const releaseIdentity = {
    releaseId: 'a'.repeat(40),
    releaseSequence: 1,
    appVersion: '1.0.0',
    buildId: 'aaaaaaa',
    buildDate: '2026-07-23T00:00:00.000Z',
  };

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'artifact-server-legacy-'));
    writeFileSync(join(distDir, 'index.html'), '<!doctype html><title>managed</title>');
    writeFileSync(join(distDir, 'sw.js'), 'self.addEventListener("install",()=>{});');
    writeFileSync(join(distDir, 'worker-b-sw.js'), 'self.__WORKER__="B";');
    mkdirSync(join(distDir, 'legacy-artifact'));
    writeFileSync(
      join(distDir, 'legacy-artifact', 'index.html'),
      '<!doctype html><title>legacy</title>',
    );
    writeFileSync(join(distDir, 'legacy-artifact', 'sw.js'), 'self.__WORKER__="legacy";');
    writeFileSync(
      join(distDir, 'managed-stable-fixture.json'),
      JSON.stringify({
        schemaVersion: 1,
        releases: {
          A: {
            latest: {
              schemaVersion: 2,
              release: releaseIdentity,
              descriptorUrl: `/updates/releases/${releaseIdentity.releaseId}.json`,
            },
            descriptor: {
              schemaVersion: 2,
              ...releaseIdentity,
              indexUrl: `/updates/releases/${releaseIdentity.releaseId}/index.html`,
              files: [],
            },
          },
        },
      }),
    );
  });

  afterEach(async () => {
    await server?.close();
    rmSync(distDir, { recursive: true, force: true });
  });

  it('serves the complete legacy artifact tree, not only sw.js, once legacy worker mode is selected', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });
    await fetch(`${server.url}__managed-fixture/worker/legacy`);

    const indexResponse = await fetch(server.url);
    expect(await indexResponse.text()).toContain('<title>legacy</title>');

    const workerResponse = await fetch(`${server.url}sw.js`);
    expect(await workerResponse.text()).toBe('self.__WORKER__="legacy";');
  });

  it('serves the current managed artifact once switched back to current worker mode', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });
    await fetch(`${server.url}__managed-fixture/worker/legacy`);
    await fetch(`${server.url}__managed-fixture/worker/current`);

    const indexResponse = await fetch(server.url);
    expect(await indexResponse.text()).toContain('<title>managed</title>');
  });

  it('substitutes only sw.js for worker-B mode, leaving the rest of the managed artifact untouched', async () => {
    server = await createArtifactServer({ distDir, basePath: '/' });
    await fetch(`${server.url}__managed-fixture/worker/B`);

    const indexResponse = await fetch(server.url);
    expect(await indexResponse.text()).toContain('<title>managed</title>');

    const workerResponse = await fetch(`${server.url}sw.js`);
    expect(await workerResponse.text()).toBe('self.__WORKER__="B";');
  });
});
