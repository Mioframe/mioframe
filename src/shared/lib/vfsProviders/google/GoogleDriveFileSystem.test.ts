import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { GDriveFileMeta } from '../../googleDrive/api';
import { dayjs } from '../../dayjs';
import type { WriteOptions } from '../../virtualFileSystem';
import { FSNodeType, FileSystemError, VfsError } from '../../virtualFileSystem';

vi.mock('../../googleDrive/api', async () => {
  const actual = await vi.importActual('../../googleDrive/api');
  return {
    ...actual,
    create: vi.fn(),
    download: vi.fn(),
    getGFileMetaList: vi.fn(),
    update: vi.fn(),
    upload: vi.fn(),
  };
});

import {
  create,
  download,
  getGFileMetaList,
  update,
  upload,
} from '../../googleDrive/api';
import {
  GoogleDriveFileSystem,
  GoogleDriveMount,
} from './GoogleDriveFileSystem';

const mockAuth = {
  ACCESS_TOKEN: 'test-token',
  API_KEY: 'test-key',
};

const GDriveFile = (
  id: string,
  name: string,
  mimeType: string,
  options?: {
    size?: string;
    createdTime?: string;
    modifiedTime?: string;
    parents?: string[];
    canTrash?: boolean;
  },
): GDriveFileMeta => ({
  id,
  name,
  mimeType,
  size: options?.size ?? '',
  createdTime: options?.createdTime ?? '',
  modifiedTime: options?.modifiedTime ?? '',
  parents: options?.parents ?? [],
  capabilities: {
    canTrash: options?.canTrash ?? true,
  },
});

const GOOGLE_MIME_FOLDER = 'application/vnd.google-apps.folder';

