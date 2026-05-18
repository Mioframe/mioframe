import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FSNodeStat, IFileSystemProvider, VfsEvent } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VfsEventSource, VfsEventType } from '@shared/lib/virtualFileSystem';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
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

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  __sameEntryKey: string;
  queryPermission?: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (
    descriptor?: FileSystemHandlePermissionDescriptor,
  ) => Promise<PermissionState>;
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
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));
  const isSameEntryMock = vi.fn<
    (other: { __sameEntryKey?: string; name?: string }) => Promise<boolean>
  >((other) => Promise.resolve((other.__sameEntryKey ?? other.name) === sameEntryKey));

  const handle: MockDirectoryHandle = {
    kind: 'directory',
    name,
    ...(queryPermissionMock === undefined ? {} : { queryPermission: queryPermissionMock }),
    ...(queryPermissionMock === undefined ? {} : { queryPermissionMock }),
    requestPermission: requestPermissionMock,
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
    const subscription = service
      .directoryContent$({
        path: '/drive/folder',
      })
      .subscribe((value) => {
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

  it('shows the stale-reread diagnostic path when create event triggers a reread but payload stays unchanged', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([['new-folder', directoryStat]]);
    const { provider, emit } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const results: [string, FSNodeStat][][] = [];
    const vfsEvents: VfsEvent[] = [];
    const subscription = service
      .directoryContent$({
        path: '/drive/folder',
      })
      .subscribe((value) => {
        if (!(value instanceof Error)) {
          results.push(value);
        }
      });
    const unwatch = service.vfs.watch('/drive/folder', (event) => {
      vfsEvents.push(event);
    });

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(1);
      expect(results).toEqual([[]]);
    });

    await service.createDirectory('/drive/folder/new-folder');

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(2);
    });

    expect(vfsEvents).toContainEqual({
      source: VfsEventSource.VFS,
      type: VfsEventType.CREATE,
      path: '/drive/folder/new-folder',
      nodeType: FSNodeType.Directory,
    });
    expect(results).toEqual([[]]);

    emit({
      type: VfsEventType.UPDATE,
      path: '/folder',
      nodeType: FSNodeType.Directory,
    });

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(3);
      expect(results).toEqual([[], [['new-folder', directoryStat]]]);
    });

    unwatch();
    subscription.unsubscribe();
  });

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
    const deviceFileSnapshots: Array<
      {
        name: string;
        handle: FileSystemDirectoryHandle;
      }[]
    > = [];
    const unsubscribe = await service.deviceFiles.subscribe({
      next: (value) => {
        deviceFileSnapshots.push(value);
      },
    });

    await vi.waitFor(() => {
      expect(grantedHandle.queryPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(deniedHandle.queryPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(deviceFileSnapshots.at(-1)).toEqual([
        {
          description: 'Saved directly in your browser on this device',
          name: OPFSName,
          handle: opfsHandle,
        },
        {
          description: 'Mioframe space on this device',
          name: 'Work',
          handle: grantedHandle,
        },
      ]);
    });

    unsubscribe();
  });

  it('skips persisted directories when queryPermission is unavailable', async () => {
    const legacyHandle = createDirectoryHandleMock({
      name: 'Legacy',
      sameEntryKey: 'legacy',
      withQueryPermission: false,
    });

    getRecordListMock.mockResolvedValue([{ name: 'Legacy', handle: legacyHandle }]);

    const service = await createService();

    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
  });

  it('normalizes legacy mounted-directory descriptions during hydration', async () => {
    const legacyHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });

    getRecordListMock.mockResolvedValue([
      {
        description: 'Directory on this device',
        name: 'Archive',
        handle: legacyHandle,
      },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          description: 'Mioframe space on this device',
          name: 'Archive',
          handle: legacyHandle,
        },
      ]);
    });
    await vi.waitFor(() => {
      expect(updateRecordListMock).toHaveBeenCalledWith([
        {
          description: 'Mioframe space on this device',
          name: 'Archive',
          handle: legacyHandle,
        },
      ]);
    });
  });

  it('adds unique device directory names and reuses existing handles', async () => {
    const firstHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const duplicateHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'second-work',
    });

    getRecordListMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Work', handle: firstHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Work', handle: duplicateHandle },
      ]);

    const service = await createService();

    await expect(service.addDeviceDirectory(firstHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Work',
      handle: firstHandle,
    });
    await expect(service.addDeviceDirectory(duplicateHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Work',
      handle: duplicateHandle,
    });
    await expect(service.addDeviceDirectory(secondHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Work (2)',
      handle: secondHandle,
    });

    expect(updateRecordListMock).toHaveBeenNthCalledWith(1, [
      { description: 'Mioframe space on this device', name: 'Work', handle: firstHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(2, [
      { description: 'Mioframe space on this device', name: 'Work', handle: duplicateHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(3, [
      { description: 'Mioframe space on this device', name: 'Work', handle: duplicateHandle },
      { description: 'Mioframe space on this device', name: 'Work (2)', handle: secondHandle },
    ]);
  });

  it('adds incrementing names for different handles with the same folder name', async () => {
    const firstHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'projects-1',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'projects-2',
    });
    const thirdHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'projects-3',
    });

    let persistedRecords: Array<{
      description?: string | undefined;
      name: string;
      handle: FileSystemDirectoryHandle;
    }> = [];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();

    await expect(service.addDeviceDirectory(firstHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Projects',
      handle: firstHandle,
    });
    await expect(service.addDeviceDirectory(secondHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Projects (2)',
      handle: secondHandle,
    });
    await expect(service.addDeviceDirectory(thirdHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Projects (3)',
      handle: thirdHandle,
    });
  });

  it('reserves the Browser Storage name for the built-in browser entry', async () => {
    const conflictingHandle = createDirectoryHandleMock({
      name: OPFSName,
      permissionState: 'granted',
      sameEntryKey: 'conflicting-browser-storage',
    });
    getDirectoryMock.mockResolvedValue(createDirectoryHandleMock({ name: OPFSName }));
    let persistedRecords: Array<{
      description?: string | undefined;
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
      description: 'Mioframe space on this device',
      name: `${OPFSName} (2)`,
      handle: conflictingHandle,
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual(
        expect.arrayContaining([
          {
            description: 'Saved directly in your browser on this device',
            name: OPFSName,
            handle: expect.objectContaining({ name: OPFSName }),
          },
          {
            description: 'Mioframe space on this device',
            name: `${OPFSName} (2)`,
            handle: conflictingHandle,
          },
        ]),
      );
    });
  });

  it('renames an existing mounted handle and removes the previous mounted name', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: oldHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: oldHandle },
      ]);

    const service = await createService();
    const snapshots: Array<
      {
        description?: string | undefined;
        name: string;
        handle: FileSystemDirectoryHandle;
      }[]
    > = [];
    const unsubscribe = await service.deviceFiles.subscribe({
      next: (value) => {
        snapshots.push(value);
      },
    });

    await vi.waitFor(() => {
      expect(snapshots.at(-1)).toEqual([
        {
          description: 'Mioframe space on this device',
          name: 'Projects',
          handle: oldHandle,
        },
      ]);
    });

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Archive',
      handle: renamedHandle,
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        description: 'Mioframe space on this device',
        name: 'Archive',
        handle: renamedHandle,
      },
    ]);
    expect(updateRecordListMock).toHaveBeenCalledWith([
      { description: 'Mioframe space on this device', name: 'Archive', handle: renamedHandle },
    ]);

    unsubscribe();
  });

  it('renames an existing mounted handle safely when the new folder name conflicts with Browser Storage', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: OPFSName,
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getDirectoryMock.mockResolvedValue(createDirectoryHandleMock({ name: OPFSName }));
    getRecordListMock
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: oldHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: oldHandle },
      ]);

    const service = await createService();

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: `${OPFSName} (2)`,
      handle: renamedHandle,
    });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      {
        description: 'Mioframe space on this device',
        name: `${OPFSName} (2)`,
        handle: renamedHandle,
      },
    ]);
  });

  it('overlays mounted directory descriptions into root directory listings', async () => {
    const service = await createService();

    await service.addDeviceDirectory(createDirectoryHandleMock({ name: 'Work' }));

    await expect(service.directoryContent.fetch({ path: '/' })).resolves.toContainEqual([
      'Device Files',
      expect.objectContaining({
        description: 'Directories from this device and browser storage',
        type: FSNodeType.Directory,
      }),
    ]);
  });

  it('does not touch persisted records when removing OPFS', async () => {
    const service = await createService();

    await service.removeDeviceDirectory(OPFSName);

    expect(getRecordListMock).not.toHaveBeenCalled();
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('ignores missing device directory names', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });

    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();

    await service.removeDeviceDirectory('Missing');

    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('removes matching device directory names from persistence and active state', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });

    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();

    await service.removeDeviceDirectory('Work');

    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
    expect(updateRecordListMock).toHaveBeenCalledTimes(1);
    expect(updateRecordListMock).toHaveBeenCalledWith([]);
  });

  it('filters automerge files from directoryContent$ when requested', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        ['storage-adapter-id.automerge', fileStat],
        ['visible.txt', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const results: [string, FSNodeStat][][] = [];
    const subscription = service
      .directoryContent$({
        path: '/drive/folder',
        options: {
          hideAutomergeFiles: true,
        },
      })
      .subscribe((value) => {
        if (!(value instanceof Error)) {
          results.push(value);
        }
      });

    await vi.waitFor(() => {
      expect(results).toEqual([[['visible.txt', fileStat]]]);
    });

    subscription.unsubscribe();
  });

  it('keeps automerge files visible by default and sorts entries by name', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        ['visible.txt', fileStat],
        ['storage-adapter-id.automerge', fileStat],
        ['a-folder', directoryStat],
      ]);
    const { provider } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(service.directoryContent.fetch({ path: '/drive/folder' })).resolves.toEqual([
      ['a-folder', directoryStat],
      ['storage-adapter-id.automerge', fileStat],
      ['visible.txt', fileStat],
    ]);
  });

  it('stops rereading directory content after unsubscribing', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([]);
    const { provider, emit } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const unsubscribe = service.directoryContent$({ path: '/drive/folder' }).subscribe(() => {});

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(1);
    });

    unsubscribe.unsubscribe();
    emit({
      type: VfsEventType.UPDATE,
      path: '/folder',
      nodeType: FSNodeType.Directory,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(readDirectoryMock).toHaveBeenCalledTimes(1);
  });

  it('emits errors as values for directoryContent$ and fsNodeStat$', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockRejectedValue(new Error('read failed'));
    const { provider, emit } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    provider.stat
      .mockResolvedValueOnce(directoryStat)
      .mockRejectedValueOnce(new Error('stat failed'));
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const directoryValues: (Error | [string, FSNodeStat][])[] = [];
    const statValues: (Error | FSNodeStat)[] = [];
    const directorySubscription = service
      .directoryContent$({ path: '/drive/folder' })
      .subscribe((value) => {
        directoryValues.push(value);
      });
    const statSubscription = service.fsNodeStat$({ path: '/drive/folder' }).subscribe((value) => {
      statValues.push(value);
    });

    await vi.waitFor(() => {
      expect(directoryValues.at(0)).toBeInstanceOf(Error);
      expect(statValues.at(0)).toEqual(directoryStat);
    });

    emit({
      type: VfsEventType.UPDATE,
      path: '/folder',
      nodeType: FSNodeType.Directory,
    });

    await vi.waitFor(() => {
      expect(statValues.at(-1)).toBeInstanceOf(Error);
    });

    directorySubscription.unsubscribe();
    statSubscription.unsubscribe();
  });

  it('forwards non-Error failures to the observable error channel', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockRejectedValue('directory failed');
    const { provider } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    provider.stat.mockRejectedValue('stat failed');
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const directoryErrors: unknown[] = [];
    const statErrors: unknown[] = [];
    const directorySubscription = service.directoryContent$({ path: '/drive/folder' }).subscribe({
      error: (error) => {
        directoryErrors.push(error);
      },
    });
    const statSubscription = service.fsNodeStat$({ path: '/drive/folder' }).subscribe({
      error: (error) => {
        statErrors.push(error);
      },
    });

    await vi.waitFor(() => {
      expect(directoryErrors).toEqual(['directory failed']);
      expect(statErrors).toEqual(['stat failed']);
    });

    directorySubscription.unsubscribe();
    statSubscription.unsubscribe();
  });

  it('proxies move and remove to the underlying vfs', async () => {
    const service = await createService();

    await service.createDirectory('/drive');
    await service.createDirectory('/drive/folder');
    await service.vfs.writeFile('/drive/folder/source.txt', 'payload');

    await service.move('/drive/folder/source.txt', '/drive/folder/dest.txt');

    await expect(service.vfs.readText('/drive/folder/dest.txt')).resolves.toBe('payload');

    await service.remove('/drive/folder/dest.txt');

    await expect(service.vfs.exists('/drive/folder/dest.txt')).resolves.toBe(false);
  });

  it('keeps mounted directory lifecycle and root overlay in sync across add, rename, and remove', async () => {
    const originalHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: originalHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Projects', handle: originalHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Archive', handle: renamedHandle },
      ])
      .mockResolvedValueOnce([
        { description: 'Mioframe space on this device', name: 'Archive', handle: renamedHandle },
      ]);

    const service = await createService();

    await expect(service.addDeviceDirectory(originalHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Projects',
      handle: originalHandle,
    });
    await expect(service.deviceFiles.fetch()).resolves.toContainEqual({
      description: 'Mioframe space on this device',
      name: 'Projects',
      handle: originalHandle,
    });

    await expect(service.directoryContent.fetch({ path: '/' })).resolves.toContainEqual([
      'Device Files',
      expect.objectContaining({
        description: 'Directories from this device and browser storage',
        type: FSNodeType.Directory,
      }),
    ]);

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      description: 'Mioframe space on this device',
      name: 'Archive',
      handle: renamedHandle,
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        description: 'Mioframe space on this device',
        name: 'Archive',
        handle: renamedHandle,
      },
    ]);

    await service.removeDeviceDirectory('Missing');
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        description: 'Mioframe space on this device',
        name: 'Archive',
        handle: renamedHandle,
      },
    ]);

    await service.removeDeviceDirectory('Archive');
    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
  });

  it('shares fsNodeStat subscriptions for the same path and stops rereading after the last unsubscribe', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([]);
    const { provider, emit } = createDiagnosticProvider({
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const statResultsA: (Error | FSNodeStat)[] = [];
    const statResultsB: (Error | FSNodeStat)[] = [];
    const subscriptionA = service.fsNodeStat$({ path: '/drive/folder' }).subscribe((value) => {
      statResultsA.push(value);
    });
    const subscriptionB = service.fsNodeStat$({ path: '/drive/folder' }).subscribe((value) => {
      statResultsB.push(value);
    });

    await vi.waitFor(() => {
      expect(provider.stat).toHaveBeenCalledTimes(1);
      expect(statResultsA).toEqual([directoryStat]);
      expect(statResultsB).toEqual([directoryStat]);
    });

    emit({
      type: VfsEventType.UPDATE,
      path: '/folder',
      nodeType: FSNodeType.Directory,
    });

    await vi.waitFor(() => {
      expect(provider.stat).toHaveBeenCalledTimes(2);
    });

    subscriptionA.unsubscribe();
    subscriptionB.unsubscribe();

    emit({
      type: VfsEventType.UPDATE,
      path: '/folder',
      nodeType: FSNodeType.Directory,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider.stat).toHaveBeenCalledTimes(2);
  });

  it('exposes vfsActivity updates through the service query', async () => {
    const service = await createService();
    const states: VfsActivityState[] = [];
    const subscription = service.vfsActivity.subscribe({
      next: (state) => {
        states.push(state);
      },
    });

    await service.createDirectory('/tracked');

    await vi.waitFor(() => {
      expect(states).toContainEqual({
        status: 'active',
        activeCount: 1,
        lastError: undefined,
      });
      expect(states).toContainEqual({
        status: 'idle',
        activeCount: 0,
        lastError: undefined,
      });
    });

    (await subscription)();
  });

  it('acknowledges vfs activity errors through the service API', async () => {
    const service = await createService();

    await expect(service.move('/missing', '/other')).rejects.toBeInstanceOf(Error);

    await vi.waitFor(async () => {
      await expect(service.vfsActivity.fetch()).resolves.toMatchObject({
        status: 'error',
        activeCount: 0,
        lastError: {
          acknowledged: false,
          operationType: 'move',
          path: '/missing',
          newPath: '/other',
        },
      });
    });

    service.acknowledgeVfsActivityError();

    await vi.waitFor(async () => {
      await expect(service.vfsActivity.fetch()).resolves.toMatchObject({
        status: 'idle',
        activeCount: 0,
        lastError: {
          acknowledged: true,
        },
      });
    });
  });
});
