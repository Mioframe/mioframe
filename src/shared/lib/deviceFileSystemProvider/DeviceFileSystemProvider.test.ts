import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../virtualFileSystem/MemoryFileSystem';
import { FileSystemError, FSNodeType, VirtualFileSystem, VfsError } from '../virtualFileSystem';
import {
  type MountedDeviceFileRecord,
  type DeviceFileSystemProvider as DeviceFileSystemProviderType,
  DeviceFileSystemProvider,
} from './DeviceFileSystemProvider';

const createHandle = (name: string): FileSystemDirectoryHandle => {
  const handle: FileSystemDirectoryHandle = {
    kind: 'directory',
    name,
    isFile: false,
    isDirectory: true,
    isSameEntry: (otherHandle) => Promise.resolve(Object.is(otherHandle, handle)),
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
      createProvider: ({ handle }) => {
        const fileSystem = fileSystems.get(handle);

        if (!fileSystem) {
          throw new Error(`Missing file system for ${handle.name}`);
        }

        return fileSystem;
      },
    });
  });

  const mountRecord = (name: string, description?: string) => {
    const handle = createHandle(name);
    const fileSystem = new MemoryFileSystem();
    const record = {
      name,
      kind: name === 'Browser Storage' ? 'browserStorage' : 'localDirectory',
      handle,
      ...(description === undefined ? {} : { description }),
    } satisfies MountedDeviceFileRecord;

    fileSystems.set(handle, fileSystem);
    provider.upsertRecord(record);

    return {
      fileSystem,
      handle,
      record,
    };
  };

  it('should list mounted device file roots at root', async () => {
    mountRecord('Browser Storage');
    mountRecord('Projects');

    const entries = await provider.readDirectory('/');

    expect(entries.map(([name]) => name)).toEqual(['Browser Storage', 'Projects']);
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

  it('should expose safe display records without handles', () => {
    mountRecord('Browser Storage');
    mountRecord('Projects');

    expect(provider.listDisplayRecords()).toEqual([
      {
        canDisconnect: false,
        name: 'Browser Storage',
      },
      {
        canDisconnect: true,
        name: 'Projects',
      },
    ]);
    expect(JSON.stringify(provider.listDisplayRecords())).not.toContain('isSameEntry');
  });

  it('should expose root directory capabilities and description exactly', async () => {
    mountRecord('Projects', 'Directory on this device');

    await expect(provider.stat('/')).resolves.toEqual({
      type: FSNodeType.Directory,
      description: 'Directories from this device and browser storage',
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: false,
      },
    });
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

  it('should return the nested provider write result', async () => {
    mountRecord('Projects');

    await expect(
      provider.writeFile('/Projects/note.txt', 'hello', {
        create: true,
        overwrite: true,
      }),
    ).resolves.toMatchObject({
      stat: {
        type: FSNodeType.File,
        size: 5,
      },
    });
  });

  it('should support cross-mounted moves for nested paths', async () => {
    const { fileSystem: sourceFileSystem } = mountRecord('Projects');
    const { fileSystem: targetFileSystem } = mountRecord('Browser Storage');

    await sourceFileSystem.writeFile('/source.txt', 'payload', {
      create: true,
      overwrite: true,
    });

    await provider.move('/Projects/source.txt', '/Browser Storage/dest.txt');

    await expect(sourceFileSystem.stat('/source.txt')).rejects.toBeInstanceOf(VfsError);
    expect(await (await targetFileSystem.readFile('/dest.txt')).text()).toBe('payload');
  });

  it('should expose mounted roots as non-deletable directories with editable contents', async () => {
    mountRecord('Projects', 'Directory on this device');

    const stat = await provider.stat('/Projects');

    expect(stat).toEqual(
      expect.objectContaining({
        description: 'Directory on this device',
        type: FSNodeType.Directory,
        capabilities: expect.objectContaining({
          canDelete: false,
          canChangePath: false,
          canEditChildren: true,
        }),
      }),
    );
  });

  it('should include mounted root descriptions when reading the provider root', async () => {
    mountRecord('Projects', 'Directory on this device');

    await expect(provider.readDirectory('/')).resolves.toContainEqual([
      'Projects',
      expect.objectContaining({
        description: 'Directory on this device',
        type: FSNodeType.Directory,
      }),
    ]);
  });

  it('should prevent direct-root mutations', async () => {
    mountRecord('Projects');

    await expect(provider.readFile('/')).rejects.toMatchObject({
      code: FileSystemError.FileIsADirectory,
    });
    await expect(provider.readFile('/Projects')).rejects.toMatchObject({
      code: FileSystemError.FileIsADirectory,
    });
    await expect(provider.createDirectory('/Another')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
    await expect(provider.delete('/', false)).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
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
    await expect(provider.move('/Projects/file.txt', '/Another')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
    await expect(provider.move('/Projects', '/Another/file.txt')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
  });

  it('should reject missing mounted roots for root-level stat and nested writes', async () => {
    await expect(provider.stat('/Missing')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
    await expect(
      provider.writeFile('/Missing/file.txt', 'payload', {
        create: true,
        overwrite: true,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
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

  it('should reuse the existing provider for the same mounted name and handle without emitting create twice', async () => {
    const localProvider = DeviceFileSystemProvider({
      createProvider: ({ handle }) => {
        const fileSystem = fileSystems.get(handle);

        if (!fileSystem) {
          throw new Error(`Missing file system for ${handle.name}`);
        }

        return fileSystem;
      },
    });
    const handle = createHandle('Projects');
    const fileSystem = new MemoryFileSystem();
    const events: Array<{ path: string; type: string }> = [];

    fileSystems.set(handle, fileSystem);
    localProvider.watch((event) => {
      events.push({ path: event.path, type: event.type });
    });

    localProvider.upsertRecord({
      name: 'Projects',
      description: 'Directory on this device',
      kind: 'localDirectory',
      handle,
    });
    await localProvider.writeFile('/Projects/first.txt', 'first', {
      create: true,
      overwrite: true,
    });

    localProvider.upsertRecord({
      name: 'Projects',
      description: 'Directory on this device',
      kind: 'localDirectory',
      handle,
    });
    await localProvider.writeFile('/Projects/second.txt', 'second', {
      create: true,
      overwrite: true,
    });

    expect(
      events.filter((event) => event.type === 'create' && event.path === '/Projects'),
    ).toHaveLength(1);
    await expect(localProvider.readDirectory('/Projects')).resolves.toEqual(
      expect.arrayContaining([
        ['first.txt', expect.objectContaining({ type: FSNodeType.File })],
        ['second.txt', expect.objectContaining({ type: FSNodeType.File })],
      ]),
    );
  });

  it('forwards nested provider events through the global watch subscription without a path argument', async () => {
    const innerFileSystem = new MemoryFileSystem();
    const localProvider = DeviceFileSystemProvider({
      createProvider: () => innerFileSystem,
    });
    const events: Array<{ path: string; type: string }> = [];

    localProvider.watch((event) => {
      events.push({ path: event.path, type: event.type });
    });

    localProvider.upsertRecord({
      name: 'Projects',
      kind: 'localDirectory',
      handle: createHandle('Projects'),
    });

    await localProvider.createDirectory('/Projects/sub-folder');

    expect(events).toContainEqual({ path: '/Projects', type: 'create' });
    expect(events).toContainEqual({ path: '/Projects/sub-folder', type: 'create' });
  });
});
