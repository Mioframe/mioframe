import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../virtualFileSystem/MemoryFileSystem';
import {
  FileSystemError,
  FSNodeType,
  VirtualFileSystem,
  VfsError,
} from '../virtualFileSystem';
import {
  type DeviceFileRecord,
  type DeviceFileSystemProvider as DeviceFileSystemProviderType,
  DeviceFileSystemProvider,
} from './DeviceFileSystemProvider';

const createHandle = (name: string): FileSystemDirectoryHandle => {
  const handle: FileSystemDirectoryHandle = {
    kind: 'directory',
    name,
    isFile: false,
    isDirectory: true,
    isSameEntry: (otherHandle) =>
      Promise.resolve(Object.is(otherHandle, handle)),
    queryPermission: () => Promise.resolve('granted'),
    requestPermission: () => Promise.resolve('granted'),
    entries: () =>
      (async function* () {
        await Promise.resolve();
        yield* [];
      })(),
    keys: () =>
      (async function* () {
        await Promise.resolve();
        yield* [];
      })(),
    values: () =>
      (async function* () {
        await Promise.resolve();
        yield* [];
      })(),
    [Symbol.asyncIterator]() {
      return this.entries();
    },
    getDirectoryHandle: (_name, _options) => {
      void _name;
      void _options;
      return Promise.reject(new Error('Method not implemented.'));
    },
    getFileHandle: (_name, _options) => {
      void _name;
      void _options;
      return Promise.reject(new Error('Method not implemented.'));
    },
    removeEntry: (_name, _options) => {
      void _name;
      void _options;
      return Promise.reject(new Error('Method not implemented.'));
    },
    resolve: (_possibleDescendant) => {
      void _possibleDescendant;
      return Promise.reject(new Error('Method not implemented.'));
    },
    getFile(fileName, options) {
      return this.getFileHandle(fileName, options);
    },
    getDirectory(directoryName, options) {
      return this.getDirectoryHandle(directoryName, options);
    },
    getEntries() {
      return this.values();
    },
  };

  return handle;
};

describe('DeviceFileSystemProvider', () => {
  let provider: DeviceFileSystemProviderType;
  let fileSystems: Map<FileSystemDirectoryHandle, MemoryFileSystem>;

  beforeEach(() => {
    fileSystems = new Map();
    provider = DeviceFileSystemProvider({
      createProvider: (handle) => {
        const fileSystem = fileSystems.get(handle);

        if (!fileSystem) {
          throw new Error(`Missing file system for ${handle.name}`);
        }

        return fileSystem;
      },
    });
  });

  const mountRecord = (name: string) => {
    const handle = createHandle(name);
    const fileSystem = new MemoryFileSystem();
    const record = {
      name,
      handle,
    } satisfies DeviceFileRecord;

    fileSystems.set(handle, fileSystem);
    provider.upsertRecord(record);

    return {
      fileSystem,
      handle,
      record,
    };
  };

  it('should list mounted device file roots at root', async () => {
    mountRecord('Origin private file system');
    mountRecord('Projects');

    const entries = await provider.readDirectory('/');

    expect(entries.map(([name]) => name)).toEqual([
      'Origin private file system',
      'Projects',
    ]);
    expect(
      entries.every(([, stat]) => {
        const { capabilities } = stat;

        return (
          capabilities !== undefined &&
          capabilities.canDelete === false &&
          capabilities.canChangePath === false &&
          capabilities.canEditChildren === true
        );
      }),
    ).toBe(true);
  });

  it('should route nested file operations to the correct mounted root', async () => {
    const { fileSystem } = mountRecord('Projects');

    await provider.writeFile('/Projects/note.txt', 'hello', {
      create: true,
      overwrite: true,
    });

    expect(await provider.readDirectory('/Projects')).toEqual([
      [
        'note.txt',
        expect.objectContaining({
          type: FSNodeType.File,
        }),
      ],
    ]);
    expect(await (await fileSystem.readFile('/note.txt')).text()).toBe('hello');
  });

  it('should support cross-mounted moves for nested paths', async () => {
    const { fileSystem: sourceFileSystem } = mountRecord('Projects');
    const { fileSystem: targetFileSystem } = mountRecord(
      'Origin private file system',
    );

    await sourceFileSystem.writeFile('/source.txt', 'payload', {
      create: true,
      overwrite: true,
    });

    await provider.move(
      '/Projects/source.txt',
      '/Origin private file system/dest.txt',
    );

    await expect(sourceFileSystem.stat('/source.txt')).rejects.toBeInstanceOf(
      VfsError,
    );
    expect(await (await targetFileSystem.readFile('/dest.txt')).text()).toBe(
      'payload',
    );
  });

  it('should expose mounted roots as non-deletable directories with editable contents', async () => {
    mountRecord('Projects');

    const stat = await provider.stat('/Projects');

    expect(stat).toEqual(
      expect.objectContaining({
        type: FSNodeType.Directory,
        capabilities: expect.objectContaining({
          canDelete: false,
          canChangePath: false,
          canEditChildren: true,
        }),
      }),
    );
  });

  it('should prevent direct-root mutations', async () => {
    mountRecord('Projects');

    await expect(provider.createDirectory('/Another')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
    await expect(
      provider.writeFile('/Projects', 'payload', {
        create: true,
        overwrite: true,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
    await expect(provider.move('/Projects', '/Another')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
  });

  it('should rely on VFS delete semantics for mounted roots', async () => {
    const vfs = new VirtualFileSystem();

    mountRecord('Projects');
    vfs.mount('/device', provider);

    await expect(vfs.delete('/device/Projects')).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
  });

  it('should emit root events when mounted roots change', () => {
    const events: Array<{ path: string; type: string; source: string }> = [];

    provider.watch((event) => {
      events.push({
        path: event.path,
        type: event.type,
        source: event.source,
      });
    });

    mountRecord('Projects');
    provider.removeRecord('Projects');

    expect(events).toContainEqual({
      path: '/Projects',
      type: 'create',
      source: 'provider',
    });
    expect(events).toContainEqual({
      path: '/Projects',
      type: 'delete',
      source: 'provider',
    });
  });
});
