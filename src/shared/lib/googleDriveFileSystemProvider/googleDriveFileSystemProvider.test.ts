import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import {
  FileSystemError,
  FSNodeType,
  VfsEventSource,
  VfsEventType,
} from '@shared/lib/virtualFileSystem';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';

const { createMock, downloadMock, getGFileMetaListMock, updateMock, uploadMock } = vi.hoisted(
  () => ({
    createMock: vi.fn(),
    downloadMock: vi.fn(),
    getGFileMetaListMock: vi.fn(),
    updateMock: vi.fn(),
    uploadMock: vi.fn(),
  }),
);

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

    const staleRead = await provider.readDirectory('/user@example.com/App Data');
    const freshRead = await provider.readDirectory('/user@example.com/App Data');

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

  it('reads the account root as the three virtual Google Drive spaces', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(),
    });

    await expect(provider.readDirectory('/user@example.com')).resolves.toEqual([
      [
        'App Data',
        expect.objectContaining({
          type: FSNodeType.Directory,
          capabilities: {
            canDelete: false,
            canChangePath: false,
            canEditChildren: true,
          },
        }),
      ],
      [
        'My Drive',
        expect.objectContaining({
          type: FSNodeType.Directory,
          capabilities: {
            canDelete: false,
            canChangePath: false,
            canEditChildren: true,
          },
        }),
      ],
      [
        'Shared with me',
        expect.objectContaining({
          type: FSNodeType.Directory,
          capabilities: {
            canDelete: false,
            canChangePath: false,
            canEditChildren: false,
          },
        }),
      ],
    ]);
  });

  it('queries Shared with me without a parent id and with the drive scope', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'shared-file-id',
          name: 'shared.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          capabilities: {
            canTrash: false,
            canRename: false,
          },
        },
      ],
    });

    await expect(provider.readDirectory('/user@example.com/Shared with me')).resolves.toEqual([
      [
        'shared.txt',
        expect.objectContaining({
          type: FSNodeType.File,
        }),
      ],
    ]);

    expect(requestToken).toHaveBeenCalledWith([DRIVE_GOOGLE_SCOPE.all], 'user@example.com');
    expect(getGFileMetaListMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          trashed: false,
          sharedWithMe: true,
          parentId: undefined,
        },
        pageSize: 1000,
        spaces: ['drive'],
        fetchAll: true,
      },
    );
  });

  it('wraps download failures from readFile into an unknown VfsError', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['root'],
        },
      ],
    });
    downloadMock.mockRejectedValue(new Error('download failed'));

    await expect(provider.readFile('/user@example.com/My Drive/notes.txt')).rejects.toMatchObject({
      code: FileSystemError.Unknown,
    });
  });

  it('trashes a newly created file when upload fails during writeFile', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'root',
            name: 'My Drive',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
              canRename: true,
              canTrash: false,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [],
      });
    createMock.mockResolvedValue({
      result: {
        id: 'created-file-id',
      },
    });
    uploadMock.mockRejectedValue(new Error('upload failed'));

    await expect(
      provider.writeFile('/user@example.com/My Drive/notes.txt', 'content', {
        create: true,
        overwrite: true,
      }),
    ).rejects.toThrow('upload failed');

    expect(createMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      {
        name: 'notes.txt',
        parents: ['root'],
      },
    );
    expect(updateMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'created-file-id',
      {
        trashed: true,
      },
    );
  });

  it('rejects moves into the Shared with me root', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'source-id',
            name: 'notes.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['root'],
            capabilities: {
              canRename: true,
              canTrash: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [],
      });

    await expect(
      provider.move(
        '/user@example.com/My Drive/notes.txt',
        '/user@example.com/Shared with me/notes.txt',
      ),
    ).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
  });

  it('maps file stats with parsed timestamps, size, and capabilities', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'file-id',
          name: 'report.pdf',
          mimeType: 'application/pdf',
          size: '42',
          createdTime: '2024-01-01T00:00:00.000Z',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['root'],
          capabilities: {
            canTrash: true,
            canRename: true,
          },
        },
      ],
    });

    await expect(provider.stat('/user@example.com/My Drive/report.pdf')).resolves.toEqual({
      type: FSNodeType.File,
      size: 42,
      creationTime: expect.any(Number),
      modificationTime: expect.any(Number),
      capabilities: {
        canDelete: true,
        canChangePath: true,
        canEditChildren: false,
      },
    });
  });

  it('rejects stat when a path segment resolves to a file before the end', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'file-id',
          name: 'report.pdf',
          mimeType: 'application/pdf',
          modifiedTime: '2024-01-02T00:00:00.000Z',
        },
      ],
    });

    await expect(
      provider.stat('/user@example.com/My Drive/report.pdf/child'),
    ).rejects.toMatchObject({
      code: FileSystemError.FileNotADirectory,
    });
  });

  it('rejects createDirectory inside the Shared with me root', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock.mockResolvedValueOnce({ files: [] }).mockResolvedValueOnce({
      files: [
        {
          id: 'sharedWithMe',
          name: 'Shared with me',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2024-01-02T00:00:00.000Z',
        },
      ],
    });

    await expect(
      provider.createDirectory('/user@example.com/Shared with me/new-folder'),
    ).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
  });

  it('rejects deleting a non-empty directory without recursive mode', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'dir-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
              canTrash: true,
              canRename: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'child-id',
            name: 'child',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(provider.delete('/user@example.com/My Drive/folder', false)).rejects.toMatchObject(
      {
        code: FileSystemError.DirectoryNotEmpty,
      },
    );
  });

  it('rejects deleting entries without delete permission', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'file-id',
          name: 'locked.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          capabilities: {
            canTrash: false,
            canRename: true,
          },
        },
      ],
    });

    await expect(
      provider.delete('/user@example.com/My Drive/locked.txt', true),
    ).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
  });

  it('treats moves to the same normalized path as a no-op', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    await provider.move(
      '/user@example.com/My Drive/report.pdf',
      '/user@example.com/My Drive/report.pdf/',
    );

    expect(updateMock).not.toHaveBeenCalled();
    expect(getGFileMetaListMock).not.toHaveBeenCalled();
  });
});
