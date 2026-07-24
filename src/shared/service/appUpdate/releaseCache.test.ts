import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LatestRelease, ReleaseControllerState, ReleaseIdentity } from './contracts';
import {
  cleanupReleaseCaches,
  cleanupStaleStagingCaches,
  getReleaseResponse,
  isReleaseAvailable,
  prepareRelease,
} from './releaseCache';
import { createInitialReleaseControllerState } from './stateMachine';

const identity = (letter: string, releaseSequence: number): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});
const latest = (release: ReleaseIdentity): LatestRelease => ({
  schemaVersion: 2,
  release,
  descriptorUrl: `/updates/releases/${release.releaseId}.json`,
});
const cacheEntries = new Map<string, Map<string, Response>>();
const fakeCaches = {
  open(name: string) {
    const entries = cacheEntries.get(name) ?? new Map<string, Response>();
    cacheEntries.set(name, entries);
    return Promise.resolve({
      put: (key: string, response: Response) => {
        entries.set(key, response.clone());
        return Promise.resolve();
      },
      match: (key: string) => Promise.resolve(entries.get(key)?.clone()),
    });
  },
  delete(name: string) {
    return Promise.resolve(cacheEntries.delete(name));
  },
  keys() {
    return Promise.resolve([...cacheEntries.keys()]);
  },
};

beforeEach(() => {
  cacheEntries.clear();
  vi.stubGlobal('caches', fakeCaches);
  vi.stubGlobal('self', { location: { origin: 'https://example.test' } });
  vi.stubGlobal('crypto', { subtle: crypto.subtle, randomUUID: () => 'attempt' });
});
afterEach(() => vi.unstubAllGlobals());

