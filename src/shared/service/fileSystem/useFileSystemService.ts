import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import {
  DEVICE_FILES_ROOT_NAME,
  DeviceFileSystemProvider,
  type DeviceFileDisplayRecord,
  type MountedDeviceFileRecord,
} from '@shared/lib/deviceFileSystemProvider';
import { zodIs } from '@shared/lib/validateZodScheme';
import {
  createMountedWebFileSystemProvider,
  createOriginPrivateStorageProvider,
  type WebFileSystemAccessMode,
} from '@shared/lib/webFileSystemProvider';
import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import type { FSNodeStat, IFileSystemProvider } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem, PathUtils } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { OPFSName } from '../directories';
import { createGlobalState } from '@vueuse/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';
import { isEqual, sortBy } from 'es-toolkit';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import { fromObservable } from '@shared/lib/useObservable';
import {
  type PersistedDeviceDirectoryRecord,
  useFileSystemDirectoryHandleService,
} from './setupFileSystemDirectoryHandleService';

/**
 * UI-facing options for reading directory content through the shared file-system service.
 */
export interface ReadDirectoryOptions {
  /** Hides Automerge sidecar files from the returned listing. */
  hideAutomergeFiles?: boolean;
}

export { DEVICE_FILES_ROOT_NAME };
export type { DeviceFileDisplayRecord };

type DeviceDirectoryAccessRequest = {
  spaceName: string;
  handle: FileSystemDirectoryHandle;
  mode: WebFileSystemAccessMode;
  refreshProvider: () => void;
};

type DeviceDirectoryAccessRequestKey = Pick<DeviceDirectoryAccessRequest, 'spaceName' | 'mode'>;

/** Service-internal result used when resolving a pending request with a known permissionState. */
type DeviceDirectoryAccessRequestResolveResult = DeviceDirectoryAccessRequestKey & {
  handle: FileSystemDirectoryHandle;
};

