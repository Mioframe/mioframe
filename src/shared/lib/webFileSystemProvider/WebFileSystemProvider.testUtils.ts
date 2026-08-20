import { vi } from 'vitest';
import { WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE } from './WebFileSystemUnavailableRootError';

// Matches `DEVICE_FILES_ROOT_NAME` from `@shared/lib/deviceFileSystemProvider`. Not imported to
// avoid a circular dependency back into this provider boundary from that consumer module.
const DEVICE_FILES_ROOT_NAME = 'Device Files';

/**
 * Duck-types an unavailable-root error instead of using `instanceof`: callers that dynamically
 * `import()` the fileSystem service after `vi.resetModules()` get a distinct module instance of
 * `WebFileSystemUnavailableRootError`, so a class-identity check would spuriously fail even for a
 * genuine unavailable-root error.
 * @param error - Caught error value to check.
 * @returns Whether `error` carries the unavailable-root code and a string `recoveryKey`.
 */
const isUnavailableRootErrorLike = (error: unknown): error is { recoveryKey: string } =>
  error instanceof Error &&
  'code' in error &&
  error.code === WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE &&
  'recoveryKey' in error &&
  typeof error.recoveryKey === 'string';

type BaseHandleOptions = {
  name: string;
  permissionState?: PermissionState;
  /**
   * Overrides the permission state returned for `queryPermission({ mode: 'read' })`.
   * When omitted, the base `permissionState` is used for all modes.
   */
  readPermissionState?: PermissionState;
  sameEntryKey?: string;
  withQueryPermission?: boolean;
};

type MockFileSystemFileHandle = FileSystemFileHandle & {
  sameEntryKey: string;
  writtenContent: BlobPart[];
  getFileMock: ReturnType<typeof vi.fn<() => Promise<File>>>;
  queryPermissionMock?: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

type MockFileSystemDirectoryHandle = FileSystemDirectoryHandle & {
  sameEntryKey: string;
  entriesMock: ReturnType<
    typeof vi.fn<
      () => AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>
    >
  >;
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
    typeof vi.fn<(other: { sameEntryKey?: string; name?: string }) => Promise<boolean>>
  >;
};

type FileHandleOptions = BaseHandleOptions & {
  fileContent?: BlobPart[];
  lastModified?: number;
};

type DirectoryHandleOptions = BaseHandleOptions & {
  entries?: Array<FileSystemFileHandle | FileSystemDirectoryHandle>;
};

const createPermissionMocks = (
  permissionState: PermissionState,
  withQueryPermission: boolean,
  readPermissionState?: PermissionState,
) => {
  const queryPermissionMock = withQueryPermission
    ? vi.fn((descriptor?: FileSystemHandlePermissionDescriptor) => {
        if (descriptor?.mode === 'read' && readPermissionState !== undefined) {
          return Promise.resolve(readPermissionState);
        }

        return Promise.resolve(permissionState);
      })
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
  readPermissionState,
  sameEntryKey = name,
  withQueryPermission = true,
}: FileHandleOptions): MockFileSystemFileHandle => {
  const { queryPermissionMock, requestPermissionMock } = createPermissionMocks(
    permissionState,
    withQueryPermission,
    readPermissionState,
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

  const getFileMock = vi.fn(() =>
    Promise.resolve(new File(writtenContent, name, { lastModified })),
  );

  const handle: MockFileSystemFileHandle = {
    kind: 'file',
    name,
    sameEntryKey,
    writtenContent,
    getFileMock,
    ...(queryPermissionMock === undefined ? {} : { queryPermission: queryPermissionMock }),
    ...(queryPermissionMock === undefined ? {} : { queryPermissionMock }),
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    isSameEntry: vi.fn((other) =>
      Promise.resolve((other.sameEntryKey ?? other.name) === sameEntryKey),
    ),
    createWritable: vi.fn(() => Promise.resolve(writable)),
    getFile: getFileMock,
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
  readPermissionState,
  sameEntryKey = name,
  withQueryPermission = true,
}: DirectoryHandleOptions): MockFileSystemDirectoryHandle => {
  const { queryPermissionMock, requestPermissionMock } = createPermissionMocks(
    permissionState,
    withQueryPermission,
    readPermissionState,
  );
  const isSameEntryMock = vi.fn<
    (other: { sameEntryKey?: string; name?: string }) => Promise<boolean>
  >((other) => Promise.resolve((other.sameEntryKey ?? other.name) === sameEntryKey));
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
  const entriesMock = vi.fn(() =>
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
  );

  const handle: MockFileSystemDirectoryHandle = {
    kind: 'directory',
    name,
    sameEntryKey,
    entriesMock,
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
    entries: entriesMock,
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

/**
 * Waits until `spaceName` is hydrated/mounted, forces `handle` to report granted read permission
 * and throw a granted-but-unreadable root failure, reads the mounted path (expecting it to reject
 * with `WebFileSystemUnavailableRootError`), and returns the real opaque `recoveryKey` the
 * fileSystem service minted for that mounted provider instance. Restores `handle.entries` and
 * `handle.queryPermission` afterward so the fixture keeps its originally configured permission
 * behavior for the rest of the test.
 * @param options - The mock directory handle mounted for the target space, the fileSystem service
 * instance (`useFileSystemService()`/`useMainServiceClient().fileSystem`), and the mounted space
 * name to capture the key for.
 * @returns The real `recoveryKey` minted for the currently mounted provider at that handle.
 */
export const captureRecoveryKeyFromUnavailableRoot = async ({
  handle,
  service,
  spaceName,
}: {
  handle: MockFileSystemDirectoryHandle;
  service: {
    deviceFiles: { fetch: () => Promise<{ name: string }[] | undefined> };
    vfs: { readDirectory: (path: string) => Promise<unknown> };
  };
  spaceName: string;
}): Promise<string> => {
  await vi.waitFor(async () => {
    const files = await service.deviceFiles.fetch();
    if (!files?.some((file) => file.name === spaceName)) {
      throw new Error(`"${spaceName}" is not mounted yet`);
    }
  });

  const originalEntries = handle.entries.bind(handle);
  const originalQueryPermission = handle.queryPermission?.bind(handle);

  handle.entries = () => {
    throw new DOMException('I/O error', 'NotReadableError');
  };
  handle.queryPermission = () => Promise.resolve('granted');

  try {
    await service.vfs.readDirectory(`/${DEVICE_FILES_ROOT_NAME}/${spaceName}`);
    throw new Error('Expected the directory read to throw WebFileSystemUnavailableRootError');
  } catch (error) {
    if (!isUnavailableRootErrorLike(error)) {
      throw error;
    }
    return error.recoveryKey;
  } finally {
    handle.entries = originalEntries;
    if (originalQueryPermission) {
      handle.queryPermission = originalQueryPermission;
    } else {
      delete handle.queryPermission;
    }
  }
};
