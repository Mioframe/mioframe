import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GoogleDriveFileSystem,
  GoogleDriveMount,
} from './GoogleDriveFileSystem';
import { VfsError, FileSystemError } from '../../virtualFileSystem';

vi.mock('../../googleDrive', () => ({
  simplifiedGoogleDriveAPI: {
    list: vi.fn(),
    download: vi.fn(),
    upload: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  SPACE: {
    drive: 'drive',
    appDataFolder: 'appDataFolder',
  },
}));

import { simplifiedGoogleDriveAPI } from '../../googleDrive';

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
) => ({
  id,
  name,
  mimeType,
  size: options?.size,
  createdTime: options?.createdTime,
  modifiedTime: options?.modifiedTime,
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
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should use MyDrive as default mount', () => {
      const fs = new GoogleDriveFileSystem(mockAuth);
      expect(fs).toBeDefined();
    });

    it('should use root as default rootId for MyDrive', () => {
      const fs = new GoogleDriveFileSystem(mockAuth);
      expect(fs).toBeDefined();
    });

    it('should throw error when SpecificFolder without rootId', () => {
      expect(() => {
        new GoogleDriveFileSystem(mockAuth, {
          mount: GoogleDriveMount.SpecificFolder,
        });
      }).toThrow('rootId is required');
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
      expect(stat.type).toBe(2);
      expect(stat.canDelete).toBe(false);
    });

    it('should return Directory for empty string path', async () => {
      const stat = await gdfs.stat('');
      expect(stat.type).toBe(2);
    });

    it('should return File stat for existing file', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [
              GDriveFile('file-id', 'test.txt', 'text/plain', { size: '100' }),
            ],
          },
        }),
      );

      const stat = await gdfs.stat('/test.txt');

      expect(stat.type).toBe(1);
      expect(stat.size).toBe(100);
    });

    it('should return Directory stat for existing folder', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('folder-id', 'test-folder', GOOGLE_MIME_FOLDER)],
          },
        }),
      );

      const stat = await gdfs.stat('/test-folder');

      expect(stat.type).toBe(2);
    });

    it('should throw FileNotFound for non-existent path', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({ result: { files: [] } }),
      );

      await expect(gdfs.stat('/non-existent')).rejects.toThrow(VfsError);
      await expect(gdfs.stat('/non-existent')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });

    it('should return canDelete from capabilities', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [
              GDriveFile('file-id', 'test.txt', 'text/plain', {
                canTrash: false,
              }),
            ],
          },
        }),
      );

      const stat = await gdfs.stat('/test.txt');
      expect(stat.canDelete).toBe(false);
    });
  });

  describe('readFile method', () => {
    it('should download and return File object', async () => {
      const mockFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });

      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
          },
        }),
      );
      vi.mocked(simplifiedGoogleDriveAPI.download).mockResolvedValue(mockFile);

      const file = await gdfs.readFile('/test.txt');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.txt');
      expect(simplifiedGoogleDriveAPI.download).toHaveBeenCalledWith(
        mockAuth,
        'file-id',
        'test.txt',
      );
    });

    it('should throw FileIsADirectory when path is a folder', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('folder-id', 'test-folder', GOOGLE_MIME_FOLDER)],
          },
        }),
      );

      await expect(gdfs.readFile('/test-folder')).rejects.toThrow(VfsError);
      await expect(gdfs.readFile('/test-folder')).rejects.toMatchObject({
        code: FileSystemError.FileIsADirectory,
      });
    });

    it('should throw FileNotFound when file does not exist', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({ result: { files: [] } }),
      );

      await expect(gdfs.readFile('/non-existent.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(gdfs.readFile('/non-existent.txt')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
    });
  });

  describe('writeFile method', () => {
    it('should update existing file when overwrite is true', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
          },
        }),
      );
      const mockUpload = vi.fn().mockResolvedValue({});
      vi.mocked(simplifiedGoogleDriveAPI.upload).mockImplementation(mockUpload);

      await gdfs.writeFile('/test.txt', 'new content', {
        create: false,
        overwrite: true,
      });

      expect(simplifiedGoogleDriveAPI.upload).toHaveBeenCalledWith(
        mockAuth,
        'file-id',
        expect.anything(),
      );
    });

    it('should throw FileExists when file exists and overwrite is false', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('file-id', 'test.txt', 'text/plain')],
          },
        }),
      );

      await expect(
        gdfs.writeFile('/test.txt', 'content', {
          create: true,
          overwrite: false,
        }),
      ).rejects.toThrow(VfsError);
      await expect(
        gdfs.writeFile('/test.txt', 'content', {
          create: true,
          overwrite: false,
        }),
      ).rejects.toMatchObject({ code: FileSystemError.FileExists });
    });

    it('should create new file when it does not exist and create is true', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list)
        .mockReturnValueOnce(Promise.resolve({ result: { files: [] } }))
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [GDriveFile('root-id', 'root', GOOGLE_MIME_FOLDER)],
            },
          }),
        );

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ result: { id: 'new-file-id' } });
      vi.mocked(simplifiedGoogleDriveAPI.create).mockImplementation(mockCreate);
      const mockUpload = vi.fn().mockResolvedValue({});
      vi.mocked(simplifiedGoogleDriveAPI.upload).mockImplementation(mockUpload);

      await gdfs.writeFile('/new-file.txt', 'content', {
        create: true,
        overwrite: false,
      });

      expect(simplifiedGoogleDriveAPI.create).toHaveBeenCalled();
    });

    it('should throw FileNotFound when file does not exist and create is false', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({ result: { files: [] } }),
      );

      await expect(
        gdfs.writeFile('/non-existent.txt', 'content', {
          create: false,
          overwrite: true,
        }),
      ).rejects.toThrow(VfsError);
    });
  });

  describe('readDirectory method', () => {
    it('should return list of files and folders', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [
              GDriveFile('file-id', 'file.txt', 'text/plain', { size: '100' }),
              GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER),
            ],
          },
        }),
      );

      const entries = await gdfs.readDirectory('/');

      expect(entries.length).toBe(2);
      const [firstEntry, secondEntry] = entries;
      expect(firstEntry?.[0]).toBe('file.txt');
      expect(firstEntry?.[1].type).toBe(1);
      expect(secondEntry?.[0]).toBe('folder');
      expect(secondEntry?.[1].type).toBe(2);
    });

    it('should throw FileNotADirectory when path is a file', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('file-id', 'file.txt', 'text/plain')],
          },
        }),
      );

      await expect(gdfs.readDirectory('/file.txt')).rejects.toThrow(VfsError);
      await expect(gdfs.readDirectory('/file.txt')).rejects.toMatchObject({
        code: FileSystemError.FileNotADirectory,
      });
    });

    it('should return empty array for empty directory', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({ result: { files: [] } }),
      );

      const entries = await gdfs.readDirectory('/');
      expect(entries.length).toBe(0);
    });
  });

  describe('createDirectory method', () => {
    it('should create new directory', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list)
        .mockReturnValueOnce(Promise.resolve({ result: { files: [] } }))
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [GDriveFile('root-id', 'root', GOOGLE_MIME_FOLDER)],
            },
          }),
        );
      const mockCreateDir = vi.fn().mockResolvedValue({
        result: { id: 'new-folder-id' },
      });
      vi.mocked(simplifiedGoogleDriveAPI.create).mockImplementation(
        mockCreateDir,
      );

      await gdfs.createDirectory('/new-folder');

      expect(simplifiedGoogleDriveAPI.create).toHaveBeenCalled();
    });

    it('should throw FileExists when directory already exists', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [
              GDriveFile('folder-id', 'existing-folder', GOOGLE_MIME_FOLDER),
            ],
          },
        }),
      );

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

      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({ result: { files: [] } }),
      );

      await expect(sharedFs.createDirectory('/new-folder')).rejects.toThrow(
        VfsError,
      );
      await expect(
        sharedFs.createDirectory('/new-folder'),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });
  });

  describe('delete method', () => {
    it('should delete existing file', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list)
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [
                GDriveFile('file-id', 'file.txt', 'text/plain', {
                  canTrash: true,
                }),
              ],
            },
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [GDriveFile('file-id', 'file.txt', 'text/plain')],
            },
          }),
        );
      const mockDelete = vi.fn().mockResolvedValue({});
      vi.mocked(simplifiedGoogleDriveAPI.update).mockImplementation(mockDelete);

      await gdfs.delete('/file.txt', false);

      expect(simplifiedGoogleDriveAPI.update).toHaveBeenCalledWith(
        mockAuth,
        'file-id',
        { trashed: true },
      );
    });

    it('should throw error when trying to delete root', async () => {
      await expect(gdfs.delete('/', false)).rejects.toThrow(
        'Cannot delete root',
      );
    });

    it('should throw NoPermissions when file cannot be deleted', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [
              GDriveFile('file-id', 'file.txt', 'text/plain', {
                canTrash: false,
              }),
            ],
          },
        }),
      );

      await expect(gdfs.delete('/file.txt', false)).rejects.toThrow(VfsError);
      await expect(gdfs.delete('/file.txt', false)).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should check directory is empty when recursive is false', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list)
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [
                GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER, {
                  canTrash: true,
                }),
              ],
            },
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [GDriveFile('folder-id', 'folder', GOOGLE_MIME_FOLDER)],
            },
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [GDriveFile('file-id', 'file.txt', 'text/plain')],
            },
          }),
        );

      await expect(gdfs.delete('/folder', false)).rejects.toThrow(
        'Directory not empty',
      );
    });
  });

  describe('move method', () => {
    it('should move file to new location', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list)
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [
                GDriveFile('file-id', 'old.txt', 'text/plain', {
                  parents: ['old-parent'],
                  canTrash: true,
                }),
              ],
            },
          }),
        )
        .mockReturnValueOnce(Promise.resolve({ result: { files: [] } }))
        .mockReturnValueOnce(
          Promise.resolve({
            result: {
              files: [
                GDriveFile('new-parent-id', 'new-parent', GOOGLE_MIME_FOLDER),
              ],
            },
          }),
        );
      const mockMove = vi.fn().mockResolvedValue({});
      vi.mocked(simplifiedGoogleDriveAPI.update).mockImplementation(mockMove);

      await gdfs.move('/old.txt', '/new-parent/new.txt');

      expect(simplifiedGoogleDriveAPI.update).toHaveBeenCalledWith(
        mockAuth,
        'file-id',
        {
          name: 'new.txt',
          addParents: ['new-parent-id'],
          removeParents: ['old-parent'],
        },
      );
    });

    it('should do nothing when old and new paths are the same', async () => {
      await gdfs.move('/file.txt', '/file.txt');
      expect(simplifiedGoogleDriveAPI.update).not.toHaveBeenCalled();
    });

    it('should throw FileExists when destination exists', async () => {
      vi.mocked(simplifiedGoogleDriveAPI.list).mockReturnValue(
        Promise.resolve({
          result: {
            files: [GDriveFile('existing-id', 'existing.txt', 'text/plain')],
          },
        }),
      );

      await expect(gdfs.move('/old.txt', '/existing.txt')).rejects.toThrow(
        VfsError,
      );
      await expect(
        gdfs.move('/old.txt', '/existing.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.FileExists,
      });
    });
  });

  describe('watch method', () => {
    it('should return unsubscribe function', () => {
      const unsubscribe = gdfs.watch(() => undefined);
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when subscribed and unsubscribe stops it', () => {
      const callback = vi.fn();
      const unsubscribe = gdfs.watch(callback);

      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });
  });
});
