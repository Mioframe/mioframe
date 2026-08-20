import {
  inspectMioframeSpaceDirectory,
  isAutomergeStorageFileName,
  type MioframeSpaceInspection,
} from '@shared/lib/automergeAdapter';
import {
  DEVICE_FILES_ROOT_NAME,
  DeviceFileSystemProvider,
  type DeviceFileDisplayRecord,
  type MountedDeviceFileRecord,
} from '@shared/lib/deviceFileSystemProvider';
import { DomainError } from '@shared/lib/error';
import { FileSystemServiceErrorCode } from './fileSystemContracts';
import type {
  DeviceDirectoryRecoveryTarget,
  ReadDirectoryOptions,
  ReconnectDeviceDirectoryResult,
  RelocateRememberedDeviceDirectoryResult,
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

const MARKER_INSPECTION_FAILED_MESSAGE =
  'Could not inspect this folder. Try again from this action.';

const reportWebFileSystemDiagnosticStep = (event: WebFileSystemDiagnosticStep): void => {
  addWebFileSystemDiagnosticStepBreadcrumb(event);
  addWebFileSystemReadDiagnosticStepBreadcrumb(event);
};

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();
  const deviceFilesPath = PathUtils.join('/', DEVICE_FILES_ROOT_NAME);
  const registry = createFileSystemAccessRequestRegistry({ deviceFilesPath });

  // Opaque runtime recovery key per mounted `localDirectory` provider instance, keyed by mounted
  // name. Minted once per genuinely new provider (see `createProvider` below), which is exactly
  // when a mounted name starts identifying a different provider instance. Runtime-only: never
  // persisted, never exposed through display records or diagnostics.
  const recoveryKeysByName = new Map<string, string>();

  const isCurrentRecoveryTarget = ({ spaceName, recoveryKey }: DeviceDirectoryRecoveryTarget) =>
    recoveryKeysByName.get(spaceName) === recoveryKey;

  const deviceFileSystemProvider = DeviceFileSystemProvider({
    createProvider: (record) => {
      if (record.kind !== 'localDirectory') {
        return createOriginPrivateStorageProvider(record.handle);
      }

      const recoveryKey = crypto.randomUUID();
      recoveryKeysByName.set(record.name, recoveryKey);

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
        onUnavailableRoot: () => ({ spaceName: record.name, recoveryKey }),
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

  // Persists and remounts a proven same-entry replacement handle under its existing mounted name.
  const persistAndRemountSameEntry = async ({
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

  const inspectMioframeSpaceCandidate = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<MioframeSpaceInspection> => {
    try {
      return await inspectMioframeSpaceDirectory(handle);
    } catch (error) {
      throw new DomainError(MARKER_INSPECTION_FAILED_MESSAGE, {
        cause: error,
        code: FileSystemServiceErrorCode.markerInspectionFailed,
      });
    }
  };

  const reconnectDeviceDirectory = async ({
    handle,
    spaceName,
    recoveryKey,
  }: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
    recoveryKey: string;
  }): Promise<ReconnectDeviceDirectoryResult> => {
    await deviceFilesReady;

    const records = await getRecordList();
    const existingRecord = records.find((record) => record.name === spaceName);

    if (!existingRecord) {
      return { status: 'missingRecord' };
    }

    if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
      return { status: 'staleRecovery' };
    }

    let isSameEntry: boolean;
    try {
      isSameEntry =
        typeof existingRecord.handle.isSameEntry === 'function' &&
        (await existingRecord.handle.isSameEntry(handle));
    } catch {
      isSameEntry = false;
    }

    if (isSameEntry) {
      // Revalidate immediately before mutation: the target may have been replaced while
      // `isSameEntry()` was pending.
      const recheckRecords = await getRecordList();
      const recheckRecord = recheckRecords.find((record) => record.name === spaceName);

      if (!recheckRecord) {
        return { status: 'missingRecord' };
      }
      if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
        return { status: 'staleRecovery' };
      }

      const replacement = await persistAndRemountSameEntry({
        handle,
        records: recheckRecords,
        existingRecord: recheckRecord,
      });

      const mountPath = PathUtils.join(deviceFilesPath, spaceName);
      const settlement = await registry.runWriteRecoveryHandlers({ mountPath, spaceName });
      const status =
        settlement.status === 'flushed' ? 'reconnected' : 'reconnectedWithWriteRecoveryFailure';

      return { status, name: replacement.name };
    }

    // Identity is false or unverifiable: canonical marker inspection decides whether this is an
    // explainable candidate that still needs explicit user confirmation.
    const inspection = await inspectMioframeSpaceCandidate(handle);

    if (!inspection.looksLikeExistingSpace) {
      return { status: 'invalidCandidate' };
    }

    return { status: 'confirmationRequired' };
  };

  // Relocates a remembered record whose locator-different candidate was explicitly confirmed by
  // the user. Allocates a new mounted name (the old name still counts as occupied, so the new
  // name always differs from it), persists the replaced record list first, and only after
  // persistence succeeds unmounts the old runtime path and mounts the selected handle under the
  // new name. The selected storage never becomes reachable through the old VFS path.
  const relocateRememberedDeviceDirectory = async ({
    handle,
    spaceName,
    recoveryKey,
  }: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
    recoveryKey: string;
  }): Promise<RelocateRememberedDeviceDirectoryResult> => {
    await deviceFilesReady;

    const records = await getRecordList();
    const existingRecord = records.find((record) => record.name === spaceName);

    if (!existingRecord) {
      return { status: 'missingRecord' };
    }

    if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
      return { status: 'staleRecovery' };
    }

    const otherRecords = records.filter((record) => record !== existingRecord);
    const matchedOtherRecord = await findRecordByHandle(otherRecords, handle);

    if (matchedOtherRecord) {
      return { status: 'alreadyMounted', name: matchedOtherRecord.name };
    }

    // Revalidate the canonical marker after all asynchronous preflight and after the confirmation
    // pause, immediately before any mutation: the candidate may no longer look like a Mioframe
    // space by the time the user confirms.
    const inspection = await inspectMioframeSpaceCandidate(handle);

    if (!inspection.looksLikeExistingSpace) {
      return { status: 'invalidCandidate' };
    }

    // Revalidate the recovery target again immediately before mutation.
    const recheckRecords = await getRecordList();
    const recheckRecord = recheckRecords.find((record) => record.name === spaceName);

    if (!recheckRecord) {
      return { status: 'missingRecord' };
    }
    if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
      return { status: 'staleRecovery' };
    }

    // The old target name still counts as occupied because `recheckRecord` remains in
    // `recheckRecords` here, so the allocated name always differs from the old mounted name.
    const newName = getUniqueDeviceDirectoryName(handle.name, recheckRecords);
    const nextRecord = { name: newName, handle } satisfies PersistedDeviceDirectoryRecord;
    const nextRecords = recheckRecords.map((record) =>
      record === recheckRecord ? nextRecord : record,
    );

    await updateRecordList(nextRecords);

    deviceFileSystemProvider.removeRecord(recheckRecord.name);
    recoveryKeysByName.delete(recheckRecord.name);
    deviceFileSystemProvider.upsertRecord({
      name: newName,
      kind: 'localDirectory',
      handle,
    });
    registry.clearForSpace(recheckRecord.name);
    syncActiveDeviceFiles();

    return { status: 'relocated', name: newName };
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
    recoveryKeysByName.delete(name);
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
    relocateRememberedDeviceDirectory,
    inspectMioframeSpaceCandidate,
    getFileSystemAccessRequest: registry.getRequest,
    getTemporaryFileSystemAccessHandle: registry.prepareHandle,
    registerWriteAccessRecoveryHandler: registry.registerWriteRecoveryHandler,
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
