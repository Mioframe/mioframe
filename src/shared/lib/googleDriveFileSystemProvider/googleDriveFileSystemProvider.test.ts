import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import {
  FSNodeType,
  VfsEventSource,
  VfsEventType,
} from '@shared/lib/virtualFileSystem';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';

const {
  createMock,
  downloadMock,
  getGFileMetaListMock,
  updateMock,
  uploadMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  downloadMock: vi.fn(),
  getGFileMetaListMock: vi.fn(),
  updateMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock('@shared/lib/googleDrive/api', () => ({
  create: createMock,
  download: downloadMock,
  getGFileMetaList: getGFileMetaListMock,
  SPACE: {
    drive: 'drive',
    appDataFolder: 'appDataFolder',
  },
  update: updateMock,
  upload: uploadMock,
}));

import { googleDriveFileSystemProvider } from './googleDriveFileSystemProvider';

describe('googleDriveFileSystemProvider', () => {
  beforeEach(() => {
    createMock.mockReset();
    downloadMock.mockReset();
    getGFileMetaListMock.mockReset();
    updateMock.mockReset();
    uploadMock.mockReset();
  });

  it('reads the root directory from reactive sessions', async () => {
    const sessions$ = new BehaviorSubject<string[]>(['user@example.com']);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken: vi.fn(),
    });

    const entries = await provider.readDirectory('/');

    expect(entries).toEqual([
      [
        'user@example.com',
        {
          capabilities: {
            canChangePath: false,
            canDelete: false,
            canEditChildren: false,
          },
          type: FSNodeType.Directory,
        },
      ],
    ]);
  });

  it('emits a provider event when sessions change after initialization', async () => {
    const sessions$ = new BehaviorSubject<string[]>([]);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken: vi.fn(),
    });
    const onEvent = vi.fn();

    const unsubscribe = provider.watch(onEvent);

    await Promise.resolve();

    expect(onEvent).not.toHaveBeenCalled();

    sessions$.next(['user@example.com']);

    expect(onEvent).toHaveBeenCalledWith({
      source: VfsEventSource.PROVIDER,
      type: VfsEventType.UPDATE,
      path: '/',
      nodeType: FSNodeType.Directory,
    });

    unsubscribe();
  });

  it('allows follow-up App Data reads to observe stale and then fresh directory state after createDirectory', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const sessions$ = new BehaviorSubject<string[]>(['user@example.com']);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken,
    });
    const newFolderMeta = {
      id: 'new-folder-id',
      name: 'new-folder',
      mimeType: 'application/vnd.google-apps.folder',
      modifiedTime: '2024-01-02T00:00:00.000Z',
      parents: ['appDataFolder'],
      capabilities: {
        canAddChildren: true,
        canRename: true,
        canTrash: true,
      },
    } satisfies GDriveFileMeta;

    getGFileMetaListMock
      .mockResolvedValueOnce({ files: [] })
      .mockResolvedValueOnce({ files: [] })
      .mockResolvedValueOnce({ files: [newFolderMeta] });
    createMock.mockResolvedValue({
      result: {
        id: 'new-folder-id',
      },
    });

    await provider.createDirectory('/user@example.com/App Data/new-folder');

    const staleRead = await provider.readDirectory(
      '/user@example.com/App Data',
    );
    const freshRead = await provider.readDirectory(
      '/user@example.com/App Data',
    );

    expect(createMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      {
        name: 'new-folder',
        parents: ['appDataFolder'],
        mimeType: 'application/vnd.google-apps.folder',
      },
    );
    expect(getGFileMetaListMock).toHaveBeenCalledTimes(3);
    expect(staleRead).toEqual([]);
    expect(freshRead).toEqual([
      [
        'new-folder',
        {
          type: FSNodeType.Directory,
          creationTime: undefined,
          modificationTime: expect.any(Number),
          size: undefined,
          capabilities: {
            canDelete: true,
            canChangePath: true,
            canEditChildren: true,
          },
        },
      ],
    ]);
    expect(getGFileMetaListMock).toHaveBeenNthCalledWith(
      2,
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          trashed: false,
          sharedWithMe: false,
          parentId: 'appDataFolder',
        },
        pageSize: 1000,
        spaces: ['appDataFolder'],
        fetchAll: true,
      },
    );
    expect(getGFileMetaListMock).toHaveBeenNthCalledWith(
      3,
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          trashed: false,
          sharedWithMe: false,
          parentId: 'appDataFolder',
        },
        pageSize: 1000,
        spaces: ['appDataFolder'],
        fetchAll: true,
      },
    );
  });
});