const descriptor = (release: ReleaseIdentity, bytes: Buffer) => ({
  schemaVersion: 2,
  ...release,
  indexUrl: `/updates/releases/${release.releaseId}/index.html`,
  files: [
    {
      url: `/updates/releases/${release.releaseId}/index.html`,
      byteSize: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  ],
});

describe('staged release cache', () => {
  it('commits only after validation and a failed repeat cannot remove the valid release', async () => {
    const release = identity('a', 1);
    const bytes = Buffer.from('index');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(descriptor(release, bytes))))
        .mockResolvedValueOnce(new Response(bytes)),
    );
    await prepareRelease(latest(release));
    await expect(isReleaseAvailable(release)).resolves.toBe(true);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(prepareRelease(latest(release))).rejects.toThrow('offline');
    await expect(isReleaseAvailable(release)).resolves.toBe(true);
    expect(
      [...cacheEntries.keys()].some((name) => name.startsWith('stable-release-staging-')),
    ).toBe(false);
  });

  it('protects every release referenced by durable and in-flight state during cleanup', async () => {
    const releases = [1, 2, 3, 4, 5, 6].map((sequence) =>
      identity(String.fromCharCode(96 + sequence), sequence),
    );
    const [active, pinned, prepared, previous, target] = releases;
    if (!active || !pinned || !prepared || !previous || !target)
      throw new Error('Expected release fixtures.');
    releases.forEach((release) =>
      cacheEntries.set(`stable-release-${release.releaseId}`, new Map()),
    );
    const state: ReleaseControllerState = {
      ...createInitialReleaseControllerState(active),
      mode: 'manual',
      pinnedRelease: pinned,
      preparation: { status: 'ready', release: prepared },
      trial: {
        targetRelease: target,
        previousRelease: previous,
        startedAt: '2026-07-23T00:00:00.000Z',
        expiresAt: '2026-07-23T00:01:00.000Z',
      },
    };
    await cleanupReleaseCaches(state);
    expect(await fakeCaches.keys()).toEqual(
      releases.slice(0, 5).map((release) => `stable-release-${release.releaseId}`),
    );
  });

  it('unconditionally removes every staging cache found at startup', async () => {
    cacheEntries.set('stable-release-staging-a-1', new Map());
    cacheEntries.set('stable-release-staging-b-2', new Map());
    cacheEntries.set(`stable-release-${identity('a', 1).releaseId}`, new Map());
    await cleanupStaleStagingCaches();
    expect(await fakeCaches.keys()).toEqual([`stable-release-${identity('a', 1).releaseId}`]);
  });

  describe('full cache identity validation', () => {
    const seedCache = async (release: ReleaseIdentity, storedDescriptor: unknown) => {
      const bytes = Buffer.from('index');
      const cache = await fakeCaches.open(`stable-release-${release.releaseId}`);
      await cache.put(
        `/updates/releases/${release.releaseId}/index.html`,
        new Response(bytes, { status: 200 }),
      );
      await cache.put(
        `/updates/releases/${release.releaseId}.json`,
        new Response(JSON.stringify(storedDescriptor)),
      );
    };

    it('is unavailable when the cached descriptor sequence does not match, even under the same release id', async () => {
      const release = identity('a', 1);
      await seedCache(release, {
        ...descriptor(release, Buffer.from('index')),
        releaseSequence: 9,
      });
      await expect(isReleaseAvailable(release)).resolves.toBe(false);
    });

    it('is unavailable when cached build metadata does not match', async () => {
      const release = identity('a', 1);
      await seedCache(release, { ...descriptor(release, Buffer.from('index')), buildId: 'other' });
      await expect(isReleaseAvailable(release)).resolves.toBe(false);
    });

    it('is unavailable when the cached descriptor identity does not match the expected cache at all', async () => {
      const release = identity('a', 1);
      const foreign = descriptor(identity('z', 1), Buffer.from('index'));
      await seedCache(release, foreign);
      await expect(isReleaseAvailable(release)).resolves.toBe(false);
    });

    it('is unavailable when a referenced file is missing from an otherwise valid descriptor', async () => {
      const release = identity('a', 1);
      const bytes = Buffer.from('index');
      const cache = await fakeCaches.open(`stable-release-${release.releaseId}`);
      await cache.put(
        `/updates/releases/${release.releaseId}.json`,
        new Response(JSON.stringify(descriptor(release, bytes))),
      );
      // The index file itself is never written, simulating a partially committed final cache.
      await expect(isReleaseAvailable(release)).resolves.toBe(false);
    });
  });

  describe('final-cache commit-marker visibility', () => {
    const assetUrl = '/assets/app.js';
    const seedFinalCache = async (
      release: ReleaseIdentity,
      { withMarker, markerValue }: { withMarker: boolean; markerValue?: unknown },
    ) => {
      const indexBytes = Buffer.from('index');
      const assetBytes = Buffer.from('asset');
      const cache = await fakeCaches.open(`stable-release-${release.releaseId}`);
      await cache.put(
        `/updates/releases/${release.releaseId}/index.html`,
        new Response(indexBytes, { status: 200 }),
      );
      await cache.put(assetUrl, new Response(assetBytes, { status: 200 }));
      if (withMarker) {
        await cache.put(
          `/updates/releases/${release.releaseId}.json`,
          new Response(JSON.stringify(markerValue ?? descriptor(release, indexBytes))),
        );
      }
    };

    it('serves the archived index and an asset once the commit marker matches the selected identity', async () => {
      const release = identity('a', 1);
      await seedFinalCache(release, { withMarker: true });
      await expect(getReleaseResponse(release, '/', true)).resolves.toBeInstanceOf(Response);
      await expect(getReleaseResponse(release, assetUrl, false)).resolves.toBeInstanceOf(Response);
    });

    it('serves nothing when the final cache has no commit marker at all', async () => {
      const release = identity('a', 1);
      await seedFinalCache(release, { withMarker: false });
      await expect(getReleaseResponse(release, '/', true)).resolves.toBeUndefined();
      await expect(getReleaseResponse(release, assetUrl, false)).resolves.toBeUndefined();
    });

    it('serves nothing when the commit marker is malformed', async () => {
      const release = identity('a', 1);
      await seedFinalCache(release, { withMarker: true, markerValue: { not: 'a descriptor' } });
      await expect(getReleaseResponse(release, '/', true)).resolves.toBeUndefined();
    });

    it('serves nothing when the commit marker names another identity', async () => {
      const release = identity('a', 1);
      const foreign = descriptor(identity('z', 1), Buffer.from('index'));
      await seedFinalCache(release, { withMarker: true, markerValue: foreign });
      await expect(getReleaseResponse(release, '/', true)).resolves.toBeUndefined();
    });

    it('serves nothing for a partially promoted final cache even though the marker itself is valid', async () => {
      const release = identity('a', 1);
      const indexBytes = Buffer.from('index');
      const cache = await fakeCaches.open(`stable-release-${release.releaseId}`);
      await cache.put(
        `/updates/releases/${release.releaseId}.json`,
        new Response(JSON.stringify(descriptor(release, indexBytes))),
      );
      // The index and asset files themselves were never promoted; only the marker landed.
      await expect(getReleaseResponse(release, '/', true)).resolves.toBeUndefined();
      await expect(getReleaseResponse(release, assetUrl, false)).resolves.toBeUndefined();
    });
  });
});
