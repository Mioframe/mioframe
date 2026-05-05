import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI download', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reuses the cached file download when metadata has not changed', async () => {
    const mediaBlob = new Blob(['cached-content'], { type: 'text/plain' });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(mediaBlob, { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const firstFile = await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    const secondFile = await download({ ACCESS_TOKEN: 'token' }, 'file-id');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await firstFile.text()).toBe('cached-content');
    expect(secondFile).toBe(firstFile);
  });
});
