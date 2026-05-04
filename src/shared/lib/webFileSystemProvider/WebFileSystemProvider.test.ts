import { describe, expect, it, vi } from 'vitest';
import { FSNodeType } from '../virtualFileSystem';
import { WebFileSystemProvider } from './WebFileSystemProvider';

describe('WebFileSystemProvider', () => {
  it('returns written file stat from writeFile', async () => {
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
      queryPermission: () => Promise.resolve('granted'),
      requestPermission: () => Promise.resolve('granted'),
      createWritable: () => Promise.resolve(writable),
      getFile: () => Promise.resolve(file),
      createSyncAccessHandle: () => Promise.reject(new Error('Method not implemented.')),
      isFile: true,
      isDirectory: false,
    };
    const rootHandle: FileSystemDirectoryHandle = {
      kind: 'directory',
      name: '',
      isSameEntry: () => Promise.resolve(true),
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
});
