import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { cleanupReleaseCaches, isReleaseAvailable, prepareRelease } from './releaseCache';

const identity = (letter: string): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
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
});
afterEach(() => vi.unstubAllGlobals());

describe('validated release cache', () => {
  it('keeps an interrupted download unreachable', async () => {
    const release = identity('a');
    const bytes = Buffer.from('first');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              schemaVersion: 1,
              ...release,
              indexUrl: `/updates/releases/${release.releaseId}/index.html`,
              files: [
                {
                  url: '/assets/first.js',
                  byteSize: bytes.byteLength,
                  sha256: createHash('sha256').update(bytes).digest('hex'),
                },
                { url: '/assets/missing.js', byteSize: 1, sha256: 'b'.repeat(64) },
              ],
            }),
          ),
        )
        .mockResolvedValueOnce(new Response(bytes))
        .mockRejectedValueOnce(new TypeError('interrupted')),
    );
    await expect(prepareRelease(release)).rejects.toThrow('interrupted');
    await expect(isReleaseAvailable(release)).resolves.toBe(false);
  });

  it('rejects a hash mismatch and deletes the partial cache', async () => {
    const release = identity('a');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              schemaVersion: 1,
              ...release,
              indexUrl: `/updates/releases/${release.releaseId}/index.html`,
              files: [{ url: '/assets/app.js', byteSize: 3, sha256: 'b'.repeat(64) }],
            }),
          ),
        )
        .mockResolvedValueOnce(new Response('bad')),
    );
    await expect(prepareRelease(release)).rejects.toThrow('validation');
    expect(cacheEntries.has(`stable-release-${release.releaseId}`)).toBe(false);
  });

  it('never cleans caches protected by active, pinned, candidate, trial, previous state', async () => {
    const releases = ['a', 'b', 'c', 'd', 'e', 'f'].map(identity);
    releases.forEach((release) =>
      cacheEntries.set(`stable-release-${release.releaseId}`, new Map()),
    );
    const state: ReleaseControllerState = {
      schemaVersion: 1,
      mode: 'manual',
      activeRelease: identity('a'),
      pinnedRelease: releases[1],
      candidateRelease: releases[2],
      bootAttempt: releases[3],
      previousRelease: releases[4],
    };
    await cleanupReleaseCaches(state);
    expect(await fakeCaches.keys()).toEqual(
      releases.slice(0, 5).map((release) => `stable-release-${release.releaseId}`),
    );
  });
});
