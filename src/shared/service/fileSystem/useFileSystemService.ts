import { isAutomergeStorageFileName } from '@shared/lib/automergeAdapter';
import {
  DEVICE_FILES_ROOT_NAME,
  DeviceFileSystemProvider,
  type DeviceFileDisplayRecord,
  type MountedDeviceFileRecord,
} from '@shared/lib/deviceFileSystemProvider';
import type {
  ReadDirectoryOptions,
  ReconnectDeviceDirectoryResult,
  ReplaceRememberedDeviceDirectoryResult,
} from './fileSystemContracts';
import {
  createMountedWebFileSystemProvider,
  createOriginPrivateStorageProvider,
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
import {
  type PersistedDeviceDirectoryRecord,
  useFileSystemDirectoryHandleService,
} from './setupFileSystemDirectoryHandleService';
import {
  createFileSystemAccessRequestRegistry,
  type WriteAccessRecoveryHandler,
} from './fileSystemAccessRequestRegistry';
import { addWebFileSystemDiagnosticStepBreadcrumb } from './webFileSystemWriteDiagnostics';
import { addWebFileSystemReadDiagnosticStepBreadcrumb } from './webFileSystemReadDiagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';
import { DomainError } from '@shared/lib/error';
import { FileSystemServiceErrorCode } from './fileSystemServiceErrorCode';

/**
 * Safe service-internal context describing the mount a confirmed locator-different replacement
 * targets.
 *
 * Internal service-to-service contract only. Not exported through `./index`, `@shared/service`,
 * or the worker/client surface.
 */
export interface ConfirmedReplacementLeaseContext {
  /** Absolute VFS mount path the confirmed replacement would target. */
  mountPath: string;
}

/**
 * Outcome of a confirmed-replacement lease acquisition attempt.
 * - `acquired` — the mount was reserved; call `release()` unconditionally once the replacement
 *   critical section (persistence, remount, cleanup, display sync) completes or fails.
 * - `repositoryStateActive` — a repository is already cached at or under the mount; the
 *   replacement must be rejected with zero mutation.
 *
 * Internal service-to-service contract only. Not exported through `./index`, `@shared/service`,
 * or the worker/client surface.
 */
export type ConfirmedReplacementLeaseAcquisition =
  | { status: 'acquired'; release: () => void }
  | { status: 'repositoryStateActive' };

/**
 * Repository-owned provider that atomically checks its cache and reserves a mount before a
 * confirmed locator-different directory replacement mutates persisted or runtime state.
 *
 * Internal service-to-service contract only. Not exported through `./index`, `@shared/service`,
 * or the worker/client surface.
 * @param context - {@link ConfirmedReplacementLeaseContext} for the target mount.
 * @returns A promise resolving to the {@link ConfirmedReplacementLeaseAcquisition} outcome.
 */
export type ConfirmedReplacementLeaseProvider = (
  context: ConfirmedReplacementLeaseContext,
) => Promise<ConfirmedReplacementLeaseAcquisition>;

export { DEVICE_FILES_ROOT_NAME };
export type { DeviceFileDisplayRecord, ReadDirectoryOptions, WriteAccessRecoveryHandler };

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

const reportWebFileSystemDiagnosticStep = (event: WebFileSystemDiagnosticStep): void => {
  addWebFileSystemDiagnosticStepBreadcrumb(event);
  addWebFileSystemReadDiagnosticStepBreadcrumb(event);
};

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();
  const deviceFilesPath = PathUtils.join('/', DEVICE_FILES_ROOT_NAME);
  const registry = createFileSystemAccessRequestRegistry({ deviceFilesPath });

  // Repositories registers the one confirmed-replacement lease provider at service setup.
  // This is a narrow service-internal registration, kept out of the access-request registry
  // (which stays focused on access requests and write-recovery execution) and out of the
  // published worker/client surface.
  let confirmedReplacementLeaseProvider: ConfirmedReplacementLeaseProvider | undefined;

  const registerConfirmedReplacementLeaseProvider = (
    provider: ConfirmedReplacementLeaseProvider,
  ) => {
    confirmedReplacementLeaseProvider = provider;
    return () => {
      if (confirmedReplacementLeaseProvider === provider) {
        confirmedReplacementLeaseProvider = undefined;
      }
    };
  };
  const deviceFileSystemProvider = DeviceFileSystemProvider({
    createProvider: (record) => {
      if (record.kind !== 'localDirectory') {
        return createOriginPrivateStorageProvider(record.handle);
      }

      // Use a holder so the refresh callback does not capture the provider variable
      // from the same expression that assigns it.
      const notifyHolder: { fn: () => Promise<void> } = {
        fn: () => Promise.resolve(),
      };
      const provider = createMountedWebFileSystemProvider({
        kind: record.kind,
        rootHandle: record.handle,
        onAccessRequired: ({ handle, mode }) =>
          registry.upsertRequest({
            spaceName: record.name,
            handle,
            mode,
            refreshProvider: () => notifyHolder.fn(),
          }),
        onUnavailableRoot: () => ({ spaceName: record.name }),
        onDiagnosticStep: reportWebFileSystemDiagnosticStep,
      });

      notifyHolder.fn = () => provider.notifyAccessChanged();

      return provider;
    },
  });
  const { getRecordList, updateRecordList } = useFileSystemDirectoryHandleService();
  const activeDeviceFiles$ = new BehaviorSubject<DeviceFileDisplayRecord[]>([]);

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
            return payload.filter(([name]) => !isAutomergeStorageFileName(name));
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

  // Shared persist+mount+cleanup step; callers already resolved the existing record and, for
  // locator-different replacement, already hold the confirmed-replacement lease.
  const persistAndMountReplacement = async ({
    existingRecord,
    handle,
    records,
  }: {
    existingRecord: PersistedDeviceDirectoryRecord;
    handle: FileSystemDirectoryHandle;
    records: PersistedDeviceDirectoryRecord[];
  }): Promise<{ status: 'reconnected'; name: string }> => {
    const nextRecord = {
      name: existingRecord.name,
      handle,
    } satisfies PersistedDeviceDirectoryRecord;
    const nextRecords = records.map((record) => (record === existingRecord ? nextRecord : record));

    await updateRecordList(nextRecords);

    deviceFileSystemProvider.upsertRecord({
      name: nextRecord.name,
      kind: 'localDirectory',
      handle: nextRecord.handle,
    });
    registry.clearForSpace(nextRecord.name);
    syncActiveDeviceFiles();

    return { status: 'reconnected', name: nextRecord.name };
  };

  const reconnectDeviceDirectory = async ({
    handle,
    spaceName,
  }: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
  }): Promise<ReconnectDeviceDirectoryResult> => {
    await deviceFilesReady;

    const records = await getRecordList();
    const existingRecord = records.find((record) => record.name === spaceName);

    if (!existingRecord) {
      return { status: 'missingRecord' };
    }

    let isSameEntry: boolean;
    try {
      if (typeof existingRecord.handle.isSameEntry !== 'function') {
        return { status: 'confirmationRequired' };
      }
      isSameEntry = await existingRecord.handle.isSameEntry(handle);
    } catch {
      return { status: 'confirmationRequired' };
    }

    if (!isSameEntry) {
      return { status: 'confirmationRequired' };
    }

    const replacement = await persistAndMountReplacement({ handle, records, existingRecord });

    const mountPath = PathUtils.join(deviceFilesPath, spaceName);
    const settlement = await registry.runWriteRecoveryHandlers({ mountPath, spaceName });
    const status =
      settlement.status === 'flushed' ? 'reconnected' : 'reconnectedWithWriteRecoveryFailure';

    return { status, name: replacement.name };
  };

  const replaceRememberedDeviceDirectory = async ({
    handle,
    spaceName,
  }: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
  }): Promise<ReplaceRememberedDeviceDirectoryResult> => {
    await deviceFilesReady;

    const records = await getRecordList();
    const existingRecord = records.find((record) => record.name === spaceName);

    if (!existingRecord) {
      return { status: 'missingRecord' };
    }

    if (!confirmedReplacementLeaseProvider) {
      // Repository exclusion is a data-safety invariant: never proceed without it.
      throw new DomainError('Folder replacement is temporarily unavailable', {
        code: FileSystemServiceErrorCode.confirmedReplacementLeaseUnavailable,
      });
    }

    const mountPath = PathUtils.join(deviceFilesPath, spaceName);
    const lease = await confirmedReplacementLeaseProvider({ mountPath });

    if (lease.status === 'repositoryStateActive') {
      return { status: 'repositoryStateActive' };
    }

    try {
      // Consume the already-read records/existingRecord; no second persisted-record read
      // after lease acquisition.
      return await persistAndMountReplacement({ handle, records, existingRecord });
    } finally {
      lease.release();
    }
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
    registry.clearForSpace(name);
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
    reconnectDeviceDirectory,
    replaceRememberedDeviceDirectory,
    getFileSystemAccessRequest: registry.getRequest,
    getTemporaryFileSystemAccessHandle: registry.prepareHandle,
    registerWriteAccessRecoveryHandler: registry.registerWriteRecoveryHandler,
    registerConfirmedReplacementLeaseProvider,
    resolveFileSystemAccessRequest: registry.resolve,
    cancelFileSystemAccessRequest: registry.cancel,
    deviceFiles: fromObservable(activeDeviceFiles$),
  };
};

/**
 * Exposes the singleton UI-facing file-system service state and commands.
 * @returns Shared file-system service instance for the current app runtime.
 */
export const useFileSystemService = createGlobalState(setupFileSystemService);
