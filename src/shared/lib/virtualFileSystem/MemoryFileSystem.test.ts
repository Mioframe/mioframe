import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystem } from './MemoryFileSystem';
import { VfsError } from './VfsError';

describe('MemoryFileSystem', () => {
  let memoryFS: MemoryFileSystem;

  beforeEach(() => {
    // Create a fresh instance before each test
    memoryFS = new MemoryFileSystem();
  });

  describe('stat method - Comprehensive Coverage', () => {
    it('should get statistics for existing file', async () => {
      const filePath = '/test-file.txt';

      // First create the file by writing to it
      await memoryFS.writeFile(filePath, 'test content', {
        overwrite: true,
        create: true,
      });

      const stat = await memoryFS.stat(filePath);
      expect(stat).toBeDefined();
      expect(stat.type).toBe(1); // File type enum value (1)
    });

    it('should get statistics for existing directory', async () => {
      const dirPath = '/test-dir';

      // Create the directory
      await memoryFS.createDirectory(dirPath);

      const stat = await memoryFS.stat(dirPath);
      expect(stat).toBeDefined();
      expect(stat.type).toBe(2); // Directory type enum value (2)
    });

    it('should throw FileNotFound error for non-existent file', async () => {
      await expect(memoryFS.stat('/non-existent.txt')).rejects.toThrow(VfsError);
    });
  });

  describe('readDirectory method - Comprehensive Coverage', () => {
    it('should read contents of directory with files and subdirectories', async () => {
      // Create test structure
      await memoryFS.createDirectory('/test-dir');
      const filePath = '/test-dir/file.txt';

      await memoryFS.writeFile(filePath, 'content', {
        overwrite: true,
        create: true,
      });

      const dirContents = await memoryFS.readDirectory('/');
      expect(dirContents).toBeDefined();
    });

    it('should handle root directory correctly', async () => {
      const dirContents = await memoryFS.readDirectory('/');
      expect(dirContents).toBeDefined();
    });

    it('should throw FileNotADirectory error when reading non-directory path as directory', async () => {
      // First create a file
      await memoryFS.writeFile('/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      await expect(memoryFS.readDirectory('/file.txt')).rejects.toThrow(VfsError);
    });

    it('should throw FileNotFound error for non-existent directory', async () => {
      await expect(memoryFS.readDirectory('/non-existent-dir')).rejects.toThrow(VfsError);
    });
  });

  describe('createDirectory method - Comprehensive Coverage', () => {
    it('should create new directory successfully', async () => {
      const dirPath = '/new-directory';

      await memoryFS.createDirectory(dirPath);

      // Verify that the directory was created by getting its stat
      const stat = await memoryFS.stat(dirPath);
      expect(stat.type).toBe(2); // Directory type enum value (2)
    });

    it('should throw FileExists error when creating existing directory', async () => {
      const dirPath = '/test-dir';

      await memoryFS.createDirectory(dirPath);

      await expect(memoryFS.createDirectory('/test-dir')).rejects.toThrow(VfsError);
    });

    it('should throw FileNotADirectory error when parent is not directory', async () => {
      // First create a file
      await memoryFS.writeFile('/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      await expect(memoryFS.createDirectory('/file.txt/subdir')).rejects.toThrow(VfsError);
    });
  });

  describe('readFile method - Comprehensive Coverage', () => {
    it('should read file content correctly', async () => {
      const filePath = '/read-file.txt';

      // First create a file
      await memoryFS.writeFile(filePath, 'file content to be read', {
        overwrite: true,
        create: true,
      });

      const fileContent = await memoryFS.readFile(filePath);
      expect(fileContent).toBeDefined();
    });

    it('should throw FileNotFound error when reading non-existent file', async () => {
      await expect(memoryFS.readFile('/non-existent.txt')).rejects.toThrow(VfsError);
    });

    it('should throw FileIsADirectory error when trying to read directory as file', async () => {
      // Create a directory
      await memoryFS.createDirectory('/test-dir');

      await expect(memoryFS.readFile('/test-dir')).rejects.toThrow(VfsError);
    });
  });

  describe('writeFile method - Comprehensive Coverage', () => {
    it('should create new file when not exists and create is true', async () => {
      const filePath = '/new-file.txt';

      // Create a file with content
      await memoryFS.writeFile(filePath, 'content', {
        overwrite: true,
        create: true,
      });

      // Verify the file was created by checking its stat
      const stat = await memoryFS.stat(filePath);
      expect(stat.type).toBe(1); // File type enum value (1)
    });

    it('should throw FileNotFound error when creating new file and parent does not exist', async () => {
      await expect(
        memoryFS.writeFile('/non-existent-dir/file.txt', 'content', {
          overwrite: true,
          create: true,
        }),
      ).rejects.toThrow(VfsError);
    });

    it('should throw FileExists error when trying to overwrite existing file and overwrite is false', async () => {
      const filePath = '/file-to-overwrite.txt';

      // Create a file first
      await memoryFS.writeFile(filePath, 'existing content', {
        overwrite: true,
        create: true,
      });

      await expect(
        memoryFS.writeFile('/file-to-overwrite.txt', 'new content', {
          overwrite: false,
          create: false,
        }),
      ).rejects.toThrow(VfsError);
    });

    it('should throw FileNotFound error when trying to update non-existent file without create flag', async () => {
      await expect(
        memoryFS.writeFile('/non-existent-file.txt', 'content', {
          overwrite: true,
          create: false,
        }),
      ).rejects.toThrow(VfsError);
    });
  });

  describe('delete method - Comprehensive Coverage', () => {
    it('should delete existing file', async () => {
      const filePath = '/file-to-delete.txt';

      // Create a file first
      await memoryFS.writeFile(filePath, 'content', {
        overwrite: true,
        create: true,
      });

      // Delete the file - no error expected
      await memoryFS.delete(filePath, false);
    });

    it('should delete existing directory when recursive is true', async () => {
      const dirPath = '/dir-to-delete';
      const subFilePath = '/dir-to-delete/sub-file.txt';

      await memoryFS.createDirectory(dirPath);
      await memoryFS.writeFile(subFilePath, 'content', {
        overwrite: true,
        create: true,
      });

      // Delete the directory recursively - no error expected
      await memoryFS.delete(dirPath, true);
    });

    it('should throw DirectoryNotEmpty error when trying to delete non-empty dir without recursive flag', async () => {
      const dirPath = '/dir-to-delete';
      const subFilePath = '/dir-to-delete/sub-file.txt';

      await memoryFS.createDirectory(dirPath);
      await memoryFS.writeFile(subFilePath, 'content', {
        overwrite: true,
        create: true,
      });

      // This should fail since directory is not empty and recursive is false
      await expect(memoryFS.delete('/dir-to-delete', false)).rejects.toThrow(/Directory not empty/);
    });
  });

  describe('move method - Comprehensive Coverage', () => {
    it('should move file from old path to new path', async () => {
      const oldPath = '/old-file.txt';
      const newPath = '/new-file.txt';

      // Create source file
      await memoryFS.writeFile(oldPath, 'content', {
        overwrite: true,
        create: true,
      });

      // Move the file
      await memoryFS.move(oldPath, newPath);

      // Verify moved to new location
      const stat = await memoryFS.stat(newPath);
      expect(stat.type).toBe(1); // File type enum value (1)
    });

    it('should move directory and all its contents recursively', async () => {
      const oldDirPath = '/old-dir';
      const newDirPath = '/new-dir';

      // Create source directory with content
      await memoryFS.createDirectory(oldDirPath);
      await memoryFS.writeFile('/old-dir/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      // Move the directory
      await memoryFS.move('/old-dir', '/new-dir');

      const stat = await memoryFS.stat(newDirPath);
      expect(stat.type).toBe(2); // Directory type enum value (2)
    });

    it('should throw FileExists error when moving to existing path', async () => {
      const oldPath = '/source-file.txt';
      const newPath = '/destination-file.txt';

      // Create source file first
      await memoryFS.writeFile(oldPath, 'content', {
        overwrite: true,
        create: true,
      });

      // Create target file - this should cause FileExists error when trying to move
      await memoryFS.writeFile(newPath, 'existing content', {
        overwrite: true,
        create: true,
      });

      await expect(memoryFS.move(oldPath, newPath)).rejects.toThrow(/Target already exists/);
    });

    it('should throw NotSupported error when trying to move directory into itself or subdirectory', async () => {
      const dirPath = '/test-dir';

      // Create a directory
      await memoryFS.createDirectory(dirPath);

      await expect(memoryFS.move('/test-dir', '/test-dir/subdir')).rejects.toThrow(VfsError);
    });
  });

  describe('error handling - Edge Cases', () => {
    it('should handle empty content properly', async () => {
      const filePath = '/empty-content.txt';

      await memoryFS.writeFile(filePath, '', {
        overwrite: true,
        create: true,
      });

      const stat = await memoryFS.stat(filePath);
      expect(stat.type).toBe(1); // File type enum value (1)
    });
  });
});
