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

const {
  createMock,
  createWithContentMock,
  downloadMock,
  getGFileMetaListMock,
  updateMock,
  uploadMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  createWithContentMock: vi.fn(),
  downloadMock: vi.fn(),
  getGFileMetaListMock: vi.fn(),
  updateMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock('@shared/lib/googleDrive/api', () => ({
  create: createMock,
  createWithContent: createWithContentMock,
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
    createWithContentMock.mockReset();
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
          description: 'Connected Google Drive account',
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
          description: 'Hidden app data used by this app',
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
          description: 'Files and folders in your Google Drive',
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
          description: 'Files others shared with you',
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

  it('returns root-level stats with descriptions for Google Drive virtual directories', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(),
    });

    await expect(provider.stat('/')).resolves.toEqual({
      description: 'Cloud storage from Google Drive',
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: false,
      },
    });
    await expect(provider.stat('/user@example.com')).resolves.toEqual({
      description: 'Connected Google Drive account',
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: false,
      },
    });
    await expect(provider.stat('/user@example.com/My Drive')).resolves.toEqual({
      description: 'Files and folders in your Google Drive',
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: true,
      },
    });
    await expect(provider.stat('/user@example.com/Shared with me')).resolves.toEqual({
      description: 'Files others shared with you',
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: false,
      },
    });
  });

  it('wraps paths without an email in a not-found stat error', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(),
    });

    await expect(provider.stat('/My Drive')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
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
    expect(downloadMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'file-id',
    );
  });

  it('rejects reading a directory as a file without downloading', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'folder-id',
          name: 'folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2024-01-02T00:00:00.000Z',
        },
      ],
    });

    await expect(provider.readFile('/user@example.com/My Drive/folder')).rejects.toMatchObject({
      code: FileSystemError.FileIsADirectory,
    });
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('trashes a newly created file when upload fails during writeFile', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });
    const largeContent = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
      type: 'application/octet-stream',
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [],
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
      provider.writeFile('/user@example.com/My Drive/notes.txt', largeContent, {
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

  it('uses upload for an existing file during writeFile', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValueOnce({
      files: [
        {
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
        },
      ],
    });

    await provider.writeFile('/user@example.com/My Drive/notes.txt', 'content', {
      create: true,
      overwrite: true,
    });

    expect(uploadMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'file-id',
      'content',
    );
    expect(createMock).not.toHaveBeenCalled();
    expect(createWithContentMock).not.toHaveBeenCalled();
  });

  it('uses createWithContent for a new small file during writeFile', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValueOnce({
      files: [],
    });
    createWithContentMock.mockResolvedValue({
      result: {
        id: 'created-file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
        size: '7',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['root'],
      },
    });

    await provider.writeFile('/user@example.com/My Drive/notes.txt', 'content', {
      create: true,
      overwrite: true,
    });

    expect(createWithContentMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      {
        name: 'notes.txt',
        parents: ['root'],
      },
      'content',
    );
    expect(createMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('keeps create plus upload for a new file larger than multipart limit', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });
    const largeContent = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
      type: 'application/octet-stream',
    });

    getGFileMetaListMock.mockResolvedValueOnce({
      files: [],
    });
    createMock.mockResolvedValue({
      result: {
        id: 'created-file-id',
      },
    });

    await provider.writeFile('/user@example.com/My Drive/notes.bin', largeContent, {
      create: true,
      overwrite: true,
    });

    expect(createMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      {
        name: 'notes.bin',
        parents: ['root'],
      },
    );
    expect(uploadMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'created-file-id',
      expect.any(Blob),
    );
    expect(createWithContentMock).not.toHaveBeenCalled();
  });

  it('propagates multipart upload failure without cleanup for a new small file', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValueOnce({
      files: [],
    });
    createWithContentMock.mockRejectedValue(new Error('multipart failed'));

    await expect(
      provider.writeFile('/user@example.com/My Drive/notes.txt', 'content', {
        create: true,
        overwrite: true,
      }),
    ).rejects.toThrow('multipart failed');

    expect(updateMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('rejects writeFile when an existing file cannot be overwritten', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'root',
            name: 'My Drive',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'file-id',
            name: 'notes.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(
      provider.writeFile('/user@example.com/My Drive/notes.txt', 'content', {
        create: true,
        overwrite: false,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.FileExists,
    });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects writeFile when the target path resolves to a directory', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'root',
            name: 'My Drive',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'folder-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(
      provider.writeFile('/user@example.com/My Drive/folder', 'content', {
        create: true,
        overwrite: true,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.FileIsADirectory,
    });
    expect(uploadMock).not.toHaveBeenCalled();
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

  it('maps directory stats with capability fallbacks for editable and locked directories', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'folder-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
              canRename: true,
              canTrash: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'locked-folder-id',
            name: 'locked-folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(provider.stat('/user@example.com/My Drive/folder')).resolves.toEqual({
      type: FSNodeType.Directory,
      size: undefined,
      creationTime: undefined,
      modificationTime: expect.any(Number),
      capabilities: {
        canDelete: true,
        canChangePath: true,
        canEditChildren: true,
      },
    });
    await expect(provider.stat('/user@example.com/My Drive/locked-folder')).resolves.toEqual({
      type: FSNodeType.Directory,
      size: undefined,
      creationTime: undefined,
      modificationTime: expect.any(Number),
      capabilities: {
        canDelete: false,
        canChangePath: false,
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

  it('queries nested path segments with the expected parent ids during stat', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'folder-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'file-id',
            name: 'report.pdf',
            mimeType: 'application/pdf',
            modifiedTime: '2024-01-03T00:00:00.000Z',
            capabilities: {
              canTrash: true,
              canRename: true,
            },
          },
        ],
      });

    await provider.stat('/user@example.com/My Drive/folder/report.pdf');

    expect(getGFileMetaListMock).toHaveBeenNthCalledWith(
      1,
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          name: 'folder',
          sharedWithMe: false,
          trashed: false,
          parentId: 'root',
        },
        pageSize: 1,
        spaces: ['drive'],
      },
    );
    expect(getGFileMetaListMock).toHaveBeenNthCalledWith(
      2,
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          name: 'report.pdf',
          sharedWithMe: false,
          trashed: false,
          parentId: 'folder-id',
        },
        pageSize: 1,
        spaces: ['drive'],
      },
    );
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

  it('rejects createDirectory when the destination already exists', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'existing-folder-id',
          name: 'existing-folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2024-01-02T00:00:00.000Z',
        },
      ],
    });

    await expect(
      provider.createDirectory('/user@example.com/My Drive/existing-folder'),
    ).rejects.toMatchObject({
      code: FileSystemError.FileExists,
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects createDirectory when the parent path resolves to a file', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'parent-file-id',
            name: 'parent.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(
      provider.createDirectory('/user@example.com/My Drive/parent.txt/child'),
    ).rejects.toMatchObject({
      code: FileSystemError.FileNotADirectory,
    });
    expect(createMock).not.toHaveBeenCalled();
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
    expect(getGFileMetaListMock).toHaveBeenNthCalledWith(
      2,
      {
        ACCESS_TOKEN: 'token',
      },
      {
        q: {
          trashed: false,
          sharedWithMe: false,
          parentId: 'dir-id',
        },
        pageSize: 1,
        spaces: ['drive'],
      },
    );
    expect(updateMock).not.toHaveBeenCalled();
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

  it('deletes an empty directory without recursive mode and trashes the entry', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'empty-dir-id',
            name: 'empty-folder',
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
        files: [],
      });

    await provider.delete('/user@example.com/My Drive/empty-folder', false);

    expect(updateMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'empty-dir-id',
      {
        trashed: true,
      },
    );
  });

  it('rejects deleting the root path', async () => {
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
    });

    await expect(provider.delete('/', true)).rejects.toThrow('Cannot delete root');
    expect(updateMock).not.toHaveBeenCalled();
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

  it('rejects moves when the source path cannot change', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock.mockResolvedValue({
      files: [
        {
          id: 'source-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['root'],
          capabilities: {
            canRename: false,
            canTrash: true,
          },
        },
      ],
    });

    await expect(
      provider.move(
        '/user@example.com/My Drive/notes.txt',
        '/user@example.com/My Drive/renamed.txt',
      ),
    ).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects moves when the destination parent is not a directory', async () => {
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
      .mockResolvedValueOnce({ files: [] })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'parent-file-id',
            name: 'parent.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

    await expect(
      provider.move(
        '/user@example.com/My Drive/notes.txt',
        '/user@example.com/My Drive/parent.txt/renamed.txt',
      ),
    ).rejects.toMatchObject({
      code: FileSystemError.FileNotADirectory,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('moves a file into another directory with exact parent updates', async () => {
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
            parents: ['old-parent-id'],
            capabilities: {
              canRename: true,
              canTrash: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'new-parent-id',
            name: 'destination',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
            },
          },
        ],
      });

    await provider.move(
      '/user@example.com/My Drive/notes.txt',
      '/user@example.com/My Drive/destination/renamed.txt',
    );

    expect(updateMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'source-id',
      {
        name: 'renamed.txt',
        addParents: ['new-parent-id'],
        removeParents: ['old-parent-id'],
      },
    );
  });

  it('renames a file inside the same real directory without changing parents', async () => {
    const requestToken = vi.fn(() => Promise.resolve('token'));
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject<string[]>(['user@example.com']),
      requestToken,
    });

    getGFileMetaListMock
      .mockResolvedValueOnce({
        files: [
          {
            id: 'folder-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'source-id',
            name: 'notes.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['folder-id'],
            capabilities: {
              canRename: true,
              canTrash: true,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        files: [
          {
            id: 'folder-id',
            name: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-02T00:00:00.000Z',
            capabilities: {
              canAddChildren: true,
            },
          },
        ],
      });
    getGFileMetaListMock.mockResolvedValueOnce({ files: [] }).mockResolvedValueOnce({
      files: [
        {
          id: 'folder-id',
          name: 'folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          capabilities: {
            canAddChildren: true,
          },
        },
      ],
    });

    await provider.move(
      '/user@example.com/My Drive/folder/notes.txt',
      '/user@example.com/My Drive/folder/renamed.txt',
    );

    expect(updateMock).toHaveBeenCalledWith(
      {
        ACCESS_TOKEN: 'token',
      },
      'source-id',
      {
        name: 'renamed.txt',
        addParents: undefined,
        removeParents: undefined,
      },
    );
  });

  it('stops emitting session update events after the watch unsubscribe runs', async () => {
    const sessions$ = new BehaviorSubject<string[]>([]);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken: vi.fn(),
    });
    const onEvent = vi.fn();

    const unsubscribe = provider.watch(onEvent);

    await Promise.resolve();
    sessions$.next(['first@example.com']);
    expect(onEvent).toHaveBeenCalledTimes(1);

    unsubscribe();
    sessions$.next(['second@example.com']);

    expect(onEvent).toHaveBeenCalledTimes(1);
  });
});
