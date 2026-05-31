import { describe, expect, it, vi } from 'vitest';
import { FSNodeType } from '../virtualFileSystem';
import { WebFileSystemProvider } from './WebFileSystemProvider';
import { WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE, WebFileSystemAccessRequiredError } from '.';

type MockRootDirectoryHandle = FileSystemDirectoryHandle & {
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

const createRootHandle = (permissionState: PermissionState = 'granted') => {
  const writable: FileSystemWritableFileStream = {
    locked: false,
    abort: () => Promise.resolve(),
    close: vi.fn(() => Promise.resolve(undefined)),
    getWriter: () => new WritableStream().getWriter(),
    seek: () => Promise.resolve(undefined),
    truncate: () => Promise.resolve(undefined),
    write: vi.fn(() => Promise.resolve(undefined)),
  };
  const file = new File(['hello'], 'note.txt', {
    lastModified: 123,
  });
  const fileHandle: FileSystemFileHandle = {
    kind: 'file',
    name: 'note.txt',
    isSameEntry: () => Promise.resolve(true),
    queryPermission: () => Promise.resolve(permissionState),
    requestPermission: () => Promise.resolve(permissionState),
    createWritable: () => Promise.resolve(writable),
    getFile: () => Promise.resolve(file),
    createSyncAccessHandle: () => Promise.reject(new Error('Method not implemented.')),
    isFile: true,
    isDirectory: false,
  };
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));
  const rootHandle: MockRootDirectoryHandle = {
    kind: 'directory',
    name: '',
    isSameEntry: () => Promise.resolve(true),
    queryPermission: vi.fn(() => Promise.resolve(permissionState)),
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    entries: () =>
      (async function* () {
        await Promise.resolve();
        const entry: [string, FileSystemFileHandle] = ['note.txt', fileHandle];
        yield entry;
      })(),
    keys: () =>
      (async function* () {
        await Promise.resolve();
        yield 'note.txt';
      })(),
    values: () =>
      (async function* () {
        await Promise.resolve();
        yield fileHandle;
      })(),
    [Symbol.asyncIterator]() {
      return rootHandle.entries();
    },
    getDirectoryHandle: () => Promise.resolve(rootHandle),
    getFileHandle: () => Promise.resolve(fileHandle),
    removeEntry: () => Promise.resolve(undefined),
    resolve: () => Promise.resolve([]),
    isFile: false,
    isDirectory: true,
    getFile: (
      fileName: string,
      options?: FileSystemGetFileOptions,
    ): Promise<FileSystemFileHandle> => {
      return rootHandle.getFileHandle(fileName, options);
    },
    getDirectory: (
      directoryName: string,
      options?: FileSystemGetDirectoryOptions,
    ): Promise<FileSystemDirectoryHandle> => {
      return rootHandle.getDirectoryHandle(directoryName, options);
    },
    getEntries: (): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle> => {
      return rootHandle.values();
    },
  };

  return {
    fileHandle,
    rootHandle,
  };
};

