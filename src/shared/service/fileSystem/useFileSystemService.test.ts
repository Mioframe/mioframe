import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { partialKeyToFileName, storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import type { FSNodeStat, IFileSystemProvider, VfsEvent } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VfsEventSource } from '@shared/lib/virtualFileSystem';
import { OPFSName } from '../directories';

const getRecordListMock = vi.fn();
const updateRecordListMock = vi.fn();
const getDirectoryMock = vi.fn();

vi.mock('./setupFileSystemDirectoryHandleService', () => ({
  useFileSystemDirectoryHandleService: () => ({
    getRecordList: getRecordListMock,
    updateRecordList: updateRecordListMock,
  }),
}));

const directoryStat = {
  type: FSNodeType.Directory,
  capabilities: {
    canDelete: true,
    canChangePath: true,
    canEditChildren: true,
  },
} satisfies FSNodeStat;

const fileStat = {
  type: FSNodeType.File,
  size: 7,
  capabilities: {
    canDelete: true,
    canChangePath: true,
  },
} satisfies FSNodeStat;

const createDocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = partialKeyToFileName([documentId, 'snapshot', 'hash']);

  if (!fileName) {
    throw new Error('Failed to create Automerge storage file fixture');
  }

  return fileName;
};

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  __sameEntryKey: string;
  queryPermissionMock?: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
  isSameEntryMock: ReturnType<
    typeof vi.fn<(other: { __sameEntryKey?: string; name?: string }) => Promise<boolean>>
  >;
};

