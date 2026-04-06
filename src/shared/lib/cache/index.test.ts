import { describe, expect, it } from 'vitest';
import { Cache } from './index';

describe('Cache', () => {
  it('preserves the original key metadata when the same cache key is set repeatedly', () => {
    const cache = new Cache<{ parentId: string }, { files: { id: string }[] }>({
      max: 10,
    });
    const key = { parentId: 'appDataFolder' };

    cache.set(key, { files: [{ id: 'first' }] });
    cache.set(key, { files: [{ id: 'second' }] });
    cache.set(key, { files: [{ id: 'third' }] });

    const entries: Array<{
      cacheKey: string;
      originalKey: { parentId: string } | string;
      fileIds: string[];
    }> = [];

    cache.forEachEntry((value, cacheKey, originalKey) => {
      entries.push({
        cacheKey,
        originalKey,
        fileIds: value.files.map(({ id }) => id),
      });
    });

    expect(entries).toEqual([
      {
        cacheKey: expect.any(String),
        originalKey: key,
        fileIds: ['third'],
      },
    ]);
  });
});
