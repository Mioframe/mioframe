import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from '@shared/lib/googleDriveFileSystemProvider';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';

const getRecordListMock = vi.fn();
const updateRecordListMock = vi.fn();
const { createMock, downloadMock, getGFileMetaListMock, updateMock, uploadMock } = vi.hoisted(
  () => ({
    createMock: vi.fn(),
    downloadMock: vi.fn(),
    getGFileMetaListMock: vi.fn(),
    updateMock: vi.fn(),
    uploadMock: vi.fn(),
  }),
);

vi.mock('./setupFileSystemDirectoryHandleService', () => ({
  useFileSystemDirectoryHandleService: () => ({
    getRecordList: getRecordListMock,
    updateRecordList: updateRecordListMock,
  }),
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

describe('Google Drive directory refresh integration', () => {
  beforeEach(() => {
    vi.resetModules();
    getRecordListMock.mockReset();
    updateRecordListMock.mockReset();
    createMock.mockReset();
    downloadMock.mockReset();
    getGFileMetaListMock.mockReset();
    updateMock.mockReset();
    uploadMock.mockReset();
    getRecordListMock.mockResolvedValue([]);
    updateRecordListMock.mockResolvedValue(undefined);
  });

  it('re-reads a mounted App Data directory through useFileSystemService after createDirectory', async () => {
    const { useFileSystemService } = await import('./useFileSystemService');
    const service = useFileSystemService();
    const provider = googleDriveFileSystemProvider({
      $sessions: new BehaviorSubject(['user@example.com']),
      requestToken: vi.fn(() => Promise.resolve('token')),
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
      .mockResolvedValueOnce({ files: [newFolderMeta] })
      .mockResolvedValueOnce({ files: [newFolderMeta] });
    createMock.mockResolvedValue({
      result: {
        id: 'new-folder-id',
      },
    });

    await service.createDirectory('/Google Drive');
    service.vfs.mount('/Google Drive', provider);

    const emissions: [string, { type: FSNodeType }][][] = [];
    const subscription = service
      .directoryContent$({
        path: '/Google Drive/user@example.com/App Data',
      })
      .subscribe((value) => {
        if (!(value instanceof Error)) {
          emissions.push(value.map(([name, stat]) => [name, { type: stat.type }]));
        }
      });

    await vi.waitFor(() => {
      expect(getGFileMetaListMock).toHaveBeenCalledTimes(1);
      expect(emissions).toEqual([[]]);
    });

    await service.createDirectory('/Google Drive/user@example.com/App Data/new-folder');

    await vi.waitFor(() => {
      expect(getGFileMetaListMock).toHaveBeenCalledTimes(2);
    });

    expect(emissions).toEqual([[]]);

    const refreshed = await service.vfs.readDirectory('/Google Drive/user@example.com/App Data');

    expect(getGFileMetaListMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(refreshed).toEqual([
      [
        'new-folder',
        expect.objectContaining({
          type: FSNodeType.Directory,
        }),
      ],
    ]);

    subscription.unsubscribe();
  });
});
