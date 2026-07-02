// @vitest-environment node
// This test exercises a real Node HTTP server; the default happy-dom
// environment's fetch() enforces same-origin/CORS semantics that do not
// apply to plain Node-to-Node requests.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createArtifactServer, resolveArtifactFilePath } from './artifactServer.mjs';

describe('resolveArtifactFilePath', () => {
  it('maps the base root to index.html', () => {
    expect(resolveArtifactFilePath('dist', '/mioframe/', '/mioframe/')).toBe(
      resolve('dist', 'index.html'),
    );
  });

  it('maps a nested asset path under the base', () => {
    expect(resolveArtifactFilePath('dist', '/mioframe/', '/mioframe/assets/app.js')).toBe(
      resolve('dist', 'assets', 'app.js'),
    );
  });

  it('returns null for a path outside the base', () => {
    expect(resolveArtifactFilePath('dist', '/mioframe/', '/other/app.js')).toBeNull();
  });

  it('returns null when a path traversal would escape distDir', () => {
    expect(resolveArtifactFilePath('dist', '/mioframe/', '/mioframe/../../etc/passwd')).toBeNull();
  });

  it('keeps a distDir-relative path that stays within distDir', () => {
    const filePath = resolveArtifactFilePath('dist', '/mioframe/', '/mioframe/sub/dir/file.txt');
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
    server = await createArtifactServer({ distDir, basePath: '/mioframe/' });

    const response = await fetch(`${server.url}manifest.webmanifest`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'app' });
  });

  it('serves index.html at the base root', async () => {
    server = await createArtifactServer({ distDir, basePath: '/mioframe/' });

    const response = await fetch(server.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<title>app</title>');
  });

  it('returns the site-wide SPA fallback with a 404 status for an unmatched deep route', async () => {
    server = await createArtifactServer({ distDir, basePath: '/mioframe/' });

    const response = await fetch(`${server.url}some/deep/route`);
    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toContain('"/mioframe/"');
    expect(body).toContain("sessionStorage.setItem('ghPagesSpaFallback'");
  });

  it('returns the same fallback for a path outside the base', async () => {
    server = await createArtifactServer({ distDir, basePath: '/mioframe/' });

    const response = await fetch(`${server.url.replace(/\/mioframe\/$/, '/')}other-app/`);
    expect(response.status).toBe(404);
  });
});