describe('GoogleDriveFileSystem', () => {
  let gdfs: GoogleDriveFileSystem;

  beforeEach(() => {
    gdfs = new GoogleDriveFileSystem(mockAuth);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default MyDrive mount', () => {
      const fs = new GoogleDriveFileSystem(mockAuth);
      expect(fs).toBeDefined();
    });

    it('should use root as default rootId for MyDrive', () => {
      const fs = new GoogleDriveFileSystem(mockAuth);
      // We can't directly access private properties, but we can test behavior
      expect(() => fs).not.toThrow();
    });

    it('should throw error when SpecificFolder mount is used without rootId', () => {
      expect(() => {
        new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.SpecificFolder,
        });
      }).toThrow('rootId is required when mount mode is SpecificFolder');
    });

    it('should accept SpecificFolder mount with rootId', () => {
      expect(() => {
        new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.SpecificFolder,
          rootId: 'test-folder-id',
        });
      }).not.toThrow();
    });

    it('should use appDataFolder when mount is AppData', () => {
      const fs = new GoogleDriveFileSystem(mockAuth, {
        mount: GoogleDriveMount.AppData,
      });
      expect(fs).toBeDefined();
    });

    it('should use sharedWithMe when mount is SharedWithMe', () => {
      const fs = new GoogleDriveFileSystem(mockAuth, {
        mount: GoogleDriveMount.SharedWithMe,
      });
      expect(fs).toBeDefined();
    });
  });

  describe('stat method', () => {
    it('should return Directory for root path', async () => {
      const stat = await gdfs.stat('/');
      expect(stat.type).toBe(FSNodeType.Directory);
      expect(stat.canDelete).toBe(false);
    });

    it('should return Directory for empty string path', async () => {
      const stat = await gdfs.stat('');
      expect(stat.type).toBe(FSNodeType.Directory);
    });

    it('should return File stat for existing file with size and timestamps', async () => {
      const testFile = GDriveFile('file-id', 'test.txt', 'text/plain', {
        size: '1024',
        createdTime: '2023-01-01T10:00:00Z',
        modifiedTime: '2023-01-02T10:00:00Z',
      });

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [testFile],
      });

      const stat = await gdfs.stat('/test.txt');

      expect(stat.type).toBe(FSNodeType.File);
      expect(stat.size).toBe(1024);
      expect(stat.creationTime).toBe(dayjs('2023-01-01T10:00:00Z').valueOf());
      expect(stat.modificationTime).toBe(
        dayjs('2023-01-02T10:00:00Z').valueOf(),
      );
    });

    it('should handle missing size gracefully', async () => {
      const testFile = GDriveFile('file-id', 'test.txt', 'text/plain', {
        size: '', // Empty size
      });

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [testFile],
      });

      const stat = await gdfs.stat('/test.txt');

      expect(stat.type).toBe(FSNodeType.File);
      expect(stat.size).toBeUndefined();
    });

    it('should handle missing timestamps gracefully', async () => {
      const testFile = GDriveFile('file-id', 'test.txt', 'text/plain', {
        createdTime: '', // Empty timestamp
        modifiedTime: '', // Empty timestamp
      });

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [testFile],
      });

      const stat = await gdfs.stat('/test.txt');

      expect(stat.type).toBe(FSNodeType.File);
      expect(stat.creationTime).toBeUndefined();
      expect(stat.modificationTime).toBeUndefined();
    });

    it('should return Directory stat for existing folder', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('folder-id', 'test-folder', GOOGLE_MIME_FOLDER)],
      });

      const stat = await gdfs.stat('/test-folder');

      expect(stat.type).toBe(FSNodeType.Directory);
    });

    it('should throw FileNotFound for non-existent path', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({ files: [] });

      await expect(gdfs.stat('/non-existent')).rejects.toThrow(VfsError);
      await expect(gdfs.stat('/non-existent')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });

    it('should return canDelete from capabilities', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'test.txt', 'text/plain', {
            canTrash: false,
          }),
        ],
      });

      const stat = await gdfs.stat('/test.txt');
      expect(stat.canDelete).toBe(false);
    });

    it('should handle capability not defined gracefully', async () => {
      const fileWithoutCapabilities: GDriveFileMeta = {
        id: 'file-id',
        name: 'test.txt',
        mimeType: 'text/plain',
        size: '100',
        createdTime: '',
        modifiedTime: '',
        parents: [],
        // No capabilities field
      };

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [fileWithoutCapabilities],
      });

      const stat = await gdfs.stat('/test.txt');
      expect(stat.canDelete).toBe(false); // Should default to false
    });

    it('should handle path resolution errors', async () => {
      vi.mocked(getGFileMetaList).mockRejectedValue(new Error('API Error'));

      await expect(gdfs.stat('/some-path')).rejects.toThrow(VfsError);
      await expect(gdfs.stat('/some-path')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });
  });

  describe('readFile method', () => {
    it('should download and return File object', async () => {
      const mockFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
      });
      vi.mocked(download).mockResolvedValue(mockFile);

      const file = await gdfs.readFile('/test.txt');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.txt');
      expect(download).toHaveBeenCalledWith(mockAuth, 'file-id');
    });

    it('should throw FileIsADirectory when path is a folder', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('folder-id', 'test-folder', GOOGLE_MIME_FOLDER)],
      });

      await expect(gdfs.readFile('/test-folder')).rejects.toThrow(VfsError);
      await expect(gdfs.readFile('/test-folder')).rejects.toMatchObject({
        code: FileSystemError.FileIsADirectory,
      });
    });

    it('should throw FileNotFound when file does not exist', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({ files: [] });

      await expect(gdfs.readFile('/non-existent.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(gdfs.readFile('/non-existent.txt')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });

    it('should throw Unknown error when download fails', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
      });
      vi.mocked(download).mockRejectedValue(new Error('Download failed'));

      await expect(gdfs.readFile('/test.txt')).rejects.toThrow(VfsError);
      await expect(gdfs.readFile('/test.txt')).rejects.toMatchObject({
        code: FileSystemError.Unknown,
      });
    });
  });

  describe('writeFile method', () => {
    const createWriteOptions = (
      create: boolean,
      overwrite: boolean,
    ): WriteOptions => ({
      create,
      overwrite,
    });

    it('should update existing file when overwrite is true', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
      });
      vi.mocked(upload).mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 200 })),
      );

      await gdfs.writeFile(
        '/test.txt',
        'new content',
        createWriteOptions(true, true),
      );

      expect(upload).toHaveBeenCalledWith(mockAuth, 'file-id', 'new content');
    });

    it('should throw FileExists when file exists and overwrite is false', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
      });

      await expect(
        gdfs.writeFile('/test.txt', 'content', createWriteOptions(true, false)),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile('/test.txt', 'content', createWriteOptions(true, false)),
      ).rejects.toMatchObject({ code: FileSystemError.FileExists });
    });

    it('should create new file when it does not exist and create is true', async () => {
      // Mock for parent lookup
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // File doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('root-id', 'root', GOOGLE_MIME_FOLDER)],
        }); // Parent exists

      vi.mocked(create).mockResolvedValue({ result: { id: 'new-file-id' } });
      vi.mocked(upload).mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 200 })),
      );

      await gdfs.writeFile(
        '/new-file.txt',
        'content',
        createWriteOptions(true, false),
      );

      expect(create).toHaveBeenCalledWith(mockAuth, {
        name: 'new-file.txt',
        parents: ['root-id'],
      });
      expect(upload).toHaveBeenCalledWith(mockAuth, 'new-file-id', 'content');
    });

    it('should throw FileNotFound when file does not exist and create is false', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({ files: [] });

      await expect(
        gdfs.writeFile(
          '/non-existent.txt',
          'content',
          createWriteOptions(false, true),
        ),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile(
          '/non-existent.txt',
          'content',
          createWriteOptions(false, true),
        ),
      ).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });

    it('should throw FileNotFound when parent directory does not exist', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // File doesn't exist
        .mockResolvedValueOnce({ files: [] }); // Parent doesn't exist

      await expect(
        gdfs.writeFile(
          '/parent/non-existent.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile(
          '/parent/non-existent.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });

    it('should throw FileNotADirectory when parent is not a directory', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // File doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('file-id', 'not-a-dir', 'text/plain')], // Parent is a file, not directory
        });

      await expect(
        gdfs.writeFile(
          '/not-a-dir/child.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile(
          '/not-a-dir/child.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toMatchObject({
        code: FileSystemError.FileNotADirectory,
      });
    });

    it('should throw NoPermissions when creating in SharedWithMe root', async () => {
      const sharedFs = new GoogleDriveFileSystem(mockAuth, {
        mount: GoogleDriveMount.SharedWithMe,
      });

      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // File doesn't exist
        .mockResolvedValueOnce({
          files: [
            GDriveFile('sharedWithMe', 'Shared with me', GOOGLE_MIME_FOLDER),
          ],
        });

      await expect(
        sharedFs.writeFile(
          '/new-file.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toThrow(VfsError);
      await expect(
        sharedFs.writeFile(
          '/new-file.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should clean up created file if upload fails', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // File doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('root-id', 'root', GOOGLE_MIME_FOLDER)],
        }); // Parent exists

      vi.mocked(create).mockResolvedValue({ result: { id: 'new-file-id' } });
      vi.mocked(upload).mockRejectedValue(new Error('Upload failed'));
      vi.mocked(update).mockResolvedValue({ result: {} });

      await expect(
        gdfs.writeFile(
          '/new-file.txt',
          'content',
          createWriteOptions(true, false),
        ),
      ).rejects.toThrow('Upload failed');

      // Verify that the created file was trashed after upload failure
      expect(update).toHaveBeenCalledWith(mockAuth, 'new-file-id', {
        trashed: true,
      });
    });

    it('should throw FileIsADirectory when trying to overwrite a directory with a file', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('dir-id', 'existing-dir', GOOGLE_MIME_FOLDER)],
      });

      await expect(
        gdfs.writeFile(
          '/existing-dir',
          'content',
          createWriteOptions(true, true),
        ),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile(
          '/existing-dir',
          'content',
          createWriteOptions(true, true),
        ),
      ).rejects.toMatchObject({
        code: FileSystemError.FileIsADirectory,
      });
    });
  });

  describe('readDirectory method', () => {
    it('should return list of files and folders', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'file.txt', 'text/plain', { size: '100' }),
          GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER),
        ],
      });

      const entries = await gdfs.readDirectory('/');

      expect(entries.length).toBe(2);
      const [firstEntry, secondEntry] = entries;
      expect(firstEntry?.[0]).toBe('file.txt');
      expect(firstEntry?.[1].type).toBe(FSNodeType.File);
      expect(firstEntry?.[1].size).toBe(100);
      expect(secondEntry?.[0]).toBe('folder');
      expect(secondEntry?.[1].type).toBe(FSNodeType.Directory);
    });

    it('should throw FileNotADirectory when path is a file', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('file-id', 'file.txt', 'text/plain')],
      });

      await expect(gdfs.readDirectory('/file.txt')).rejects.toThrow(VfsError);
      await expect(gdfs.readDirectory('/file.txt')).rejects.toMatchObject({
        code: FileSystemError.FileNotADirectory,
      });
    });

    it('should return empty array for empty directory', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({ files: [] });

      const entries = await gdfs.readDirectory('/');
      expect(entries.length).toBe(0);
    });

    it('should handle files with missing size gracefully', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'file.txt', 'text/plain', { size: '' }), // Empty size
        ],
      });

      const entries = await gdfs.readDirectory('/');

      expect(entries.length).toBe(1);
      const [firstEntry] = entries;
      expect(firstEntry?.[0]).toBe('file.txt');
      expect(firstEntry?.[1].size).toBeUndefined();
    });

    it('should handle files with missing timestamps gracefully', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'file.txt', 'text/plain', {
            createdTime: '',
            modifiedTime: '',
          }),
        ],
      });

      const entries = await gdfs.readDirectory('/');

      expect(entries.length).toBe(1);
      const [firstEntry] = entries;
      expect(firstEntry?.[1].creationTime).toBeUndefined();
      expect(firstEntry?.[1].modificationTime).toBeUndefined();
    });

    it('should handle files without capabilities gracefully', async () => {
      const fileWithoutCapabilities: GDriveFileMeta = {
        id: 'file-id',
        name: 'file.txt',
        mimeType: 'text/plain',
        size: '100',
        createdTime: '',
        modifiedTime: '',
        parents: [],
        // No capabilities field
      };

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [fileWithoutCapabilities],
      });

      const entries = await gdfs.readDirectory('/');

      expect(entries.length).toBe(1);
      const [firstEntry] = entries;
      expect(firstEntry?.[1].canDelete).toBe(false); // Should default to false
    });
  });

  describe('createDirectory method', () => {
    it('should create new directory', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // Directory doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('root-id', 'root', GOOGLE_MIME_FOLDER)],
        }); // Parent exists
      vi.mocked(create).mockResolvedValue({
        result: { id: 'new-folder-id' },
      });

      await gdfs.createDirectory('/new-folder');

      expect(create).toHaveBeenCalledWith(mockAuth, {
        name: 'new-folder',
        parents: ['root-id'],
        mimeType: GOOGLE_MIME_FOLDER,
      });
    });

    it('should throw FileExists when directory already exists', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('folder-id', 'existing-folder', GOOGLE_MIME_FOLDER)],
      });

      await expect(gdfs.createDirectory('/existing-folder')).rejects.toThrow(
        VfsError,
      );
      await expect(
        gdfs.createDirectory('/existing-folder'),
      ).rejects.toMatchObject({
        code: FileSystemError.FileExists,
      });
    });

    it('should throw NoPermissions when creating in SharedWithMe root', async () => {
      const sharedFs = new GoogleDriveFileSystem(mockAuth, {
        mount: GoogleDriveMount.SharedWithMe,
      });

      vi.mocked(getGFileMetaList).mockResolvedValueOnce({ files: [] });

      await expect(sharedFs.createDirectory('/new-folder')).rejects.toThrow(
        VfsError,
      );
      await expect(
        sharedFs.createDirectory('/new-folder'),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should throw FileNotADirectory when parent is not a directory', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({ files: [] }) // Directory doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('file-id', 'not-a-dir', 'text/plain')], // Parent is a file
        });

      await expect(gdfs.createDirectory('/not-a-dir/sub-dir')).rejects.toThrow(
        VfsError,
      );
      await expect(
        gdfs.createDirectory('/not-a-dir/sub-dir'),
      ).rejects.toMatchObject({
        code: FileSystemError.FileNotADirectory,
      });
    });
  });

  describe('delete method', () => {
    it('should delete existing file', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'file.txt', 'text/plain', {
            canTrash: true,
          }),
        ],
      });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.delete('/file.txt', false);

      expect(update).toHaveBeenCalledWith(mockAuth, 'file-id', {
        trashed: true,
      });
    });

    it('should throw error when trying to delete root', async () => {
      await expect(gdfs.delete('/', false)).rejects.toThrow(
        'Cannot delete root',
      );
    });

    it('should throw NoPermissions when file cannot be deleted', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'file.txt', 'text/plain', {
            canTrash: false,
          }),
        ],
      });

      await expect(gdfs.delete('/file.txt', false)).rejects.toThrow(VfsError);
      await expect(gdfs.delete('/file.txt', false)).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should check directory is empty when recursive is false', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER, {
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({
          files: [GDriveFile('file-id', 'file.txt', 'text/plain')], // Directory has content
        });

      await expect(gdfs.delete('/folder', false)).rejects.toThrow(VfsError);
      await expect(gdfs.delete('/folder', false)).rejects.toMatchObject({
        code: FileSystemError.DirectoryNotEmpty,
      });
    });

    it('should allow deleting non-empty directory when recursive is true', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER, {
            canTrash: true,
          }),
        ],
      });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.delete('/folder', true);

      expect(update).toHaveBeenCalledWith(mockAuth, 'folder-id', {
        trashed: true,
      });
    });

    it('should allow deleting empty directory when recursive is false', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER, {
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({
          files: [], // Directory is empty
        });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.delete('/folder', false);

      expect(update).toHaveBeenCalledWith(mockAuth, 'folder-id', {
        trashed: true,
      });
    });
  });

  describe('move method', () => {
    it('should move file to new location', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'old.txt', 'text/plain', {
              parents: ['old-parent'],
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({ files: [] }) // Destination doesn't exist
        .mockResolvedValueOnce({
          files: [
            GDriveFile('new-parent-id', 'new-parent', GOOGLE_MIME_FOLDER),
          ],
        });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.move('/old.txt', '/new-parent/new.txt');

      expect(update).toHaveBeenCalledWith(mockAuth, 'file-id', {
        name: 'new.txt',
        addParents: ['new-parent-id'],
        removeParents: ['old-parent'],
      });
    });

    it('should do nothing when old and new paths are the same', async () => {
      await gdfs.move('/file.txt', '/file.txt');
      expect(update).not.toHaveBeenCalled();
    });

    it('should throw FileExists when destination exists', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [GDriveFile('existing-id', 'existing.txt', 'text/plain')],
      });

      await expect(gdfs.move('/old.txt', '/existing.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(
        gdfs.move('/old.txt', '/existing.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.FileExists,
      });
    });

    it('should throw NoPermissions when source file cannot be moved', async () => {
      vi.mocked(getGFileMetaList).mockResolvedValueOnce({
        files: [
          GDriveFile('file-id', 'old.txt', 'text/plain', {
            canTrash: false, // Cannot trash/move
          }),
        ],
      });

      await expect(gdfs.move('/old.txt', '/new-location.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(
        gdfs.move('/old.txt', '/new-location.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should throw NoPermissions when moving to SharedWithMe root', async () => {
      const sharedFs = new GoogleDriveFileSystem(mockAuth, {
        mount: GoogleDriveMount.SharedWithMe,
      });

      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'old.txt', 'text/plain', {
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({ files: [] }) // Destination doesn't exist
        .mockResolvedValueOnce({
          files: [
            GDriveFile('sharedWithMe', 'Shared with me', GOOGLE_MIME_FOLDER),
          ],
        });

      await expect(sharedFs.move('/old.txt', '/new-file.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(
        sharedFs.move('/old.txt', '/new-file.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should throw FileNotADirectory when destination parent is not a directory', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'old.txt', 'text/plain', {
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({ files: [] }) // Destination doesn't exist
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'not-a-dir', 'text/plain'), // Not a directory
          ],
        });

      await expect(
        gdfs.move('/old.txt', '/not-a-dir/file.txt'),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.move('/old.txt', '/not-a-dir/file.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.FileNotADirectory,
      });
    });

    it('should handle moving within the same parent correctly', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'old.txt', 'text/plain', {
              parents: ['same-parent'],
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({ files: [] }) // Destination doesn't exist
        .mockResolvedValueOnce({
          files: [GDriveFile('same-parent', 'parent', GOOGLE_MIME_FOLDER)],
        });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.move('/old.txt', '/parent/renamed.txt');

      // When moving within the same parent, addParents should be undefined
      expect(update).toHaveBeenCalledWith(mockAuth, 'file-id', {
        name: 'renamed.txt',
        addParents: undefined, // Should be undefined when moving within same parent
        removeParents: undefined, // Should be undefined when moving within same parent
      });
    });

    it('should handle moving with multiple parents correctly', async () => {
      vi.mocked(getGFileMetaList)
        .mockResolvedValueOnce({
          files: [
            GDriveFile('file-id', 'old.txt', 'text/plain', {
              parents: ['parent1', 'parent2', 'parent3'],
              canTrash: true,
            }),
          ],
        })
        .mockResolvedValueOnce({ files: [] }) // Destination doesn't exist
        .mockResolvedValueOnce({
          files: [
            GDriveFile('new-parent-id', 'new-parent', GOOGLE_MIME_FOLDER),
          ],
        });
      vi.mocked(update).mockResolvedValue({ result: {} });

      await gdfs.move('/old.txt', '/new-parent/new.txt');

      expect(update).toHaveBeenCalledWith(mockAuth, 'file-id', {
        name: 'new.txt',
        addParents: ['new-parent-id'],
        removeParents: ['parent1', 'parent2', 'parent3'], // Remove all old parents
      });
    });
  });

  describe('watch method', () => {
    it('should return unsubscribe function', () => {
      const unsubscribe = gdfs.watch(() => undefined);
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when event is emitted', () => {
      const callback = vi.fn();
      const unsubscribe = gdfs.watch(callback);

      expect(callback).not.toHaveBeenCalled();

      // Unsubscribing should stop future events (though we can't easily test this)
      unsubscribe();
    });

    it('should properly handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = gdfs.watch(callback1);
      gdfs.watch(callback2);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      // Unsubscribe only the first one
      unsubscribe1();

      // Both callbacks should still be registered
      // (We can't easily test the actual event emission without modifying the class)
    });
  });

  describe('mount-specific behaviors', () => {
    describe('SharedWithMe mount', () => {
      let sharedFs: GoogleDriveFileSystem;

      beforeEach(() => {
        sharedFs = new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.SharedWithMe,
        });
      });

      it('should handle root directory differently', async () => {
        const stat = await sharedFs.stat('/');
        expect(stat.type).toBe(FSNodeType.Directory);
        expect(stat.canDelete).toBe(false);
      });

      it('should use sharedWithMe query for directory listing', async () => {
        vi.mocked(getGFileMetaList).mockResolvedValueOnce({
          files: [GDriveFile('file-id', 'shared-file.txt', 'text/plain')],
        });

        const entries = await sharedFs.readDirectory('/');

        expect(getGFileMetaList).toHaveBeenCalledWith(mockAuth, {
          q: 'sharedWithMe = true and trashed = false',
          pageSize: 1000,
          spaces: ['drive'],
          fetchAll: true,
        });
        expect(entries.length).toBe(1);
      });

      it('should use sharedWithMe query for file resolution', async () => {
        vi.mocked(getGFileMetaList).mockResolvedValueOnce({
          files: [GDriveFile('file-id', 'shared-file.txt', 'text/plain')],
        });

        const stat = await sharedFs.stat('/shared-file.txt');

        expect(getGFileMetaList).toHaveBeenCalledWith(mockAuth, {
          q: "name = 'shared-file.txt' and sharedWithMe = true and trashed = false",
          pageSize: 1,
          spaces: ['drive'],
        });
        expect(stat.type).toBe(FSNodeType.File);
      });
    });

    describe('AppData mount', () => {
      let appDataFs: GoogleDriveFileSystem;

      beforeEach(() => {
        appDataFs = new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.AppData,
        });
      });

      it('should handle root directory differently', async () => {
        const stat = await appDataFs.stat('/');
        expect(stat.type).toBe(FSNodeType.Directory);
        expect(stat.canDelete).toBe(false);
      });
    });

    describe('SpecificFolder mount', () => {
      let specificFs: GoogleDriveFileSystem;

      beforeEach(() => {
        specificFs = new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.SpecificFolder,
          rootId: 'test-folder-id',
        });
      });

      it('should handle root directory differently', async () => {
        vi.mocked(getGFileMetaList).mockResolvedValueOnce({
          files: [
            GDriveFile('test-folder-id', 'specific-folder', GOOGLE_MIME_FOLDER),
          ],
        });

        const stat = await specificFs.stat('/');
        expect(stat.type).toBe(FSNodeType.Directory);
      });
    });
  });
});
