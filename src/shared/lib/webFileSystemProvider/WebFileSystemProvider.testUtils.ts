import { vi } from 'vitest';

type BaseHandleOptions = {
  name: string;
  permissionState?: PermissionState;
  sameEntryKey?: string;
  withQueryPermission?: boolean;
};

type MockFileSystemFileHandle = FileSystemFileHandle & {
  __sameEntryKey: string;
  __writtenContent: BlobPart[];
  queryPermissionMock?: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

type MockFileSystemDirectoryHandle = FileSystemDirectoryHandle & {
  __sameEntryKey: string;
  getDirectoryHandleMock: ReturnType<
    typeof vi.fn<
      (
        directoryName: string,
        options?: FileSystemGetDirectoryOptions,
      ) => Promise<FileSystemDirectoryHandle>
    >
  >;
  getFileHandleMock: ReturnType<
    typeof vi.fn<
      (fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>
    >
  >;
  queryPermissionMock?: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
  removeEntryMock: ReturnType<
    typeof vi.fn<(entryName: string, options?: FileSystemRemoveOptions) => Promise<void>>
  >;
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
  isSameEntryMock: ReturnType<
    typeof vi.fn<(other: { __sameEntryKey?: string; name?: string }) => Promise<boolean>>
  >;
};

type FileHandleOptions = BaseHandleOptions & {
  fileContent?: BlobPart[];
  lastModified?: number;
};

type DirectoryHandleOptions = BaseHandleOptions & {
  entries?: Array<FileSystemFileHandle | FileSystemDirectoryHandle>;
};

const createPermissionMocks = (permissionState: PermissionState, withQueryPermission: boolean) => {
  const queryPermissionMock = withQueryPermission
    ? vi.fn(() => Promise.resolve(permissionState))
    : undefined;
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));

  return {
    queryPermissionMock,
    requestPermissionMock,
  };
};

/**
 * Creates a file-handle fixture with configurable permission and writable behavior.
 * @param options - File-handle fixture options.
 * @returns Mock file handle that mirrors the File System Access API shape used in tests.
 */
export const createFileHandleMock = ({
  fileContent = ['hello'],
  lastModified = 123,
  name,
  permissionState = 'granted',
  sameEntryKey = name,
  withQueryPermission = true,
}: FileHandleOptions): MockFileSystemFileHandle => {
  const { queryPermissionMock, requestPermissionMock } = createPermissionMocks(
    permissionState,
    withQueryPermission,
  );
  const writtenContent = [...fileContent];
  const writable = {
    locked: false,
    abort: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve(undefined)),
    getWriter: () => new WritableStream().getWriter(),
    seek: vi.fn(() => Promise.resolve(undefined)),
    truncate: vi.fn(() => Promise.resolve(undefined)),
    write: vi.fn((content: BlobPart) => {
      writtenContent.splice(0, writtenContent.length, content);
      return Promise.resolve(undefined);
    }),
  } satisfies FileSystemWritableFileStream;

  const handle: MockFileSystemFileHandle = {
    kind: 'file',
    name,
    __sameEntryKey: sameEntryKey,
    __writtenContent: writtenContent,
    ...(queryPermissionMock === undefined ? {} : { queryPermission: queryPermissionMock }),
    ...(queryPermissionMock === undefined ? {} : { queryPermissionMock }),
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    isSameEntry: vi.fn((other) =>
      Promise.resolve((other.__sameEntryKey ?? other.name) === sameEntryKey),
    ),
    createWritable: vi.fn(() => Promise.resolve(writable)),
    getFile: vi.fn(() => Promise.resolve(new File(writtenContent, name, { lastModified }))),
    createSyncAccessHandle: vi.fn(() => Promise.reject(new Error('Method not implemented.'))),
    isFile: true,
    isDirectory: false,
  };

  return handle;
};

/**
 * Creates a directory-handle fixture with configurable entries and permission behavior.
 * @param options - Directory-handle fixture options.
 * @returns Mock directory handle that mirrors the File System Access API shape used in tests.
 */
export const createDirectoryHandleMock = ({
  entries = [],
  name,
  permissionState = 'granted',
  sameEntryKey = name,
  withQueryPermission = true,
}: DirectoryHandleOptions): MockFileSystemDirectoryHandle => {
  const { queryPermissionMock, requestPermissionMock } = createPermissionMocks(
    permissionState,
    withQueryPermission,
  );
  const isSameEntryMock = vi.fn<
    (other: { __sameEntryKey?: string; name?: string }) => Promise<boolean>
  >((other) => Promise.resolve((other.__sameEntryKey ?? other.name) === sameEntryKey));
  const entryMap = new Map(entries.map((entry) => [entry.name, entry]));
  const getDirectoryHandleMock = vi.fn(
    (directoryName: string, options?: FileSystemGetDirectoryOptions) => {
      const existing = entryMap.get(directoryName);
      if (existing?.kind === 'directory') {
        return Promise.resolve(existing);
      }
      if (existing) {
        return Promise.reject(new DOMException('Type mismatch', 'TypeMismatchError'));
      }
      if (options?.create) {
        const nextDirectory = createDirectoryHandleMock({
          name: directoryName,
          permissionState,
        });
        entryMap.set(directoryName, nextDirectory);
        return Promise.resolve(nextDirectory);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    },
  );
  const getFileHandleMock = vi.fn((fileName: string, options?: FileSystemGetFileOptions) => {
    const existing = entryMap.get(fileName);
    if (existing?.kind === 'file') {
      return Promise.resolve(existing);
    }
    if (existing) {
      return Promise.reject(new DOMException('Type mismatch', 'TypeMismatchError'));
    }
    if (options?.create) {
      const nextFile = createFileHandleMock({
        name: fileName,
        permissionState,
      });
      entryMap.set(fileName, nextFile);
      return Promise.resolve(nextFile);
    }
    return Promise.reject(new DOMException('Not found', 'NotFoundError'));
  });
  const removeEntryMock = vi.fn((entryName: string, options?: FileSystemRemoveOptions) => {
    const existing = entryMap.get(entryName);
    if (!existing) {
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    }
    if (existing.kind === 'directory' && !options?.recursive) {
      return Promise.reject(new DOMException('Directory not empty', 'InvalidModificationError'));
    }
    entryMap.delete(entryName);
    return Promise.resolve(undefined);
  });

  const handle: MockFileSystemDirectoryHandle = {
    kind: 'directory',
    name,
    __sameEntryKey: sameEntryKey,
    getDirectoryHandleMock,
    getFileHandleMock,
    ...(queryPermissionMock === undefined ? {} : { queryPermission: queryPermissionMock }),
    ...(queryPermissionMock === undefined ? {} : { queryPermissionMock }),
    removeEntryMock,
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    isSameEntry: isSameEntryMock,
    isSameEntryMock,
    isFile: false,
    isDirectory: true,
    entries: () =>
      (async function* () {
        await Promise.resolve();
        for (const [entryName, entryHandle] of entryMap.entries()) {
          const entry: [string, FileSystemFileHandle | FileSystemDirectoryHandle] = [
            entryName,
            entryHandle,
          ];
          yield entry;
        }
      })(),
    keys: () =>
      (async function* () {
        await Promise.resolve();
        yield* entryMap.keys();
      })(),
    values: () =>
      (async function* () {
        await Promise.resolve();
        yield* entryMap.values();
      })(),
    [Symbol.asyncIterator]() {
      return handle.entries();
    },
    getDirectoryHandle: getDirectoryHandleMock,
    getFileHandle: getFileHandleMock,
    removeEntry: removeEntryMock,
    resolve: vi.fn(() => Promise.resolve([])),
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
