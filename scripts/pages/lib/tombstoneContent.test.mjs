import { describe, expect, it } from 'vitest';

import {
  buildBranchCacheNamePrefix,
  buildTombstoneFiles,
  buildTombstoneHtml,
  buildTombstoneManifest,
  buildTombstoneServiceWorker,
} from './tombstoneContent.mjs';

describe('buildBranchCacheNamePrefix', () => {
  it('builds a branch-scoped cache prefix', () => {
    expect(buildBranchCacheNamePrefix('develop')).toBe('branch-develop-');
    expect(buildBranchCacheNamePrefix('feature-x')).toBe('branch-feature-x-');
  });
});

describe('buildTombstoneServiceWorker', () => {
  it('embeds the branch-scoped cache prefix', () => {
    const sw = buildTombstoneServiceWorker('develop');
    expect(sw).toContain('"branch-develop-"');
  });

  it('only deletes caches matching this branch prefix', () => {
    const sw = buildTombstoneServiceWorker('develop');
    expect(sw).toContain('key.startsWith(CACHE_PREFIX)');
    expect(sw).toContain('caches.delete(key)');
  });

  it('uses a different cache prefix per branch', () => {
    const developSw = buildTombstoneServiceWorker('develop');
    const otherSw = buildTombstoneServiceWorker('feature-x');
    expect(developSw).toContain('"branch-develop-"');
    expect(otherSw).toContain('"branch-feature-x-"');
    expect(developSw).not.toContain('"branch-feature-x-"');
  });

  it('does not message clients or force a reload', () => {
    const sw = buildTombstoneServiceWorker('develop');
    expect(sw).not.toMatch(/postMessage/);
    expect(sw).not.toMatch(/location\.reload/);
  });

  it('claims clients passively via clients.claim, not forced reload', () => {
    const sw = buildTombstoneServiceWorker('develop');
    expect(sw).toContain('self.clients.claim()');
  });
});

describe('buildTombstoneManifest', () => {
  it('scopes the manifest to the branch base URL', () => {
    const manifest = buildTombstoneManifest('develop', '/branch/develop/');
    expect(manifest.scope).toBe('/branch/develop/');
    expect(manifest.start_url).toBe('/branch/develop/');
    expect(manifest.id).toBe('/branch/develop/');
  });

  it('names the manifest for the removed branch', () => {
    const manifest = buildTombstoneManifest('feature-x', '/branch/feature-x/');
    expect(manifest.name).toContain('feature-x');
    expect(manifest.name).toContain('removed');
  });
});

describe('buildTombstoneHtml', () => {
  it('links to the stable root', () => {
    const html = buildTombstoneHtml('develop', '/branch/develop/');
    expect(html).toContain('href="/"');
  });

  it('mentions the removed branch by name', () => {
    const html = buildTombstoneHtml('develop', '/branch/develop/');
    expect(html).toContain('develop');
  });

  it('registers the service worker at the branch scope', () => {
    const html = buildTombstoneHtml('develop', '/branch/develop/');
    expect(html).toContain("register('sw.js'");
    expect(html).toContain('/branch/develop/');
  });
});

describe('buildTombstoneFiles', () => {
  it('returns index.html, sw.js, and manifest.webmanifest', () => {
    const files = buildTombstoneFiles('develop', '/branch/develop/');
    expect(Object.keys(files).sort()).toEqual(['index.html', 'manifest.webmanifest', 'sw.js']);
  });

  it('produces valid JSON for the manifest', () => {
    const files = buildTombstoneFiles('develop', '/branch/develop/');
    expect(() => JSON.parse(files['manifest.webmanifest'])).not.toThrow();
  });
});
