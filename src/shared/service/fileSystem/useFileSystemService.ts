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
  type FileSystemAccessRequestRegistry,
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

  // Serializes fileSystem-owned mounted-directory topology mutations (`addDeviceDirectory`,
  // `removeDeviceDirectory`, the topology-changing commit portion of same-entry reconnect, and
  // confirmed relocation) within this service instance, so a mutation turn always observes the
  // current topology instead of a snapshot taken before an earlier turn committed. Runtime-only:
  // not a persisted lock, VFS lock, or cross-runtime synchronization mechanism. Releases after both
  // success and failure so a rejected mutation cannot block later mutations.
  let mutationQueueTail: Promise<void> = Promise.resolve();

  const enqueueMutation = <T>(task: () => Promise<T>): Promise<T> => {
    // `mutationQueueTail` always fulfills (see below), so chaining with a single `onFulfilled`
    // handler is sufficient to run `task` after the previous mutation turn settles either way.
    const result = mutationQueueTail.then(task);

    mutationQueueTail = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  };

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
        onAccessRequired: ({ handle, mode }) => {
          // An operation started on this provider instance can still be pending when the
          // provider is removed/replaced (see `addDeviceDirectory`/`removeDeviceDirectory`
          // below, which delete this name's entry in `recoveryKeysByName`). A late callback must
          // not create or overwrite a request already registered by the current same-name
          // provider, so this currentness check runs synchronously before any registry mutation.
          if (!isCurrentRecoveryTarget({ spaceName: record.name, recoveryKey })) {
            return undefined;
          }

          return registry.upsertRequest({
            spaceName: record.name,
            handle,
            mode,
            recoveryKey,
            refreshProvider: () => notifyHolder.fn(),
          });
        },
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

    return enqueueMutation(async () => {
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

      if (existingRecord) {
        // A rename always replaces the provider (`DeviceFileSystemProvider.upsertRecord` looks up
        // its internal reuse check by name, so a new name never matches); a same-name add only
        // replaces it when the handle reference differs, since that is exactly when `createProvider`
        // (and the recoveryKey it mints) runs again. A literal same-reference re-add is a true
        // non-replacement and must leave the still-current provider's recovery state untouched.
        const isProviderReplacement =
          existingRecord.name !== nextRecord.name || existingRecord.handle !== nextRecord.handle;

        if (isProviderReplacement) {
          if (existingRecord.name !== nextRecord.name) {
            deviceFileSystemProvider.removeRecord(existingRecord.name);
          }
          recoveryKeysByName.delete(existingRecord.name);
          registry.clearForSpace(existingRecord.name);
        }
      }

      deviceFileSystemProvider.upsertRecord(nextRecord);
      syncActiveDeviceFiles();

      return {
        name: nextRecord.name,
      };
    });
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
      // Revalidate immediately before mutation, inside the serialized mutation turn: the target
      // may have been replaced by another queued mutation while `isSameEntry()` was pending.
      const commitResult = await enqueueMutation(async () => {
        const recheckRecords = await getRecordList();
        const recheckRecord = recheckRecords.find((record) => record.name === spaceName);

        if (!recheckRecord) {
          return { status: 'missingRecord' as const };
        }
        if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
          return { status: 'staleRecovery' as const };
        }

        const replacement = await persistAndRemountSameEntry({
          handle,
          records: recheckRecords,
          existingRecord: recheckRecord,
        });

        // Settlement runs while this mutation turn still holds the topology queue: cached
        // repositories resolve their mounted provider from the textual VFS path on each IO, so a
        // queued remove/add/replace operation must not be able to reuse this mounted path until
        // settlement has completed, whether it flushes or returns a non-flushed result.
        const mountPath = PathUtils.join(deviceFilesPath, spaceName);
        const settlement = await registry.runWriteRecoveryHandlers({ mountPath, spaceName });
        const settledStatus =
          settlement.status === 'flushed'
            ? ('reconnected' as const)
            : ('reconnectedWithWriteRecoveryFailure' as const);

        return { status: 'committed' as const, replacement, settledStatus };
      });

      if (commitResult.status !== 'committed') {
        return commitResult;
      }

      return { status: commitResult.settledStatus, name: commitResult.replacement.name };
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

    // The entire confirmed-relocation decision runs inside one serialized mutation turn: no other
    // service-owned topology mutation (add/remove/reconnect commit/another relocation) can read or
    // write mounted-directory topology while this turn is in progress, so the `alreadyMounted`
    // versus unique-relocation decision below always reflects the current topology instead of a
    // snapshot taken before an earlier mutation committed.
    return enqueueMutation(async () => {
      const records = await getRecordList();
      const existingRecord = records.find((record) => record.name === spaceName);

      if (!existingRecord) {
        return { status: 'missingRecord' };
      }

      if (!isCurrentRecoveryTarget({ spaceName, recoveryKey })) {
        return { status: 'staleRecovery' };
      }

      // Duplicate-handle detection runs first, while the mutation queue keeps same-runtime
      // topology stable. Canonical marker inspection runs last, immediately before any terminal
      // decision: it is the final external asynchronous preflight, so a candidate that stopped
      // looking like a Mioframe space while duplicate detection was pending cannot be accepted.
      const otherRecords = records.filter((record) => record !== existingRecord);
      const matchedOtherRecord = await findRecordByHandle(otherRecords, handle);

      const inspection = await inspectMioframeSpaceCandidate(handle);

      if (!inspection.looksLikeExistingSpace) {
        return { status: 'invalidCandidate' };
      }

      if (matchedOtherRecord) {
        return { status: 'alreadyMounted', name: matchedOtherRecord.name };
      }

      // The old target name still counts as occupied because `existingRecord` remains in
      // `records` here, so the allocated name always differs from the old mounted name.
      const newName = getUniqueDeviceDirectoryName(handle.name, records);
      const nextRecord = { name: newName, handle } satisfies PersistedDeviceDirectoryRecord;
      const nextRecords = records.map((record) =>
        record === existingRecord ? nextRecord : record,
      );

      await updateRecordList(nextRecords);

      deviceFileSystemProvider.removeRecord(existingRecord.name);
      recoveryKeysByName.delete(existingRecord.name);
      deviceFileSystemProvider.upsertRecord({
        name: newName,
        kind: 'localDirectory',
        handle,
      });
      registry.clearForSpace(existingRecord.name);
      syncActiveDeviceFiles();

      return { status: 'relocated', name: newName };
    });
  };

  const removeDeviceDirectory = async (name: string): Promise<void> => {
    if (name === OPFSName) {
      return;
    }

    await deviceFilesReady;

    return enqueueMutation(async () => {
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
    });
  };

  // Only a `granted` resolution deletes the request, refreshes the provider, and may run
  // registered write-recovery settlement (see `registry.resolve`) — asynchronous work whose
  // correctness depends on the mounted path staying bound to the current provider, so it must
  // run inside the same topology queue as `addDeviceDirectory`/`removeDeviceDirectory`/reconnect/
  // relocation. `denied`/`prompt` resolution never mutates topology and stays outside the queue.
  const resolveFileSystemAccessRequest: FileSystemAccessRequestRegistry['resolve'] = (params) =>
    params.permissionState === 'granted'
      ? enqueueMutation(() => registry.resolve(params))
      : registry.resolve(params);

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
    resolveFileSystemAccessRequest,
    cancelFileSystemAccessRequest: registry.cancel,
    deviceFiles: fromObservable(activeDeviceFiles$),
  };
};

/**
 * Exposes the singleton UI-facing file-system service state and commands.
 * @returns Shared file-system service instance for the current app runtime.
 */
export const useFileSystemService = createGlobalState(setupFileSystemService);
