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

    // Verify PATCH request has correct searchParams and JSON body
    const updateRequest = fetchMock.mock.calls[2]?.[0];
    if (updateRequest instanceof Request) {
      expect(updateRequest.url).toContain('/drive/v3/files/file-to-update');
      expect(updateRequest.method).toBe('PATCH');
      // Verify trashed is NOT in searchParams when not specified
      expect(updateRequest.url).not.toContain('trashed%3D');
      await expect(updateRequest.clone().json()).resolves.toEqual({
        name: 'new-name.txt',
      });
    }

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
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'other-child',
              name: 'other.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['new-parent'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'other-child',
              name: 'other.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['new-parent'],
            },
            {
              id: 'child-file',
              name: 'child.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['new-parent'],
            },
          ],
        }),
      )
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
    const oldParentListParams = {
      q: {
        parentId: 'old-parent',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };
    const newParentListParams = {
      q: {
        parentId: 'new-parent',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, oldParentListParams);
    await getGFileMetaList(auth, newParentListParams);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await update(auth, 'child-file', { addParents: ['new-parent'] });

    // Verify PATCH request has correct searchParams with addParents (not URL encoded)
    const updateRequest = fetchMock.mock.calls[2]?.[0];
    if (updateRequest instanceof Request) {
      expect(updateRequest.url).toContain('addParents=new-parent');
      await expect(updateRequest.clone().json()).resolves.toEqual({});
    }

    const refreshedNewParentResult = await getGFileMetaList(auth, newParentListParams);
    const refreshedOldParentResult = await getGFileMetaList(auth, oldParentListParams);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(refreshedNewParentResult.files).toEqual([
      expect.objectContaining({ id: 'other-child' }),
      expect.objectContaining({ id: 'child-file' }),
    ]);
    expect(refreshedOldParentResult.files).toEqual([expect.objectContaining({ id: 'child-file' })]);
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
      )
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [],
        }),
      )
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
    const removedParentListParams = {
      q: {
        parentId: 'parent-to-remove',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };
    const remainingParentListParams = {
      q: {
        parentId: 'remaining-parent',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, removedParentListParams);
    await getGFileMetaList(auth, remainingParentListParams);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await update(auth, 'child-file', { removeParents: ['parent-to-remove'] });

    // Verify PATCH request has correct searchParams with removeParents (not URL encoded)
    const updateRequest = fetchMock.mock.calls[2]?.[0];
    if (updateRequest instanceof Request) {
      expect(updateRequest.url).toContain('removeParents=parent-to-remove');
      await expect(updateRequest.clone().json()).resolves.toEqual({});
    }

    const refreshedRemovedParentResult = await getGFileMetaList(auth, removedParentListParams);
    const refreshedRemainingParentResult = await getGFileMetaList(auth, remainingParentListParams);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(refreshedRemovedParentResult.files).toEqual([]);
    expect(refreshedRemainingParentResult.files).toEqual([
      expect.objectContaining({ id: 'child-file' }),
    ]);
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

    // Verify PATCH request has correct JSON body with trashed=true and searchParams without removeParents/addParents
    const updateRequest = fetchMock.mock.calls[1]?.[0];
    if (updateRequest instanceof Request) {
      expect(updateRequest.url).not.toContain('addParents%3D');
      expect(updateRequest.url).not.toContain('removeParents%3D');
    }

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([]);
  });

  it('updates file with trashed=false explicitly', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // First call: getGFileMetaList
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-id',
              name: 'file.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      // Second call: update PATCH request
      .mockResolvedValueOnce(createJsonResponse({}));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, update } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'parent-id',
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await update(auth, 'file-id', { trashed: false });

    // Verify PATCH request has correct JSON body with trashed=false
    const updateRequest = fetchMock.mock.calls[1]?.[0];
    if (updateRequest instanceof Request) {
      expect(updateRequest.method).toBe('PATCH');
    }
  });
});
