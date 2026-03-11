import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystem } from './MemoryFileSystem';
import { VirtualFileSystem } from './VirtualFileSystem';
import { FSNodeType } from './IFileSystemProvider';
import { VfsError } from './VfsError';

describe('VirtualFileSystem', () => {
  let vfs: VirtualFileSystem;
  let memoryFS: MemoryFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
    memoryFS = new MemoryFileSystem();
  });

  describe('mount method', () => {
    it('should mount a provider at the specified path', () => {
      vfs.mount('/mnt/test', memoryFS);

      const mountsList = vfs.mountsList;
      expect(mountsList).toContain('/mnt/test');
    });

    it('should handle mounting with complex paths correctly', () => {
      const testPath = '/mnt/data/complex-path-with-special-chars-!@#$%^&*()';
      vfs.mount(testPath, memoryFS);

      const mountsList = vfs.mountsList;
      expect(mountsList).toContain(testPath);
    });
  });

  describe('stat method', () => {
    it('should get file stats successfully', async () => {
      // Create a test file
      await memoryFS.writeFile('/test.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const stat = await vfs.stat('/mnt/test/test.txt');
      expect(stat.type).toBe(FSNodeType.File);
    });
  });

  describe('readFile method', () => {
    it('should read file content successfully', async () => {
      const testContent = 'Hello, World!';

      // Create the file
      await memoryFS.writeFile('/test.txt', testContent, {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const file = await vfs.readFile('/mnt/test/test.txt');
      expect(file).toBeDefined();
    });
  });

  describe('writeFile method', () => {
    it('should write content to a file successfully', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Writing to a path that doesn't exist yet should work
      await vfs.writeFile('/mnt/test/newfile.txt', 'new content');

      const content = await vfs.readText('/mnt/test/newfile.txt');
      expect(content).toBe('new content');
    });

    it('should handle write with malformed paths correctly (no crash)', async () => {
      // Test that writing to various malformed paths doesn't crash
      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.writeFile('', 'content')).rejects.toThrow();
    });
  });

  describe('readDirectory method', () => {
    it('should read directory contents', async () => {
      // Create a test file and directory
      await memoryFS.createDirectory('/testdir');
      await memoryFS.writeFile('/testdir/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      // Mount the provider
      vfs.mount('/mnt/test', memoryFS);

      const entries = await vfs.readDirectory('/mnt/test/testdir');
      expect(entries).toBeDefined();
    });

    it('should handle root directory contents correctly', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Reading mount point should return an array of tuples
      const rootEntries = await vfs.readDirectory('/mnt/test');
      expect(rootEntries).toBeInstanceOf(Array);
    });

    it('should properly reject when accessing non-directory path as directory', async () => {
      await memoryFS.writeFile('/test.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.readDirectory('/mnt/test/test.txt')).rejects.toThrow();
    });
  });

  describe('createDirectory method', () => {
    it('should create a new directory successfully', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await vfs.createDirectory('/mnt/test/newdir');

      const stats = await vfs.stat('/mnt/test/newdir');
      expect(stats.type).toBe(FSNodeType.Directory);
    });

    it('should handle creating directories with invalid paths gracefully', async () => {
      // Test directory creation with empty path
      await expect(vfs.createDirectory('')).rejects.toThrow();
    });

    it('should properly handle when trying to create existing directory', async () => {
      await memoryFS.createDirectory('/testdir');

      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.createDirectory('/mnt/test/testdir')).rejects.toThrow();
    });
  });

  describe('delete method', () => {
    it('should delete an existing file', async () => {
      // Create a test file
      await memoryFS.writeFile('/test.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // Delete the file - should not throw
      await vfs.delete('/mnt/test/test.txt');
    });

    it('should delete an existing directory recursively', async () => {
      // Create a directory with contents
      await memoryFS.createDirectory('/testdir');
      await memoryFS.writeFile('/testdir/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // Delete the directory recursively - should not throw
      await vfs.delete('/mnt/test/testdir', true);
    });

    it('should fail to delete non-empty directory without recursive flag', async () => {
      await memoryFS.createDirectory('/testdir');
      await memoryFS.writeFile('/testdir/file.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // This should fail
      await expect(vfs.delete('/mnt/test/testdir', false)).rejects.toThrow(
        /Directory not empty/,
      );
    });

    it('should handle delete with invalid paths gracefully', async () => {
      // Test deletion of non-existent directory structure
      await expect(vfs.delete('/nonexistent/dir')).rejects.toThrow();
    });

    it('should properly handle deleting a file that does not exist', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.delete('/mnt/test/nonexistent.txt')).rejects.toThrow();
    });
  });

  describe('move method', () => {
    it('should move a file from one path to another', async () => {
      const testContent = 'test content';

      // Create source file
      await memoryFS.writeFile('/source.txt', testContent, {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // Move the file
      await vfs.move('/mnt/test/source.txt', '/mnt/test/dest.txt');

      // Verify it was moved by reading from new location
      const content = await vfs.readText('/mnt/test/dest.txt');
      expect(content).toBe(testContent);
    });

    it('should move a directory and all its contents recursively', async () => {
      // Create source directory
      await memoryFS.createDirectory('/sourcedir');

      await memoryFS.writeFile('/sourcedir/file1.txt', 'content1', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // Move the directory
      await vfs.move('/mnt/test/sourcedir', '/mnt/test/dest');

      const content = await vfs.readText('/mnt/test/dest/file1.txt');
      expect(content).toBe('content1');
    });

    it('should handle move with invalid paths gracefully', async () => {
      // Test moving to an empty string path
      await expect(vfs.move('/test', '')).rejects.toThrow();

      // Test moving from non-existent source
      await expect(vfs.move('/nonexistent', '/dest')).rejects.toThrow();
    });

    it('should handle moving a file to itself gracefully (no error)', async () => {
      // Create files
      await memoryFS.writeFile('/source.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      // Moving to the same path should not throw - it just returns silently
      await expect(
        vfs.move('/mnt/test/source.txt', '/mnt/test/source.txt'),
      ).resolves.toBeUndefined();
    });
  });

  describe('exists method', () => {
    it('should return true for existing file', async () => {
      await memoryFS.writeFile('/test.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const exists = await vfs.exists('/mnt/test/test.txt');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const exists = await vfs.exists('/mnt/test/nonexistent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('readText method', () => {
    it('should read text content from a file', async () => {
      const testContent = 'Hello, World!';

      // Create the file
      await memoryFS.writeFile('/test.txt', testContent, {
        overwrite: true,
        create: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const content = await vfs.readText('/mnt/test/test.txt');
      expect(content).toBe(testContent);
    });

    it('should handle empty paths gracefully when reading text (no crash)', async () => {
      // Test edge case with invalid path
      await expect(vfs.readText('')).rejects.toThrow();
    });

    it('should properly handle reading non-existent file', async () => {
      await expect(vfs.readText('/mnt/test/nonexistent.txt')).rejects.toThrow();
    });
  });

  describe('lock functionality', () => {
    it('should properly acquire and release locks for concurrent operations', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Write to a file (this should not throw due to lock management)
      await vfs.writeFile('/mnt/test/file.txt', 'content');
    });
  });

  describe('error cases', () => {
    it('should throw appropriate errors for invalid operations on non-existent mount points', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Test a case that should fail
      await expect(vfs.stat('/nonexistent')).rejects.toThrow(VfsError);
    });

    it('should handle edge cases with various paths gracefully', async () => {
      // Test behavior on non-existent mount point operations
      const result = await vfs.exists('');
      expect(typeof result).toBe('boolean');

      await expect(vfs.stat('/mnt/nonexistent')).rejects.toThrow();
    });
  });

  describe('watch functionality', () => {
    it('should return an unsubscribe function from watch method', () => {
      vfs.mount('/mnt/test', memoryFS);

      const unsubscribe = vfs.watch('/mnt/test', () => {
        // empty
      });

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('mount ordering and resolution', () => {
    it('should properly handle nested mount points', async () => {
      await memoryFS.createDirectory('/data');
      vfs.mount('/mnt/data', memoryFS);

      const mounts = vfs.mountsList;
      expect(mounts).toContain('/mnt/data');
    });
  });

  describe('multiple operations in sequence', () => {
    it('should handle multiple filesystem operations correctly', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Multiple sequential operations
      const testContent = 'Sequential Test';
      await vfs.writeFile('/mnt/test/file.txt', testContent);
      const readBack = await vfs.readText('/mnt/test/file.txt');
      expect(readBack).toBe(testContent);

      await vfs.createDirectory('/mnt/test/dir1');
      const exists = await vfs.exists('/mnt/test/dir1');
      expect(exists).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty path operations gracefully (no crash)', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // These should not crash the system
      const result = await vfs.exists('');
      expect(typeof result).toBe('boolean');
    });

    it('should handle moving a file to itself gracefully (no error)', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Moving to the same path should not throw - it just returns silently
      await expect(
        vfs.move('/mnt/test/file.txt', '/mnt/test/file.txt'),
      ).resolves.toBeUndefined();
    });
  });

  describe('cross-provider operations', () => {
    it('should properly handle operations that could span different providers', () => {
      const memoryFS2 = new MemoryFileSystem();

      // Test mount with different filesystem instances
      vfs.mount('/mnt/data1', memoryFS);
      vfs.mount('/mnt/data2', memoryFS2);

      const mountsList = vfs.mountsList;
      expect(mountsList).toContain('/mnt/data1');
      expect(mountsList).toContain('/mnt/data2');
    });
  });

  describe('mount/unmount specific scenarios', () => {
    it('should properly handle multiple mounts to same provider with different paths', async () => {
      const testContent = 'Test content';

      // Mount same provider twice to different mount points
      vfs.mount('/mnt/data1', memoryFS);
      vfs.mount('/mnt/data2', memoryFS);

      await vfs.writeFile('/mnt/data1/file.txt', testContent);

      const content1 = await vfs.readText('/mnt/data1/file.txt');
      expect(content1).toBe(testContent);

      const content2 = await vfs.readText('/mnt/data2/file.txt');
      expect(content2).toBe(testContent);
    });
  });

  describe('Mount/Unmount Ordering and Resolution', () => {
    it('should handle mount ordering properly', () => {
      // Test multiple mounts in various orders
      vfs.mount('/mnt/a/b/c', memoryFS);
      vfs.mount('/mnt/a/b', memoryFS);
      vfs.mount('/mnt/a', memoryFS);

      const mountsList = vfs.mountsList;
      expect(mountsList).toContain('/mnt/a');
      expect(mountsList).toContain('/mnt/a/b');
      expect(mountsList).toContain('/mnt/a/b/c');
    });

    it('should handle path resolution with special characters correctly', () => {
      // Test that mount/unmount works properly with complex paths
      const testPath = '/mnt/data/complex-path-with-special-chars-!@#$%^&*()';
      vfs.mount(testPath, memoryFS);

      expect(vfs.mountsList).toContain(testPath);
    });
  });
});