describe('WebFileSystemProvider', () => {
  it('returns written file stat from writeFile', async () => {
    const { rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle);

    await expect(
      provider.writeFile('/note.txt', 'hello', {
        create: true,
        overwrite: true,
      }),
    ).resolves.toEqual({
      stat: {
        type: FSNodeType.File,
        size: 5,
        creationTime: 123,
        modificationTime: 123,
        capabilities: {
          canDelete: true,
          canChangePath: true,
        },
      },
    });
  });

  it('throws a typed access-required DomainError when read permission is missing', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      onAccessRequired: ({ mode }) => {
        return {
          spaceName: 'Work',
          mode,
        };
      },
    });

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('throws the same typed access-required DomainError when permission is denied', async () => {
    const { rootHandle } = createRootHandle('denied');
    const provider = WebFileSystemProvider(rootHandle, {
      onAccessRequired: ({ mode }) => {
        return {
          spaceName: 'Work',
          mode,
        };
      },
    });

    await expect(provider.stat('/folder')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('falls back to a VfsError when no access-recovery callback is configured', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle);

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
  });

  it('marks denied file handles as non-writable in stat capabilities', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle);

    fileHandle.queryPermission = () => Promise.resolve('denied');

    await expect(provider.stat('/note.txt')).resolves.toMatchObject({
      capabilities: {
        canChangePath: false,
        canDelete: false,
      },
      type: FSNodeType.File,
    });
  });

  it('falls back to generic queryPermission when the readwrite descriptor is unsupported', async () => {
    const { rootHandle } = createRootHandle('granted');
    const queryPermissionMock = vi
      .fn<
        (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState | undefined>
      >()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('granted');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    const provider = WebFileSystemProvider(rootHandle);

    await expect(provider.readDirectory('/')).resolves.toEqual([
      [
        'note.txt',
        {
          capabilities: {
            canChangePath: true,
            canDelete: true,
          },
          creationTime: 123,
          modificationTime: 123,
          size: 5,
          type: FSNodeType.File,
        },
      ],
    ]);
    expect(queryPermissionMock).toHaveBeenNthCalledWith(1, {
      mode: 'readwrite',
    });
    expect(queryPermissionMock).toHaveBeenNthCalledWith(2);
  });

  it('returns root directory stat without looking up child handles', async () => {
    const { rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle);

    await expect(provider.stat('/')).resolves.toEqual({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: true,
      },
    });
  });

  it('normalizes nested paths before traversing directory handles', async () => {
    const writable: FileSystemWritableFileStream = {
      locked: false,
      abort: () => Promise.resolve(),
      close: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
      seek: () => Promise.resolve(undefined),
      truncate: () => Promise.resolve(undefined),
      write: vi.fn(() => Promise.resolve(undefined)),
    };
    const nestedFileHandle: FileSystemFileHandle = {
      kind: 'file',
      name: 'note.txt',
      isSameEntry: () => Promise.resolve(true),
      queryPermission: () => Promise.resolve('granted'),
      requestPermission: () => Promise.resolve('granted'),
      createWritable: () => Promise.resolve(writable),
      getFile: () => Promise.resolve(new File(['nested'], 'note.txt', { lastModified: 321 })),
      createSyncAccessHandle: () => Promise.reject(new Error('Method not implemented.')),
      isFile: true,
      isDirectory: false,
    };
    const { rootHandle: baseRootHandle } = createRootHandle('granted');
    const nestedDirectoryHandle: FileSystemDirectoryHandle = {
      kind: baseRootHandle.kind,
      name: 'child',
      isSameEntry: (...args) => baseRootHandle.isSameEntry(...args),
      queryPermission: (...args) =>
        baseRootHandle.queryPermission?.(...args) ?? Promise.resolve('granted'),
      requestPermission: (...args) => baseRootHandle.requestPermission(...args),
      entries: () => baseRootHandle.entries(),
      keys: () => baseRootHandle.keys(),
      values: () => baseRootHandle.values(),
      [Symbol.asyncIterator]: () => baseRootHandle[Symbol.asyncIterator](),
      getDirectoryHandle: vi.fn(() => Promise.reject(new Error('Method not implemented.'))),
      getFileHandle: vi.fn(() => Promise.resolve(nestedFileHandle)),
      removeEntry: (...args) => baseRootHandle.removeEntry(...args),
      resolve: (...args) => baseRootHandle.resolve(...args),
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- test fixture mirrors browser handle shape
      isFile: baseRootHandle.isFile,
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- test fixture mirrors browser handle shape
      isDirectory: baseRootHandle.isDirectory,
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- test fixture mirrors browser handle shape
      getFile: (...args) => baseRootHandle.getFile(...args),
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- test fixture mirrors browser handle shape
      getDirectory: (...args) => baseRootHandle.getDirectory(...args),
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- test fixture mirrors browser handle shape
      getEntries: () => baseRootHandle.getEntries(),
    };
    const { rootHandle } = createRootHandle('granted');
    const getDirectoryHandleMock = vi.fn(() => Promise.resolve(nestedDirectoryHandle));
    const getFileHandleMock = vi.fn(() => Promise.resolve(nestedFileHandle));
    rootHandle.getDirectoryHandle = getDirectoryHandleMock;
    nestedDirectoryHandle.getFileHandle = getFileHandleMock;
    const provider = WebFileSystemProvider(rootHandle);

    await expect(provider.readFile('//child///note.txt')).resolves.toBeInstanceOf(File);
    expect(getDirectoryHandleMock).toHaveBeenCalledWith('child', {
      create: false,
    });
    expect(getFileHandleMock).toHaveBeenCalledWith('note.txt', {
      create: false,
    });
  });

  it('serializes only safe metadata for worker transfer', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      onAccessRequired: ({ mode }) => ({
        spaceName: 'Work',
        mode,
      }),
    });

    const thrownError = await provider
      .readDirectory('/')
      .catch((caughtError: unknown) => caughtError);

    expect(thrownError).toBeInstanceOf(WebFileSystemAccessRequiredError);
    if (!(thrownError instanceof WebFileSystemAccessRequiredError)) {
      throw new Error('Expected WebFileSystemAccessRequiredError');
    }

    expect(thrownError.toJSON()).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      message: 'Permission required to open this remembered local space',
      mode: 'readwrite',
      spaceName: 'Work',
    });
    expect(thrownError.toJSON()).not.toHaveProperty('cause');
    expect(JSON.stringify(thrownError.toJSON())).not.toContain('FileSystemDirectoryHandle');
  });

  it('can bypass local access recovery for Browser Storage style providers', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      bypassAccessRequiredRecovery: true,
      onAccessRequired: () => ({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    });

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
  });
});
