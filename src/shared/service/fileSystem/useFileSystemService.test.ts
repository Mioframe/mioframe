import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FSNodeStat, IFileSystemProvider, VfsEvent } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VfsEventSource, VfsEventType } from '@shared/lib/virtualFileSystem';
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

const createDirectoryHandleMock = ({
  name,
  permissionState = 'granted',
  sameEntryKey = name,
}: {
  name: string;
  permissionState?: PermissionState;
  sameEntryKey?: string;
}) =>
  ({
    kind: 'directory',
    name,
    queryPermission: vi.fn(async () => permissionState),
    isSameEntry: vi.fn(async (other: { __sameEntryKey?: string; name?: string }) => {
      return (other.__sameEntryKey ?? other.name) === sameEntryKey;
    }),
    __sameEntryKey: sameEntryKey,
  }) as unknown as FileSystemDirectoryHandle;

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
    writeFile: vi.fn(() => Promise.resolve(undefined)),
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
      expect(grantedHandle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(deniedHandle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(deviceFileSnapshots.at(-1)).toEqual([
        { name: OPFSName, handle: opfsHandle },
        { name: 'Work', handle: grantedHandle },
      ]);
    });

    unsubscribe();
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

  it('does not remove OPFS and ignores missing device directory names', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });

    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();

    await service.removeDeviceDirectory(OPFSName);
    await service.removeDeviceDirectory('Missing');
    await service.removeDeviceDirectory('Work');

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
});
