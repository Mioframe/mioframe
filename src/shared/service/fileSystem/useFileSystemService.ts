import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import {
  DEVICE_FILES_ROOT_NAME,
  DeviceFileSystemProvider,
  type DeviceFileRecord,
} from '@shared/lib/deviceFileSystemProvider';
import { zodIs } from '@shared/lib/validateZodScheme';
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
export type { DeviceFileRecord };

const LOCAL_DEVICE_DIRECTORY_DESCRIPTION = 'Mioframe space on this device';
const LEGACY_LOCAL_DEVICE_DIRECTORY_DESCRIPTION = 'Directory on this device';
const OPFS_DIRECTORY_DESCRIPTION = 'Saved directly in your browser on this device';

const normalizeDeviceDirectoryDescription = (description?: string) =>
  description === undefined || description === LEGACY_LOCAL_DEVICE_DIRECTORY_DESCRIPTION
    ? LOCAL_DEVICE_DIRECTORY_DESCRIPTION
    : description;

const normalizePersistedDeviceDirectoryRecord = (record: PersistedDeviceDirectoryRecord) => ({
  ...record,
  description: normalizeDeviceDirectoryDescription(record.description),
});

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();
  const deviceFileSystemProvider = DeviceFileSystemProvider();
  const { getRecordList, updateRecordList } = useFileSystemDirectoryHandleService();
  const activeDeviceFiles$ = new BehaviorSubject<DeviceFileRecord[]>([]);
  const deviceFilesPath = PathUtils.join('/', DEVICE_FILES_ROOT_NAME);

  const syncActiveDeviceFiles = () => {
    activeDeviceFiles$.next(deviceFileSystemProvider.listRecords());
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
      const normalizedRecord = normalizePersistedDeviceDirectoryRecord(record);
      const nextName = getUniqueDeviceDirectoryName(normalizedRecord.name, normalizedRecords);

      normalizedRecords.push({
        ...normalizedRecord,
        name: nextName,
      });
    });
    const permissionStates = await Promise.all(
      normalizedRecords.map(async (record) => ({
        permissionState: await record.handle.queryPermission?.({
          mode: 'readwrite',
        }),
        record,
      })),
    );

    permissionStates.forEach(({ permissionState, record }) => {
      if (permissionState === 'granted') {
        deviceFileSystemProvider.upsertRecord(record);
      }
    });

    if (
      normalizedRecords.some((record, index) => record.description !== records[index]?.description)
    ) {
      await updateRecordList(normalizedRecords);
    }

    syncActiveDeviceFiles();
  };

  const mountOpfs = async () => {
    const fileSystemDirectoryHandle = await navigator.storage?.getDirectory();
    if (fileSystemDirectoryHandle) {
      deviceFileSystemProvider.upsertRecord({
        description: OPFS_DIRECTORY_DESCRIPTION,
        name: OPFSName,
        handle: fileSystemDirectoryHandle,
      });
    }
  };

  const mountDeviceFiles = async () => {
    await mountProvider(deviceFilesPath, deviceFileSystemProvider);
    await mountOpfs();
    await hydrateDeviceDirectories();
    syncActiveDeviceFiles();
  };

  void mountDeviceFiles();

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
  ): Promise<DeviceFileRecord> => {
    const records = await getRecordList();
    const existingRecord = await findRecordByHandle(records, handle);
    const nextRecord = {
      description: LOCAL_DEVICE_DIRECTORY_DESCRIPTION,
      name: getUniqueDeviceDirectoryName(handle.name, records, existingRecord),
      handle,
    } satisfies DeviceFileRecord;
    const nextPersistedRecord = {
      description: nextRecord.description,
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

    const records = await getRecordList();
    const nextRecords = records.filter((record) => record.name !== name);

    if (nextRecords.length === records.length) {
      return;
    }

    await updateRecordList(nextRecords);
    deviceFileSystemProvider.removeRecord(name);
    syncActiveDeviceFiles();
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
    deviceFiles: fromObservable(activeDeviceFiles$),
  };
};

/**
 * Exposes the singleton UI-facing file-system service state and commands.
 * @returns Shared file-system service instance for the current app runtime.
 */
export const useFileSystemService = createGlobalState(setupFileSystemService);