const createDirectoryHandleMock = ({
  name,
  permissionState = 'granted',
  sameEntryKey = name,
  withQueryPermission = true,
}: {
  name: string;
  permissionState?: PermissionState;
  sameEntryKey?: string;
  withQueryPermission?: boolean;
}) => {
  const queryPermissionMock = withQueryPermission
    ? vi.fn(() => Promise.resolve(permissionState))
    : undefined;
  const isSameEntryMock = vi.fn<
    (other: { __sameEntryKey?: string; name?: string }) => Promise<boolean>
  >((other) => Promise.resolve((other.__sameEntryKey ?? other.name) === sameEntryKey));

  const handle: MockDirectoryHandle = {
    kind: 'directory',
    name,
    ...(queryPermissionMock === undefined ? {} : { queryPermission: queryPermissionMock }),
    ...(queryPermissionMock === undefined ? {} : { queryPermissionMock }),
    requestPermission: vi.fn(() => Promise.resolve(permissionState)),
    isSameEntry: isSameEntryMock,
    isSameEntryMock,
    __sameEntryKey: sameEntryKey,
    isFile: false,
    isDirectory: true,
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
    getDirectoryHandle: () => Promise.reject(new Error('Method not implemented.')),
    getFileHandle: () => Promise.reject(new Error('Method not implemented.')),
    removeEntry: () => Promise.reject(new Error('Method not implemented.')),
    resolve: () => Promise.reject(new Error('Method not implemented.')),
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

const createDiagnosticProvider = ({
  createDirectory = vi.fn(() => Promise.resolve(undefined)),
  readDirectory,
}: {
  createDirectory?: ReturnType<typeof vi.fn<(path: string) => Promise<void>>>;
  readDirectory: ReturnType<typeof vi.fn<(path: string) => Promise<[string, FSNodeStat][]>>>;
}) => {
  const listeners = new Set<(event: VfsEvent) => void>();

  const provider = {
    stat: vi.fn(() => Promise.resolve(directoryStat)),
    readFile: vi.fn(() => Promise.resolve(new File([], 'unused'))),
    writeFile: vi.fn(() =>
      Promise.resolve({
        stat: {
          type: FSNodeType.File,
          size: 0,
        },
      }),
    ),
    readDirectory,
    createDirectory,
    delete: vi.fn(() => Promise.resolve(undefined)),
    move: vi.fn(() => Promise.resolve(undefined)),
    watch: (callback: (event: VfsEvent) => void) => {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
  } satisfies IFileSystemProvider;

  return {
    provider,
    emit: (event: Omit<VfsEvent, 'source'>) => {
      listeners.forEach((listener) => {
        listener({
          source: VfsEventSource.PROVIDER,
          ...event,
        });
      });
    },
  };
};

describe('useFileSystemService', () => {
  beforeEach(() => {
    vi.resetModules();
    getRecordListMock.mockReset();
    updateRecordListMock.mockReset();
    getDirectoryMock.mockReset();
    getRecordListMock.mockResolvedValue([]);
    updateRecordListMock.mockResolvedValue(undefined);
    getDirectoryMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'storage', {
      value: {
        getDirectory: getDirectoryMock,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createService = async () => {
    const { useFileSystemService } = await import('./useFileSystemService');

    return useFileSystemService();
  };

  it('hydrates only granted device directories and includes OPFS when available', async () => {
    const grantedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const deniedHandle = createDirectoryHandleMock({
      name: 'Private',
      permissionState: 'denied',
      sameEntryKey: 'private',
    });
    const opfsHandle = createDirectoryHandleMock({
      name: OPFSName,
      permissionState: 'granted',
      sameEntryKey: 'opfs',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: grantedHandle },
      { name: 'Private', handle: deniedHandle },
    ]);
    getDirectoryMock.mockResolvedValue(opfsHandle);

    const service = await createService();

    await vi.waitFor(async () => {
      expect(grantedHandle.queryPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(deniedHandle.queryPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          name: OPFSName,
          handle: opfsHandle,
        },
        {
          name: 'Work',
          handle: grantedHandle,
        },
      ]);
    });
  });

  it('hydrates normalized persisted records without rewriting them', async () => {
    const legacyHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      {
        name: 'Archive',
        handle: legacyHandle,
      },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          name: 'Archive',
          handle: legacyHandle,
        },
      ]);
    });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('adds unique device directory names and reuses existing handles without display copy', async () => {
    const firstHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    const duplicateHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'second-work',
    });

    getRecordListMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: 'Work', handle: firstHandle }])
      .mockResolvedValueOnce([{ name: 'Work', handle: duplicateHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(firstHandle)).resolves.toEqual({
      name: 'Work',
      handle: firstHandle,
    });
    await expect(service.addDeviceDirectory(duplicateHandle)).resolves.toEqual({
      name: 'Work',
      handle: duplicateHandle,
    });
    await expect(service.addDeviceDirectory(secondHandle)).resolves.toEqual({
      name: 'Work (2)',
      handle: secondHandle,
    });

    expect(updateRecordListMock).toHaveBeenNthCalledWith(1, [
      { name: 'Work', handle: firstHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(2, [
      { name: 'Work', handle: duplicateHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(3, [
      { name: 'Work', handle: duplicateHandle },
      { name: 'Work (2)', handle: secondHandle },
    ]);
  });

  it('reserves the Browser Storage name for the built-in browser entry', async () => {
    const conflictingHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'conflicting-browser-storage',
    });
    getDirectoryMock.mockResolvedValue(createDirectoryHandleMock({ name: OPFSName }));
    let persistedRecords: Array<{
      name: string;
      handle: FileSystemDirectoryHandle;
    }> = [];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();

    await vi.waitFor(() => {
      expect(getDirectoryMock).toHaveBeenCalled();
    });

    await expect(service.addDeviceDirectory(conflictingHandle)).resolves.toEqual({
      name: `${OPFSName} (2)`,
      handle: conflictingHandle,
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual(
      expect.arrayContaining([
        {
          name: OPFSName,
          handle: expect.objectContaining({ name: OPFSName }),
        },
        {
          name: `${OPFSName} (2)`,
          handle: conflictingHandle,
        },
      ]),
    );
  });

  it('persists duplicate-name and reserved-name migrations without display copy', async () => {
    const opfsHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'opfs',
    });
    const firstHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'first-browser-storage',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'archive',
    });
    getDirectoryMock.mockResolvedValue(opfsHandle);
    getRecordListMock.mockResolvedValue([
      { name: OPFSName, handle: firstHandle },
      { name: 'Archive', handle: secondHandle },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          name: OPFSName,
          handle: opfsHandle,
        },
        {
          name: `${OPFSName} (2)`,
          handle: firstHandle,
        },
        {
          name: 'Archive',
          handle: secondHandle,
        },
      ]);
    });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      {
        name: `${OPFSName} (2)`,
        handle: firstHandle,
      },
      {
        name: 'Archive',
        handle: secondHandle,
      },
    ]);
  });

  it('renames an existing mounted handle and removes the previous mounted name', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      name: 'Archive',
      handle: renamedHandle,
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        name: 'Archive',
        handle: renamedHandle,
      },
    ]);
    expect(updateRecordListMock).toHaveBeenCalledWith([{ name: 'Archive', handle: renamedHandle }]);
  });

  it('removes matching device directory names from persistence and active state', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();

    await service.removeDeviceDirectory('Work');

    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
    expect(updateRecordListMock).toHaveBeenCalledTimes(1);
    expect(updateRecordListMock).toHaveBeenCalledWith([]);
  });

  it('does not touch persisted records when removing OPFS or an unknown name', async () => {
    const service = await createService();

    await service.removeDeviceDirectory(OPFSName);
    await service.removeDeviceDirectory('Missing');

    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('re-reads directoryContent$ and emits an updated payload after createDirectory', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([['new-folder', directoryStat]]);
    const createDirectoryMock = vi
      .fn<(path: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    const { provider } = createDiagnosticProvider({
      createDirectory: createDirectoryMock,
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const results: [string, FSNodeStat][][] = [];
    const subscription = service.directoryContent$({ path: '/drive/folder' }).subscribe((value) => {
      if (!(value instanceof Error)) {
        results.push(value);
      }
    });

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(1);
    });

    await service.createDirectory('/drive/folder/new-folder');

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(2);
      expect(results).toEqual([[], [['new-folder', directoryStat]]]);
    });
    expect(createDirectoryMock).toHaveBeenCalledWith('/folder/new-folder');

    subscription.unsubscribe();
  });

  it('filters automerge files from directoryContent$ when requested', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        ['storage-adapter-id.automerge', fileStat],
        ['visible.txt', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: { hideAutomergeFiles: true },
      }),
    ).resolves.toEqual([['visible.txt', fileStat]]);
  });

  it('filters repository marker files and keeps Automerge visibility configurable', async () => {
    const documentStorageFileName = createDocumentStorageFileName();
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        [storageAdapterMarkerFileName, fileStat],
        [documentStorageFileName, fileStat],
        ['visible.txt', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: {
          hideAutomergeFiles: true,
          hideRepositoryStorageFiles: true,
        },
      }),
    ).resolves.toEqual([['visible.txt', fileStat]]);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: {
          hideAutomergeFiles: false,
          hideRepositoryStorageFiles: true,
        },
      }),
    ).resolves.toEqual([
      [documentStorageFileName, fileStat],
      ['visible.txt', fileStat],
    ]);
  });

  it('emits errors as values for directoryContent$ and forwards non-Error failures to the observable error channel', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockRejectedValueOnce(new Error('read failed'))
      .mockRejectedValueOnce('directory failed');
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(service.directoryContent.fetch({ path: '/drive/folder' })).resolves.toBeInstanceOf(
      Error,
    );

    const errors: unknown[] = [];
    const subscription = service.directoryContent$({ path: '/drive/folder' }).subscribe({
      error: (error) => {
        errors.push(error);
      },
    });

    await vi.waitFor(() => {
      expect(errors).toEqual(['directory failed']);
    });
    subscription.unsubscribe();
  });
});
