import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import {
  DEVICE_FILES_ROOT_NAME,
  DeviceFileSystemProvider,
  type DeviceFileDisplayRecord,
  type MountedDeviceFileRecord,
} from '@shared/lib/deviceFileSystemProvider';
import { zodIs } from '@shared/lib/validateZodScheme';
import {
  WebFileSystemProvider,
  type WebFileSystemAccessMode,
} from '@shared/lib/webFileSystemProvider';
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
import { generateId } from '@shared/lib/generateId';
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
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  mode: WebFileSystemAccessMode;
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
  const pendingDeviceDirectoryAccessRequestIdsByKey = new Map<string, string>();
  const getPendingRequestKey = (name: string, mode: WebFileSystemAccessMode) => `${name}:${mode}`;
  const upsertPendingDeviceDirectoryAccessRequest = ({
    handle,
    mode,
    name,
  }: Omit<DeviceDirectoryAccessRequest, 'id'>) => {
    const key = getPendingRequestKey(name, mode);
    const existingRequestId = pendingDeviceDirectoryAccessRequestIdsByKey.get(key);

    if (existingRequestId) {
      const existingRequest = pendingDeviceDirectoryAccessRequests.get(existingRequestId);

      if (existingRequest) {
        const nextRequest = {
          ...existingRequest,
          handle,
        };

        pendingDeviceDirectoryAccessRequests.set(existingRequestId, nextRequest);
        return nextRequest;
      }
    }

    const request = {
      id: generateId('deviceDirectoryAccessRequest'),
      name,
      handle,
      mode,
    } satisfies DeviceDirectoryAccessRequest;

    pendingDeviceDirectoryAccessRequests.set(request.id, request);
    pendingDeviceDirectoryAccessRequestIdsByKey.set(key, request.id);

    return request;
  };
  const deletePendingDeviceDirectoryAccessRequest = (id: string) => {
    const request = pendingDeviceDirectoryAccessRequests.get(id);

    if (!request) {
      return false;
    }

    pendingDeviceDirectoryAccessRequests.delete(id);
    pendingDeviceDirectoryAccessRequestIdsByKey.delete(
      getPendingRequestKey(request.name, request.mode),
    );

    return true;
  };
  const clearPendingDeviceDirectoryAccessRequestsForName = (name: string) => {
    for (const [id, request] of pendingDeviceDirectoryAccessRequests.entries()) {
      if (request.name === name) {
        deletePendingDeviceDirectoryAccessRequest(id);
      }
    }
  };
  const deviceFileSystemProvider = DeviceFileSystemProvider({
    createProvider: (record) =>
      record.kind === 'localDirectory'
        ? WebFileSystemProvider(record.handle, {
            onAccessRequired: ({ handle, mode }) => {
              const request = upsertPendingDeviceDirectoryAccessRequest({
                name: record.name,
                handle,
                mode,
              });

              return {
                mode: request.mode,
                requestId: request.id,
                spaceName: request.name,
              };
            },
          })
        : WebFileSystemProvider(record.handle),
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
  ): Promise<MountedDeviceFileRecord> => {
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

    return nextRecord;
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

  const getDeviceDirectoryAccessRequest = (id: string) =>
    Promise.resolve(pendingDeviceDirectoryAccessRequests.get(id));

  const resolveDeviceDirectoryAccessRequest = ({
    id,
    permissionState,
  }: {
    id: string;
    permissionState: PermissionState;
  }) => {
    const request = pendingDeviceDirectoryAccessRequests.get(id);

    if (!request) {
      return Promise.resolve({
        request: undefined,
        status: 'missing' as const,
      });
    }

    if (permissionState === 'granted') {
      deletePendingDeviceDirectoryAccessRequest(id);

      return Promise.resolve({
        request,
        status: 'granted' as const,
      });
    }

    return Promise.resolve({
      request,
      status: permissionState === 'denied' ? ('denied' as const) : ('cancelled' as const),
    });
  };

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
    getDeviceDirectoryAccessRequest,
    resolveDeviceDirectoryAccessRequest,
    deviceFiles: fromObservable(activeDeviceFiles$),
  };
};

/**
 * Exposes the singleton UI-facing file-system service state and commands.
 * @returns Shared file-system service instance for the current app runtime.
 */
export const useFileSystemService = createGlobalState(setupFileSystemService);
