import { describe, expect, it, vi } from 'vitest';
import { FSNodeType } from '../virtualFileSystem';
import { WebFileSystemProvider } from './WebFileSystemProvider';
import {
  DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE,
  DeviceDirectoryAccessRequiredError,
} from '@shared/service/fileSystem';

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
        throw new DeviceDirectoryAccessRequiredError({
          requestId: 'request-1',
          spaceName: 'Work',
          mode,
        });
      },
    });

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      requestId: 'request-1',
      spaceName: 'Work',
    });
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('throws the same typed access-required DomainError when permission is denied', async () => {
    const { rootHandle } = createRootHandle('denied');
    const provider = WebFileSystemProvider(rootHandle, {
      onAccessRequired: ({ mode }) => {
        throw new DeviceDirectoryAccessRequiredError({
          requestId: 'request-2',
          spaceName: 'Work',
          mode,
        });
      },
    });

    await expect(provider.stat('/folder')).rejects.toMatchObject({
      code: DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      requestId: 'request-2',
      spaceName: 'Work',
    });
  });
});
