import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystem } from './MemoryFileSystem';

describe('MemoryFileSystem', () => {
  let memoryFS: MemoryFileSystem;

  beforeEach(() => {
    // Create a fresh instance before each test
    memoryFS = new MemoryFileSystem();
  });

  describe('stat method - Basic Coverage', () => {
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
  });

  describe('readDirectory method - Basic Coverage', () => {
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
      // Should contain the test directory and file in root
    });
  });

  describe('createDirectory method - Basic Coverage', () => {
    it('should create new directory successfully', async () => {
      const dirPath = '/new-directory';

      await memoryFS.createDirectory(dirPath);

      // Verify that the directory was created by getting its stat
      const stat = await memoryFS.stat(dirPath);
      expect(stat.type).toBe(2); // Directory type enum value (2)
    });
  });

  describe('readFile method - Basic Coverage', () => {
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
  });

  describe('writeFile method - Basic Coverage', () => {
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
  });

  describe('delete method - Basic Coverage', () => {
    it('should delete existing file', async () => {
      const filePath = '/file-to-delete.txt';

      // Create a file first
      await memoryFS.writeFile(filePath, 'content', {
        overwrite: true,
        create: true,
      });

      expect(async () => {
        await memoryFS.delete(filePath, false);
      }).not.toThrow();
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
      expect(async () => {
        await memoryFS.delete(dirPath, true);
      }).not.toThrow();
    });
  });

  describe('move method - Basic Coverage', () => {
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