const didPersistedDeviceDirectoryRecordsChange = (
  nextRecords: PersistedDeviceDirectoryRecord[],
  previousRecords: PersistedDeviceDirectoryRecord[],
) =>
  nextRecords.length !== previousRecords.length ||
  nextRecords.some((record, index) => {
    const previousRecord = previousRecords[index];
    return (
      previousRecord === undefined ||
      record.name !== previousRecord.name ||
      record.handle !== previousRecord.handle
    );
  });

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();
  const pendingDeviceDirectoryAccessRequests = new Map<string, DeviceDirectoryAccessRequest>();
  const getPendingRequestKey = ({ mode, spaceName }: DeviceDirectoryAccessRequestKey) =>
    `${spaceName}:${mode}`;
  const upsertPendingDeviceDirectoryAccessRequest = ({
    handle,
    mode,
    refreshProvider,
    spaceName,
  }: DeviceDirectoryAccessRequestResolveResult &
    Pick<DeviceDirectoryAccessRequest, 'refreshProvider'>) => {
    const key = getPendingRequestKey({
      mode,
      spaceName,
    });

    const request = {
      spaceName,
      handle,
      mode,
      refreshProvider,
    } satisfies DeviceDirectoryAccessRequest;

    pendingDeviceDirectoryAccessRequests.set(key, request);

    return request;
  };
  const deletePendingDeviceDirectoryAccessRequest = (key: DeviceDirectoryAccessRequestKey) => {
    return pendingDeviceDirectoryAccessRequests.delete(getPendingRequestKey(key));
  };
  const clearPendingDeviceDirectoryAccessRequestsForName = (spaceName: string) => {
    for (const [key, request] of pendingDeviceDirectoryAccessRequests.entries()) {
      if (request.spaceName === spaceName) {
        pendingDeviceDirectoryAccessRequests.delete(key);
      }
    }
  };
  const deviceFileSystemProvider = DeviceFileSystemProvider({
    createProvider: (record) => {
      if (record.kind !== 'localDirectory') {
        return createOriginPrivateStorageProvider(record.handle);
      }

      // Use a holder so the refresh callback does not capture the provider variable
      // from the same expression that assigns it.
      const notifyHolder: { fn: () => void } = { fn: () => undefined };
      const provider = createMountedWebFileSystemProvider({
        kind: record.kind,
        rootHandle: record.handle,
        onAccessRequired: ({ handle, mode }) => {
          const request = upsertPendingDeviceDirectoryAccessRequest({
            spaceName: record.name,
            handle,
            mode,
            refreshProvider: () => {
              notifyHolder.fn();
            },
          });

          return {
            mode: request.mode,
            spaceName: request.spaceName,
          };
        },
      });

      notifyHolder.fn = () => {
        provider.notifyAccessChanged();
      };

      return provider;
    },
  });
  const { getRecordList, updateRecordList } = useFileSystemDirectoryHandleService();
  const activeDeviceFiles$ = new BehaviorSubject<DeviceFileDisplayRecord[]>([]);
  const deviceFilesPath = PathUtils.join('/', DEVICE_FILES_ROOT_NAME);

  const syncActiveDeviceFiles = () => {
    activeDeviceFiles$.next(deviceFileSystemProvider.listDisplayRecords());
  };

  const mountProvider = async (path: string, provider: IFileSystemProvider) => {
    await vfs.createDirectory(path);
    vfs.mount(path, provider);
  };

  const directoryContent$ = defineCacheObservable(
    ({
      options: { hideAutomergeFiles = false } = {},
      path,
    }: {
      path: string;
      options?: ReadDirectoryOptions | undefined;
    }) =>
      new Observable<[string, FSNodeStat][] | Error>((subscriber) => {
        const fetchEntries = async () => {
          try {
            const entries = await vfs.readDirectory(path);

            subscriber.next(sortBy(entries, [0]));
          } catch (err) {
            if (err instanceof Error) {
              subscriber.next(err);
            } else {
              subscriber.error(err);
            }
          }
        };

        void fetchEntries();

        const unwatch = vfs.watch(path, () => {
          void fetchEntries();
        });

        return () => {
          unwatch();
        };
      }).pipe(
        distinctUntilChanged((a, b) => isEqual(a, b)),
        shareReplay({ bufferSize: 1, refCount: true }),
        map((payload) => {
          if (payload instanceof Error) {
            return payload;
          }
          if (hideAutomergeFiles) {
            return payload.filter(([name]) => !zodIs(name, zodAutomergeFileName));
          }
          return payload;
        }),
      ),
  );

  const fsNodeStat$ = defineCacheObservable(({ path }: { path: string }) =>
    new Observable<FSNodeStat | Error>((subscriber) => {
      const fetchStat = async () => {
        try {
          const stat = await vfs.stat(path);

          subscriber.next(stat);
        } catch (err) {
          if (err instanceof Error) {
            subscriber.next(err);
          } else {
            subscriber.error(err);
          }
        }
      };

      void fetchStat();

      const unwatch = vfs.watch(path, () => fetchStat());

      return () => {
        unwatch();
      };
    }).pipe(
      distinctUntilChanged((a, b) => isEqual(a, b)),
      shareReplay({ bufferSize: 1, refCount: true }),
    ),
  );

  const createDirectory = (path: string) => vfs.createDirectory(path);

  vfs.mount('/', new MemoryFileSystem());

  void vfs.createDirectory('/temp');

  const hydrateDeviceDirectories = async () => {
    const records = await getRecordList();
    const normalizedRecords: PersistedDeviceDirectoryRecord[] = [];

    records.forEach((record) => {
      const nextName = getUniqueDeviceDirectoryName(record.name, normalizedRecords);

      normalizedRecords.push({
        ...record,
        name: nextName,
      });
    });
    normalizedRecords.forEach((record) => {
      deviceFileSystemProvider.upsertRecord({
        ...record,
        kind: 'localDirectory',
      });
    });

    if (didPersistedDeviceDirectoryRecordsChange(normalizedRecords, records)) {
      await updateRecordList(normalizedRecords);
    }

    syncActiveDeviceFiles();
  };

  const mountOpfs = async () => {
    const fileSystemDirectoryHandle = await navigator.storage?.getDirectory();
    if (fileSystemDirectoryHandle) {
      deviceFileSystemProvider.upsertRecord({
        name: OPFSName,
        kind: 'browserStorage',
        handle: fileSystemDirectoryHandle,
      });
    }
  };

  const mountDeviceFiles = async () => {
    await mountProvider(deviceFilesPath, deviceFileSystemProvider);
    await mountOpfs();
    await hydrateDeviceDirectories();
  };

  const deviceFilesReady = mountDeviceFiles();

  void deviceFilesReady;

  const move = (oldPath: string, newPath: string) => vfs.move(oldPath, newPath);

  const remove = (path: string, recursive?: boolean) => vfs.delete(path, recursive);

  const acknowledgeVfsActivityError = () => {
    vfs.acknowledgeActivityError();
  };

  const getUniqueDeviceDirectoryName = (
    baseName: string,
    records: PersistedDeviceDirectoryRecord[],
    ignoredRecord?: PersistedDeviceDirectoryRecord,
  ) => {
    const isTaken = (name: string) =>
      name === OPFSName ||
      records.some((record) => record !== ignoredRecord && record.name === name);

    if (!isTaken(baseName)) {
      return baseName;
    }

    let index = 2;

    while (isTaken(`${baseName} (${index})`)) {
      index += 1;
    }

    return `${baseName} (${index})`;
  };

  const findRecordByHandle = async (
    records: PersistedDeviceDirectoryRecord[],
    handle: FileSystemDirectoryHandle,
  ) => {
    const matchedIndex = (
      await Promise.all(records.map((record) => record.handle.isSameEntry(handle)))
    ).findIndex(Boolean);

    return matchedIndex >= 0 ? records[matchedIndex] : undefined;
  };

  const addDeviceDirectory = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<{ name: string }> => {
    await deviceFilesReady;

    const records = await getRecordList();
    const existingRecord = await findRecordByHandle(records, handle);
    const nextRecord = {
      name: getUniqueDeviceDirectoryName(handle.name, records, existingRecord),
      kind: 'localDirectory',
      handle,
    } satisfies MountedDeviceFileRecord;
    const nextPersistedRecord = {
      name: nextRecord.name,
      handle: nextRecord.handle,
    } satisfies PersistedDeviceDirectoryRecord;

    const nextRecords = existingRecord
      ? records.map((record) => (record === existingRecord ? nextPersistedRecord : record))
      : [...records, nextPersistedRecord];

    await updateRecordList(nextRecords);

    if (existingRecord && existingRecord.name !== nextRecord.name) {
      deviceFileSystemProvider.removeRecord(existingRecord.name);
    }

    deviceFileSystemProvider.upsertRecord(nextRecord);
    syncActiveDeviceFiles();

    return {
      name: nextRecord.name,
    };
  };

  const removeDeviceDirectory = async (name: string): Promise<void> => {
    if (name === OPFSName) {
      return;
    }

    await deviceFilesReady;

    const records = await getRecordList();
    const nextRecords = records.filter((record) => record.name !== name);

    if (nextRecords.length === records.length) {
      return;
    }

    await updateRecordList(nextRecords);
    deviceFileSystemProvider.removeRecord(name);
    clearPendingDeviceDirectoryAccessRequestsForName(name);
    syncActiveDeviceFiles();
  };

  const getDeviceDirectoryAccessRequest = ({
    mode,
    spaceName,
  }: DeviceDirectoryAccessRequestKey): Promise<DeviceDirectoryAccessRequestKey | undefined> =>
    Promise.resolve(
      pendingDeviceDirectoryAccessRequests.get(
        getPendingRequestKey({
          mode,
          spaceName,
        }),
      ),
    ).then((request) =>
      request
        ? {
            mode: request.mode,
            spaceName: request.spaceName,
          }
        : undefined,
    );

  const resolveDeviceDirectoryAccessRequest = ({
    mode,
    permissionState,
    spaceName,
  }: {
    mode: WebFileSystemAccessMode;
    permissionState: PermissionState;
    spaceName: string;
  }) => {
    const key = {
      mode,
      spaceName,
    } satisfies DeviceDirectoryAccessRequestKey;
    const request = pendingDeviceDirectoryAccessRequests.get(getPendingRequestKey(key));

    if (!request) {
      return Promise.resolve({
        status: 'missing' as const,
      });
    }

    if (permissionState === 'granted') {
      deletePendingDeviceDirectoryAccessRequest(key);
      request.refreshProvider();

      return Promise.resolve({
        status: 'granted' as const,
      });
    }

    return Promise.resolve({
      status: permissionState === 'denied' ? ('denied' as const) : ('cancelled' as const),
    });
  };

  const requestDeviceDirectoryAccessPermission = async ({
    mode,
    spaceName,
  }: DeviceDirectoryAccessRequestKey): Promise<{
    status: 'granted' | 'denied' | 'cancelled' | 'error';
  }> => {
    const request = pendingDeviceDirectoryAccessRequests.get(
      getPendingRequestKey({ mode, spaceName }),
    );

    if (!request) {
      return { status: 'error' };
    }

    let permissionState: PermissionState;

    try {
      permissionState = await request.handle.requestPermission({ mode });
    } catch {
      return { status: 'error' };
    }

    const result = await resolveDeviceDirectoryAccessRequest({ mode, permissionState, spaceName });

    return {
      status: result.status === 'missing' ? 'error' : result.status,
    };
  };

  const cancelDeviceDirectoryAccessRequest = (key: DeviceDirectoryAccessRequestKey) =>
    Promise.resolve(deletePendingDeviceDirectoryAccessRequest(key));

  const operationToMode = (operation: FileSystemAccessOperation): WebFileSystemAccessMode =>
    operation === 'write' ? 'readwrite' : 'read';

  const getFileSystemAccessRequest = (key: {
    operation: FileSystemAccessOperation;
    spaceName: string;
  }) =>
    getDeviceDirectoryAccessRequest({
      mode: operationToMode(key.operation),
      spaceName: key.spaceName,
    }).then((request) =>
      request ? { operation: key.operation, spaceName: request.spaceName } : undefined,
    );

  const requestFileSystemAccess = (key: {
    operation: FileSystemAccessOperation;
    spaceName: string;
  }) =>
    requestDeviceDirectoryAccessPermission({
      mode: operationToMode(key.operation),
      spaceName: key.spaceName,
    });

  const cancelFileSystemAccessRequest = (key: {
    operation: FileSystemAccessOperation;
    spaceName: string;
  }) =>
    cancelDeviceDirectoryAccessRequest({
      mode: operationToMode(key.operation),
      spaceName: key.spaceName,
    });

  return {
    vfs,

    createDirectory,
    directoryContent$,
    directoryContent: defineObservableQuery(directoryContent$),
    fsNodeStat$,
    fsNodeStat: defineObservableQuery(fsNodeStat$),
    vfsActivity: fromObservable(vfs.activity$),
    acknowledgeVfsActivityError,
    move,
    delete: remove,
    remove,
    addDeviceDirectory,
    removeDeviceDirectory,
    getFileSystemAccessRequest,
    requestFileSystemAccess,
    cancelFileSystemAccessRequest,
    deviceFiles: fromObservable(activeDeviceFiles$),
  };
};

/**
 * Exposes the singleton UI-facing file-system service state and commands.
 * @returns Shared file-system service instance for the current app runtime.
 */
export const useFileSystemService = createGlobalState(setupFileSystemService);
