import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPACE } from './types';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('updates file name and invalidates parent cache', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-to-update',
              name: 'old-name.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-to-update',
              name: 'new-name.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, update } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await update(auth, 'file-to-update', { name: 'new-name.txt' });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({ id: 'file-to-update', name: 'new-name.txt' }),
    ]);
  });

  it('adds a parent and invalidates both caches', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'child-file',
              name: 'child.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['old-parent'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'child-file',
              name: 'child.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['old-parent'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, update } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'old-parent',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await update(auth, 'child-file', { addParents: ['new-parent'] });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([expect.objectContaining({ id: 'child-file' })]);
  });

  it('removes a parent and invalidates the corresponding cache', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'child-file',
              name: 'child.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-to-remove'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'child-file',
              name: 'child.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['remaining-parent'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, update } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'parent-to-remove',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await update(auth, 'child-file', { removeParents: ['parent-to-remove'] });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([expect.objectContaining({ id: 'child-file' })]);
  });

  it('trashes a file and invalidates cache', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-to-trash',
              name: 'trash-me.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, update } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await update(auth, 'file-to-trash', { trashed: true });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([]);
  });
});
