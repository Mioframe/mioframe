import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystem } from './MemoryFileSystem';
import { VirtualFileSystem } from './VirtualFileSystem';
import { EventEmitter, VfsEventSource, type VfsEvent, VfsEventType } from './EventEmitter';
import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  WriteFileResult,
  WriteOptions,
} from './IFileSystemProvider';
import { FSNodeType } from './IFileSystemProvider';
import { FileSystemError, VfsError } from './VfsError';
import { LockManager } from './LockManager';
import type { VfsActivityState } from './VfsActivityTracker';

describe('VirtualFileSystem', () => {
  let vfs: VirtualFileSystem;
  let memoryFS: MemoryFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
    memoryFS = new MemoryFileSystem();
  });

  const createCapabilityProvider = (
    statResolver: (path: string, stat: FSNodeStat) => FSNodeStat,
  ): IFileSystemProvider => ({
    stat: async (path) => statResolver(path, await memoryFS.stat(path)),
    readFile: (path) => memoryFS.readFile(path),
    writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
    readDirectory: (path) => memoryFS.readDirectory(path),
    createDirectory: (path) => memoryFS.createDirectory(path),
    delete: (path, recursive) => memoryFS.delete(path, recursive),
    move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
  });

  const getActivityState = async (): Promise<VfsActivityState> => firstValueFrom(vfs.activity$);

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

    it('should throw when mounting an empty path', () => {
      expect(() => {
        vfs.mount('', memoryFS);
      }).toThrow('Mount path cannot be empty');
    });

    it('should forward provider watch events with the mount path prefix', () => {
      const memoryFileSystem = new MemoryFileSystem();
      const providerEvents = new EventEmitter();
      const provider: IFileSystemProvider & {
        emitCreate(path: string): void;
      } = {
        emitCreate(path: string) {
          providerEvents.emit({
            source: VfsEventSource.PROVIDER,
            type: VfsEventType.CREATE,
            path,
            nodeType: FSNodeType.File,
          });
        },
        watch: (callback: (event: VfsEvent) => void) => providerEvents.subscribe(callback),
        stat: (path) => memoryFileSystem.stat(path),
        readFile: (path) => memoryFileSystem.readFile(path),
        writeFile: (path: string, content: FileContent, options: WriteOptions) =>
          memoryFileSystem.writeFile(path, content, options),
        readDirectory: (path) => memoryFileSystem.readDirectory(path),
        createDirectory: (path) => memoryFileSystem.createDirectory(path),
        delete: (path, recursive) => memoryFileSystem.delete(path, recursive),
        move: (oldPath, newPath) => memoryFileSystem.move(oldPath, newPath),
      };
      const observedEvents: Array<{
        path: string;
        type: string;
        source: string;
        mountPath?: string | undefined;
        providerPath?: string | undefined;
      }> = [];

      vfs.mount('/mnt/test', provider);
      vfs.watch('/mnt/test', (event) => {
        observedEvents.push({
          path: event.path,
          type: event.type,
          source: event.source,
          mountPath: event.mountPath,
          providerPath: event.providerPath,
        });
      });

      provider.emitCreate('/watched.txt');

      expect(observedEvents).toContainEqual({
        path: '/mnt/test/watched.txt',
        type: 'create',
        source: 'provider',
        mountPath: '/mnt/test',
        providerPath: '/watched.txt',
      });
    });

    it('should remount by unsubscribing the previous provider watcher first', () => {
      const firstEvents = new EventEmitter();
      const secondEvents = new EventEmitter();
      const observedEvents: Array<{ path: string; source: string }> = [];
      const firstProvider: IFileSystemProvider = {
        watch: (callback) => firstEvents.subscribe(callback),
        stat: (path) => memoryFS.stat(path),
        readFile: (path) => memoryFS.readFile(path),
        writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
        readDirectory: (path) => memoryFS.readDirectory(path),
        createDirectory: (path) => memoryFS.createDirectory(path),
        delete: (path, recursive) => memoryFS.delete(path, recursive),
        move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
      };
      const secondProvider: IFileSystemProvider = {
        watch: (callback) => secondEvents.subscribe(callback),
        stat: (path) => memoryFS.stat(path),
        readFile: (path) => memoryFS.readFile(path),
        writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
        readDirectory: (path) => memoryFS.readDirectory(path),
        createDirectory: (path) => memoryFS.createDirectory(path),
        delete: (path, recursive) => memoryFS.delete(path, recursive),
        move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
      };

      vfs.watch('/mnt/test', (event) => {
        observedEvents.push({ path: event.path, source: event.source });
      });

      vfs.mount('/mnt/test', firstProvider);
      vfs.mount('/mnt/test', secondProvider);

      firstEvents.emit({
        source: VfsEventSource.PROVIDER,
        type: VfsEventType.CREATE,
        path: '/stale.txt',
        nodeType: FSNodeType.File,
      });
      secondEvents.emit({
        source: VfsEventSource.PROVIDER,
        type: VfsEventType.CREATE,
        path: '/fresh.txt',
        nodeType: FSNodeType.File,
      });

      expect(observedEvents).toContainEqual({
        path: '/mnt/test/fresh.txt',
        source: 'provider',
      });
      expect(observedEvents).not.toContainEqual({
        path: '/mnt/test/stale.txt',
        source: 'provider',
      });
    });
  });

  describe('watch method', () => {
    it('should require a callback when watching a specific path', () => {
      expect(() => {
        // @ts-expect-error testing runtime validation for missing callback
        vfs.watch('/mnt/test', undefined);
      }).toThrow('Callback is required when watching a path');
    });

    it('should allow subscribing without a target path', async () => {
      const events: Array<{ type: string; path: string }> = [];

      vfs.watch((event) => {
        events.push({ type: event.type, path: event.path });
      });

      vfs.mount('/mnt/test', memoryFS);
      await vfs.createDirectory('/mnt/test/folder');

      expect(events).toContainEqual({
        type: 'mount',
        path: '/mnt/test',
      });
      expect(events).toContainEqual({
        type: 'create',
        path: '/mnt/test/folder',
      });
    });
  });

  describe('activity tracking', () => {
    it('tracks mutating operations', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await vfs.writeFile('/mnt/test/file.txt', 'content');
      expect(await getActivityState()).toMatchObject({ status: 'idle', activeCount: 0 });

      await vfs.createDirectory('/mnt/test/folder');
      expect(await getActivityState()).toMatchObject({ status: 'idle', activeCount: 0 });

      await vfs.move('/mnt/test/file.txt', '/mnt/test/file-renamed.txt');
      expect(await getActivityState()).toMatchObject({ status: 'idle', activeCount: 0 });

      await vfs.delete('/mnt/test/file-renamed.txt');
      expect(await getActivityState()).toMatchObject({ status: 'idle', activeCount: 0 });
    });

    it('does not track read-only operations', async () => {
      vfs.mount('/mnt/test', memoryFS);
      await memoryFS.createDirectory('/folder');
      await memoryFS.writeFile('/folder/file.txt', 'content', { create: true, overwrite: true });

      const states: VfsActivityState[] = [];
      const subscription = vfs.activity$.subscribe((state) => {
        states.push(state);
      });

      await vfs.stat('/mnt/test/folder/file.txt');
      await vfs.readFile('/mnt/test/folder/file.txt');
      await vfs.readDirectory('/mnt/test/folder');
      await vfs.exists('/mnt/test/folder/file.txt');
      await vfs.readText('/mnt/test/folder/file.txt');
      vfs.watch('/mnt/test', () => undefined)();
      vfs.mount('/secondary', new MemoryFileSystem());
      vfs.unmount('/secondary');

      expect(states).toEqual([{ status: 'idle', activeCount: 0, lastError: undefined }]);

      subscription.unsubscribe();
    });

    it('does not create activity for move noop', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const states: VfsActivityState[] = [];
      const subscription = vfs.activity$.subscribe((state) => {
        states.push(state);
      });

      await vfs.move('/mnt/test/file.txt', '/mnt/test/file.txt');

      expect(states).toEqual([{ status: 'idle', activeCount: 0, lastError: undefined }]);

      subscription.unsubscribe();
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

    it('uses writeFile result stat instead of reading provider stat again after a successful write', async () => {
      const writeStat = {
        type: FSNodeType.File,
        size: 7,
      } satisfies FSNodeStat;
      const provider: IFileSystemProvider = {
        stat: (path) => {
          if (path === '/file.txt') {
            return Promise.reject(new Error('post-write stat should not run'));
          }

          return Promise.resolve({
            type: FSNodeType.Directory,
          });
        },
        readFile: () => Promise.resolve(new File(['content'], 'file.txt')),
        writeFile: (): Promise<WriteFileResult> =>
          Promise.resolve({
            stat: writeStat,
          }),
        readDirectory: () => Promise.resolve([]),
        createDirectory: () => Promise.resolve(undefined),
        delete: () => Promise.resolve(undefined),
        move: () => Promise.resolve(undefined),
      };

      vfs.mount('/mnt/test', provider);

      await expect(vfs.writeFile('/mnt/test/file.txt', 'content')).resolves.toBeUndefined();
    });

    it('does not call provider stat before writing and emits write invalidation events', async () => {
      const events: Array<{ type: string; path: string; size?: number | undefined }> = [];
      let statCallCount = 0;
      let writeCallCount = 0;
      const provider: IFileSystemProvider = {
        stat: () => {
          statCallCount += 1;
          return Promise.resolve({
            type: FSNodeType.File,
            size: 7,
          });
        },
        readFile: (path) => memoryFS.readFile(path),
        writeFile: (path, content, options) => {
          writeCallCount += 1;
          return memoryFS.writeFile(path, content, options);
        },
        readDirectory: (path) => memoryFS.readDirectory(path),
        createDirectory: (path) => memoryFS.createDirectory(path),
        delete: (path, recursive) => memoryFS.delete(path, recursive),
        move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
      };

      vfs.mount('/mnt/test', provider);
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path, size: event.size });
      });

      await vfs.writeFile('/mnt/test/file.txt', 'create');
      await vfs.writeFile('/mnt/test/file.txt', 'updated');

      expect(statCallCount).toBe(0);
      expect(writeCallCount).toBe(2);
      expect(events).toEqual([
        {
          type: VfsEventType.WRITE,
          path: '/mnt/test/file.txt',
          size: 6,
        },
        {
          type: VfsEventType.WRITE,
          path: '/mnt/test/file.txt',
          size: 7,
        },
      ]);
    });

    it('tracks write activity completion on failure and does not emit a success event', async () => {
      const events: Array<{ type: string; path: string }> = [];
      const provider: IFileSystemProvider = {
        stat: () =>
          Promise.resolve({
            type: FSNodeType.Directory,
          }),
        readFile: () => Promise.resolve(new File(['content'], 'file.txt')),
        writeFile: () => Promise.reject(new Error('write failed')),
        readDirectory: () => Promise.resolve([]),
        createDirectory: () => Promise.resolve(undefined),
        delete: () => Promise.resolve(undefined),
        move: () => Promise.resolve(undefined),
      };

      vfs.mount('/mnt/test', provider);
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await expect(vfs.writeFile('/mnt/test/file.txt', 'content')).rejects.toThrow('write failed');
      expect(events).toEqual([]);
      expect(await getActivityState()).toMatchObject({
        status: 'error',
        activeCount: 0,
        lastError: {
          operationType: 'writeFile',
          path: '/mnt/test/file.txt',
          message: 'write failed',
          acknowledged: false,
        },
      });
    });
  });

  describe('createFile method', () => {
    it('creates a file that does not exist yet and emits a CREATE event', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.createFile('/mnt/test/newfile.txt', 'new content');

      const content = await vfs.readText('/mnt/test/newfile.txt');
      expect(content).toBe('new content');
      expect(events).toEqual([{ type: VfsEventType.CREATE, path: '/mnt/test/newfile.txt' }]);
    });

    it('rejects with FileExists when a file already exists at the target path', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await vfs.createFile('/mnt/test/file.txt', 'first');

      await expect(vfs.createFile('/mnt/test/file.txt', 'second')).rejects.toMatchObject({
        code: FileSystemError.FileExists,
      });
      await expect(vfs.readText('/mnt/test/file.txt')).resolves.toBe('first');
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

    it('should return file and directory entries with the expected node kinds', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await vfs.createDirectory('/mnt/test/folder');
      await vfs.writeFile('/mnt/test/folder/file.txt', 'content');
      await vfs.createDirectory('/mnt/test/folder/subfolder');

      const entries = await vfs.readDirectory('/mnt/test/folder');

      expect(entries).toHaveLength(2);
      expect(entries.find(([name]) => name === 'file.txt')?.[1].type).toBe(FSNodeType.File);
      expect(entries.find(([name]) => name === 'subfolder')?.[1].type).toBe(FSNodeType.Directory);
    });

    it('should overlay direct mounted child metadata when reading a parent directory', async () => {
      const rootFS = new MemoryFileSystem();
      const mountedFS = new MemoryFileSystem();

      await rootFS.createDirectory('/drive');
      vfs.mount('/', rootFS);
      vfs.mount('/drive', {
        stat: async (path) => {
          if (path === '/') {
            return {
              type: FSNodeType.Directory,
              description: 'Cloud storage from Google Drive',
              capabilities: {
                canDelete: false,
                canChangePath: false,
                canEditChildren: false,
              },
            } satisfies FSNodeStat;
          }

          return mountedFS.stat(path);
        },
        readFile: (path) => mountedFS.readFile(path),
        writeFile: (path, content, options) => mountedFS.writeFile(path, content, options),
        readDirectory: (path) => mountedFS.readDirectory(path),
        createDirectory: (path) => mountedFS.createDirectory(path),
        delete: (path, recursive) => mountedFS.delete(path, recursive),
        move: (oldPath, newPath) => mountedFS.move(oldPath, newPath),
      });

      const entries = await vfs.readDirectory('/');

      expect(entries).toContainEqual([
        'drive',
        expect.objectContaining({
          type: FSNodeType.Directory,
          description: 'Cloud storage from Google Drive',
        }),
      ]);
    });

    it('should replace the parent provider entry when a direct child mount exists', async () => {
      const rootFS = new MemoryFileSystem();
      const mountedFS = new MemoryFileSystem();

      await rootFS.createDirectory('/drive');
      vfs.mount('/', rootFS);
      vfs.mount('/drive', {
        stat: async (path) => {
          if (path === '/') {
            return {
              type: FSNodeType.Directory,
              description: 'Mounted provider description',
              capabilities: {
                canDelete: false,
                canChangePath: false,
                canEditChildren: true,
              },
            } satisfies FSNodeStat;
          }

          return mountedFS.stat(path);
        },
        readFile: (path) => mountedFS.readFile(path),
        writeFile: (path, content, options) => mountedFS.writeFile(path, content, options),
        readDirectory: (path) => mountedFS.readDirectory(path),
        createDirectory: (path) => mountedFS.createDirectory(path),
        delete: (path, recursive) => mountedFS.delete(path, recursive),
        move: (oldPath, newPath) => mountedFS.move(oldPath, newPath),
      });

      const driveEntries = (await vfs.readDirectory('/')).filter(([name]) => name === 'drive');

      expect(driveEntries).toHaveLength(1);
      expect(driveEntries[0]).toEqual([
        'drive',
        expect.objectContaining({
          description: 'Mounted provider description',
          capabilities: expect.objectContaining({
            canEditChildren: true,
          }),
        }),
      ]);
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
      await expect(vfs.delete('/mnt/test/testdir', false)).rejects.toMatchObject({
        code: FileSystemError.DirectoryNotEmpty,
      });
    });

    it('should handle delete with invalid paths gracefully', async () => {
      // Test deletion of non-existent directory structure
      await expect(vfs.delete('/nonexistent/dir')).rejects.toThrow();
    });

    it('should properly handle deleting a file that does not exist', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.delete('/mnt/test/nonexistent.txt')).rejects.toThrow();
    });

    it('attempts provider delete when stat capabilities are undefined', async () => {
      await memoryFS.writeFile('/test.txt', 'content', { create: true, overwrite: true });
      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((_path, stat) => ({ type: stat.type, size: stat.size })),
      );
      await expect(vfs.delete('/mnt/test/test.txt')).resolves.toBeUndefined();
    });

    it('should block deletion when capabilities.canDelete is false', async () => {
      await memoryFS.writeFile('/locked.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((path, stat) =>
          path === '/locked.txt'
            ? {
                ...stat,
                capabilities: {
                  ...stat.capabilities,
                  canDelete: false,
                },
              }
            : stat,
        ),
      );

      await expect(vfs.delete('/mnt/test/locked.txt')).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
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

    it('should rename the directory node itself, not only its children', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await vfs.createDirectory('/mnt/test/A');
      await vfs.writeFile('/mnt/test/A/file.txt', 'content');

      await vfs.move('/mnt/test/A', '/mnt/test/B');

      expect(await vfs.exists('/mnt/test/B/file.txt')).toBe(true);
      expect(await vfs.readText('/mnt/test/B/file.txt')).toBe('content');
      expect(await vfs.exists('/mnt/test/A')).toBe(false);
      await expect(vfs.stat('/mnt/test/B')).resolves.toMatchObject({ type: FSNodeType.Directory });
    });

    it('should reject moves into a destination with a missing parent directory', async () => {
      vfs.mount('/mnt/test', memoryFS);
      await vfs.createDirectory('/mnt/test/src');

      await expect(vfs.move('/mnt/test/src', '/mnt/test/ghost/dest')).rejects.toMatchObject({
        code: FileSystemError.FileNotFound,
      });
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

    it('attempts provider move when source canChangePath capability is undefined', async () => {
      await memoryFS.writeFile('/source.txt', 'content', { create: true, overwrite: true });
      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((path, stat) =>
          path === '/source.txt' ? { ...stat, capabilities: { canChangePath: undefined } } : stat,
        ),
      );
      await expect(vfs.move('/mnt/test/source.txt', '/mnt/test/dest.txt')).resolves.toBeUndefined();
    });

    it('attempts provider move when target parent canEditChildren capability is undefined', async () => {
      await memoryFS.writeFile('/source.txt', 'content', { create: true, overwrite: true });
      await memoryFS.createDirectory('/dest-dir');
      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((path, stat) =>
          path === '/dest-dir' ? { ...stat, capabilities: { canEditChildren: undefined } } : stat,
        ),
      );
      await expect(
        vfs.move('/mnt/test/source.txt', '/mnt/test/dest-dir/source.txt'),
      ).resolves.toBeUndefined();
    });

    it('should block move when source capabilities.canChangePath is false', async () => {
      await memoryFS.writeFile('/source.txt', 'content', {
        overwrite: true,
        create: true,
      });

      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((path, stat) =>
          path === '/source.txt'
            ? {
                ...stat,
                capabilities: {
                  ...stat.capabilities,
                  canChangePath: false,
                },
              }
            : stat,
        ),
      );

      await expect(vfs.move('/mnt/test/source.txt', '/mnt/test/dest.txt')).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
    });

    it('should block move when destination capabilities.canEditChildren is false', async () => {
      await memoryFS.writeFile('/source.txt', 'content', {
        overwrite: true,
        create: true,
      });
      await memoryFS.createDirectory('/locked');

      vfs.mount(
        '/mnt/test',
        createCapabilityProvider((path, stat) =>
          path === '/locked'
            ? {
                ...stat,
                capabilities: {
                  ...stat.capabilities,
                  canEditChildren: false,
                },
              }
            : stat,
        ),
      );

      await expect(
        vfs.move('/mnt/test/source.txt', '/mnt/test/locked/dest.txt'),
      ).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
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

    it('should rethrow non-FileNotFound errors from exists', async () => {
      const provider = createCapabilityProvider((_path, stat) => stat);
      provider.stat = () => Promise.reject(new VfsError(FileSystemError.NoPermissions, 'blocked'));

      vfs.mount('/mnt/test', provider);

      await expect(vfs.exists('/mnt/test/blocked.txt')).rejects.toMatchObject({
        code: FileSystemError.NoPermissions,
      });
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

  describe('checkWriteAccess method', () => {
    it('resolves without calling any mutating provider method when the provider has no check', async () => {
      vfs.mount('/mnt/test', memoryFS);

      await expect(vfs.checkWriteAccess('/mnt/test/some/path')).resolves.toBeUndefined();
    });

    it('delegates to the resolved provider with the relative path', async () => {
      const checkWriteAccess = vi.fn().mockResolvedValue(undefined);
      const provider: IFileSystemProvider = {
        ...createCapabilityProvider((_path, stat) => stat),
        checkWriteAccess,
      };

      vfs.mount('/mnt/test', provider);

      await vfs.checkWriteAccess('/mnt/test/nested/target');

      expect(checkWriteAccess).toHaveBeenCalledWith('/nested/target');
    });

    it('propagates the provider access-recovery rejection without attempting any mutation', async () => {
      const accessError = new VfsError(FileSystemError.NoPermissions, 'Permission required');
      const provider: IFileSystemProvider = {
        ...createCapabilityProvider((_path, stat) => stat),
        checkWriteAccess: () => Promise.reject(accessError),
      };

      vfs.mount('/mnt/test', provider);

      await expect(vfs.checkWriteAccess('/mnt/test/target')).rejects.toBe(accessError);
    });
  });

  describe('lock functionality', () => {
    it('should properly acquire and release locks for concurrent operations', async () => {
      vfs.mount('/mnt/test', memoryFS);

      // Write to a file (this should not throw due to lock management)
      await vfs.writeFile('/mnt/test/file.txt', 'content');
    });

    it('should serialize reads with writes for the same file path', async () => {
      const lockManager = new LockManager();
      vfs = new VirtualFileSystem(lockManager);
      memoryFS = new MemoryFileSystem();
      vfs.mount('/mnt/test', memoryFS);

      const filePath = '/mnt/test/counter.txt';
      await vfs.writeFile(filePath, '0');

      let writeInProgress = false;

      const slowWrite = lockManager.request(filePath, async () => {
        writeInProgress = true;
        await new Promise((resolve) => setTimeout(resolve, 20));
        writeInProgress = false;
        await memoryFS.writeFile('/counter.txt', 'done', {
          create: true,
          overwrite: true,
        });
      });

      const readWhileWriting = (async () => {
        const content = await vfs.readText(filePath);
        expect(writeInProgress).toBe(false);
        return content;
      })();

      await expect(readWhileWriting).resolves.toBe('done');
      await slowWrite;
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
      await expect(vfs.move('/mnt/test/file.txt', '/mnt/test/file.txt')).resolves.toBeUndefined();
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

    it('should resolve to more specific mount point when nested mounts exist', async () => {
      // Setup: root MemoryFileSystem with some content
      const rootFS = new MemoryFileSystem();
      await rootFS.writeFile('/root-file.txt', 'root content', {
        create: true,
        overwrite: true,
      });

      // Setup: separate "OPFS" provider with different content
      const opfsFS = new MemoryFileSystem();
      await opfsFS.writeFile('/opfs-file.txt', 'opfs file', {
        create: true,
        overwrite: true,
      });

      // Mount root first, then OPFS (simulating actual app behavior)
      vfs.mount('/', rootFS);
      vfs.mount('/opfs', opfsFS);

      // Root file should be accessible from root provider
      const rootContent = await vfs.readText('/root-file.txt');
      expect(rootContent).toBe('root content');

      // Files in /opfs/ should resolve to OPFS provider, not root
      const opfsFileContent = await vfs.readText('/opfs/opfs-file.txt');
      expect(opfsFileContent).toBe('opfs file');
    });

    it('should read directory from correct provider when nested mounts exist', async () => {
      // Setup root provider with files
      const rootFS = new MemoryFileSystem();
      await rootFS.createDirectory('/data');
      await rootFS.writeFile('/data/root-file.txt', 'from root', {
        create: true,
        overwrite: true,
      });

      // Setup nested provider (simulating OPFS mount)
      const nestedFS = new MemoryFileSystem();
      await nestedFS.writeFile('/nested-file.txt', 'from nested', {
        create: true,
        overwrite: true,
      });

      // Mount in order: root first, then nested (as app does)
      vfs.mount('/', rootFS);
      vfs.mount('/data', nestedFS);

      // Read directory at /data should return nestedFS contents, not rootFS
      const entries = await vfs.readDirectory('/data');
      const fileNames = entries.map(([name]) => name);

      expect(fileNames).toContain('nested-file.txt');
      expect(fileNames).not.toContain('root-file.txt');
    });
  });

  describe('watch events', () => {
    it('should emit mount event when mounting a provider', () => {
      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      vfs.mount('/mnt/test', memoryFS);

      expect(events).toContainEqual({
        type: 'mount',
        path: '/mnt/test',
      });
    });

    it('should emit unmount event when unmounting a provider', () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      vfs.unmount('/mnt/test');

      expect(events).toContainEqual({
        type: 'unmount',
        path: '/mnt/test',
      });
    });

    it('should emit create event when creating directory', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string; source: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({
          type: event.type,
          path: event.path,
          source: event.source,
        });
      });

      await vfs.createDirectory('/mnt/test/newdir');

      expect(events).toContainEqual({
        type: 'create',
        path: '/mnt/test/newdir',
        source: 'vfs',
      });
    });

    it('should emit write event when writing new file', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.writeFile('/mnt/test/newfile.txt', 'content');

      expect(events).toContainEqual({
        type: 'write',
        path: '/mnt/test/newfile.txt',
      });
    });

    it('should emit write event when writing existing file', async () => {
      // Create file first
      await memoryFS.writeFile('/existing.txt', 'original', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.writeFile('/mnt/test/existing.txt', 'updated');

      expect(events).toContainEqual({
        type: 'write',
        path: '/mnt/test/existing.txt',
      });
    });

    it('should emit delete event when deleting file', async () => {
      // Create file first
      await memoryFS.writeFile('/to-delete.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.delete('/mnt/test/to-delete.txt');

      expect(events).toContainEqual({
        type: 'delete',
        path: '/mnt/test/to-delete.txt',
      });
    });

    it('should emit delete event when deleting directory recursively', async () => {
      // Create directory with contents
      await memoryFS.createDirectory('/dir-to-delete');
      await memoryFS.writeFile('/dir-to-delete/file.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.delete('/mnt/test/dir-to-delete', true);

      // Delete event for directory should be emitted
      const deleteEvents = events.filter((e) => e.type === 'delete');
      expect(deleteEvents).toContainEqual({
        type: 'delete',
        path: '/mnt/test/dir-to-delete',
      });
    });

    it('should emit rename event when moving file within same provider', async () => {
      // Create source file
      await memoryFS.writeFile('/source.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string; newPath?: string | undefined }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({
          type: event.type,
          path: event.path,
          newPath: event.newPath,
        });
      });

      await vfs.move('/mnt/test/source.txt', '/mnt/test/dest.txt');

      expect(events).toContainEqual({
        type: 'rename',
        path: '/mnt/test/source.txt',
        newPath: '/mnt/test/dest.txt',
      });
    });

    it('should emit rename event when moving directory within same provider', async () => {
      // Create source directory with file
      await memoryFS.createDirectory('/sourcedir');
      await memoryFS.writeFile('/sourcedir/file.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string; newPath?: string | undefined }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({
          type: event.type,
          path: event.path,
          newPath: event.newPath,
        });
      });

      await vfs.move('/mnt/test/sourcedir', '/mnt/test/destdir');

      // Should emit rename for both directory and its contents
      const renameEvents = events.filter((e) => e.type === 'rename');
      expect(renameEvents.length).toBeGreaterThanOrEqual(1);
      expect(renameEvents).toContainEqual({
        type: 'rename',
        path: '/mnt/test/sourcedir',
        newPath: '/mnt/test/destdir',
      });
    });

    it('should emit rename event for cross-provider move', async () => {
      const memoryFS1 = new MemoryFileSystem();
      const memoryFS2 = new MemoryFileSystem();

      vfs.mount('/mnt/provider1', memoryFS1);
      vfs.mount('/mnt/provider2', memoryFS2);

      await vfs.writeFile('/mnt/provider1/source.txt', 'content');

      const events: Array<{ type: string; path: string; newPath?: string | undefined }> = [];
      vfs.watch(
        '/mnt',
        (event) => {
          events.push({
            type: event.type,
            path: event.path,
            newPath: event.newPath,
          });
        },
        { recursive: true },
      );

      await vfs.move('/mnt/provider1/source.txt', '/mnt/provider2/dest.txt');

      const renameEvents = events.filter((e) => e.type === 'rename');
      expect(renameEvents).toContainEqual({
        type: 'rename',
        path: '/mnt/provider1/source.txt',
        newPath: '/mnt/provider2/dest.txt',
      });
    });

    it('should emit rename event for cross-provider directory move', async () => {
      const memoryFS1 = new MemoryFileSystem();
      const memoryFS2 = new MemoryFileSystem();

      vfs.mount('/mnt/provider1', memoryFS1);
      vfs.mount('/mnt/provider2', memoryFS2);

      await vfs.createDirectory('/mnt/provider1/sourcedir');
      await vfs.writeFile('/mnt/provider1/sourcedir/file.txt', 'content');

      const events: Array<{ type: string; path: string; newPath?: string | undefined }> = [];
      vfs.watch(
        '/mnt',
        (event) => {
          events.push({
            type: event.type,
            path: event.path,
            newPath: event.newPath,
          });
        },
        { recursive: true },
      );

      await vfs.move('/mnt/provider1/sourcedir', '/mnt/provider2/destdir');

      const renameEvents = events.filter((e) => e.type === 'rename');
      expect(renameEvents.some((e) => e.newPath === '/mnt/provider2/destdir')).toBe(true);
    });

    it('tracks cross-provider directory move only once', async () => {
      const memoryFS1 = new MemoryFileSystem();
      const memoryFS2 = new MemoryFileSystem();

      vfs.mount('/mnt/provider1', memoryFS1);
      vfs.mount('/mnt/provider2', memoryFS2);

      await vfs.createDirectory('/mnt/provider1/sourcedir');
      await vfs.createDirectory('/mnt/provider1/sourcedir/nested');
      await vfs.writeFile('/mnt/provider1/sourcedir/nested/file.txt', 'content');

      const states: VfsActivityState[] = [];
      const subscription = vfs.activity$.subscribe((state) => {
        states.push(state);
      });

      await vfs.move('/mnt/provider1/sourcedir', '/mnt/provider2/destdir');

      expect(states).toEqual([
        { status: 'idle', activeCount: 0, lastError: undefined },
        { status: 'active', activeCount: 1, lastError: undefined },
        { status: 'idle', activeCount: 0, lastError: undefined },
      ]);

      subscription.unsubscribe();
    });

    it('should not duplicate events when using multiple watchers', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events1: Array<{ type: string }> = [];
      const events2: Array<{ type: string }> = [];

      vfs.watch('/mnt/test', (event) => {
        events1.push({ type: event.type });
      });

      vfs.watch('/mnt/test', (event) => {
        events2.push({ type: event.type });
      });

      await vfs.createDirectory('/mnt/test/newdir');

      expect(events1.length).toBe(1);
      expect(events2.length).toBe(1);
    });

    it('should emit write event when overwriting file with same content', async () => {
      await memoryFS.writeFile('/file.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type });
      });

      await vfs.writeFile('/mnt/test/file.txt', 'content');

      expect(events.some((e) => e.type === 'write')).toBe(true);
    });

    it('should emit mount event when remounting provider', () => {
      vfs.mount('/mnt/test', memoryFS);
      vfs.unmount('/mnt/test');

      const events: Array<{ type: string }> = [];
      vfs.watch('/mnt', (event) => {
        events.push({ type: event.type });
      });

      const newMemoryFS = new MemoryFileSystem();
      vfs.mount('/mnt/test', newMemoryFS);

      expect(events).toContainEqual({ type: 'mount' });
    });

    it('should emit events with correct paths for nested operations', async () => {
      vfs.mount('/mnt', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch(
        '/mnt',
        (event) => {
          events.push({ type: event.type, path: event.path });
        },
        { recursive: true },
      );

      await vfs.createDirectory('/mnt/a');
      await vfs.writeFile('/mnt/a/b.txt', 'content');
      await vfs.createDirectory('/mnt/a/c');
      await vfs.writeFile('/mnt/a/c/d.txt', 'content');

      expect(events).toContainEqual({ type: 'create', path: '/mnt/a' });
      expect(events).toContainEqual({ type: 'write', path: '/mnt/a/b.txt' });
      expect(events).toContainEqual({ type: 'create', path: '/mnt/a/c' });
      expect(events).toContainEqual({ type: 'write', path: '/mnt/a/c/d.txt' });
    });

    it('should handle rapid sequential operations', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.writeFile('/mnt/test/file1.txt', 'content');
      await vfs.createDirectory('/mnt/test/dir1');
      await vfs.writeFile('/mnt/test/file2.txt', 'content');
      await vfs.delete('/mnt/test/file1.txt');

      expect(events.some((e) => e.path === '/mnt/test/file1.txt' && e.type === 'write')).toBe(true);
      expect(events.some((e) => e.path === '/mnt/test/dir1' && e.type === 'create')).toBe(true);
      expect(events.some((e) => e.path === '/mnt/test/file2.txt' && e.type === 'write')).toBe(true);
      expect(events.some((e) => e.path === '/mnt/test/file1.txt' && e.type === 'delete')).toBe(
        true,
      );
    });

    it('should emit events with correct paths when watching with recursive option', async () => {
      // Create nested structure
      await memoryFS.createDirectory('/parent');
      await memoryFS.writeFile('/parent/child.txt', 'content', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch(
        '/mnt/test',
        (event) => {
          events.push({ type: event.type, path: event.path });
        },
        { recursive: true },
      );

      await vfs.writeFile('/mnt/test/parent/child2.txt', 'content2');

      // Should capture events in nested directories
      expect(events.some((e) => e.path.includes('child2.txt'))).toBe(true);
    });

    it('should emit events for direct children when not using recursive option', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch(
        '/mnt/test',
        (event) => {
          events.push({ type: event.type, path: event.path });
        },
        { recursive: false },
      );

      // Create direct child
      await vfs.createDirectory('/mnt/test/direct');

      expect(events).toContainEqual({
        type: 'create',
        path: '/mnt/test/direct',
      });
    });

    it('should allow unsubscribing from watch events', async () => {
      vfs.mount('/mnt/test', memoryFS);

      let callCount = 0;
      const unsubscribe = vfs.watch('/mnt/test', () => {
        callCount++;
      });

      await vfs.writeFile('/mnt/test/file1.txt', 'content1');
      expect(callCount).toBe(1);

      unsubscribe();

      await vfs.writeFile('/mnt/test/file2.txt', 'content2');
      expect(callCount).toBe(1); // Should still be 1, not 2
    });

    it('should emit write event for file content changes', async () => {
      // Create file first
      await memoryFS.writeFile('/update-test.txt', 'original', {
        create: true,
        overwrite: true,
      });

      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.writeFile('/mnt/test/update-test.txt', 'new-content');

      expect(events).toContainEqual({
        type: 'write',
        path: '/mnt/test/update-test.txt',
      });
    });

    it('should notify a watcher subscribed to the written file path with a write event', async () => {
      vfs.mount('/mnt/test', memoryFS);

      const events: Array<{ type: string; path: string }> = [];
      vfs.watch('/mnt/test/file.txt', (event) => {
        events.push({ type: event.type, path: event.path });
      });

      await vfs.writeFile('/mnt/test/file.txt', 'content');

      expect(events).toEqual([
        {
          type: 'write',
          path: '/mnt/test/file.txt',
        },
      ]);
    });
  });
});
