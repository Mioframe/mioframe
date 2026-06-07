import { PathUtils } from '@shared/lib/virtualFileSystem';
import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import type { WebFileSystemAccessMode } from '@shared/lib/webFileSystemProvider';
import type { FileSystemAccessOperation } from '@shared/lib/fileSystem';

type DeviceDirectoryAccessRequest = {
  spaceName: string;
  handle: FileSystemDirectoryHandle;
  mode: WebFileSystemAccessMode;
  refreshProvider: (nextRootHandle?: FileSystemDirectoryHandle) => Promise<void>;
};

type DeviceDirectoryAccessRequestKey = Pick<DeviceDirectoryAccessRequest, 'spaceName' | 'mode'>;

/**
 * Safe permission states used when comparing the stored and returned directory handles.
 */
export type WriteAccessRecoveryHandlePermissionState =
  | 'denied'
  | 'granted'
  | 'prompt'
  | 'queryFailed'
  | 'unsupported';

/**
 * Safe outcome of comparing the stored directory handle with the granted handle.
 */
export type WriteAccessRecoveryHandleComparisonResult =
  | 'differentEntry'
  | 'notCompared'
  | 'queryFailed'
  | 'sameEntry';

/**
 * Safe handle comparison summary for write-access recovery diagnostics.
 */
export interface WriteAccessRecoveryHandleComparison {
  /** Safe result of `isSameEntry()` when comparison was possible. */
  handleComparisonResult: WriteAccessRecoveryHandleComparisonResult;
  /** Safe readwrite permission query result for the returned main-thread handle. */
  returnedHandlePermission: WriteAccessRecoveryHandlePermissionState;
  /** Whether the broker supplied a granted handle back to the service. */
  returnedHandleProvided: 'false' | 'true';
  /** Safe same-entry status, or `unknown` when comparison failed. */
  returnedHandleSameEntry: 'false' | 'true' | 'unknown';
  /** Safe readwrite permission query result for the stored worker-side handle. */
  storedHandlePermission: WriteAccessRecoveryHandlePermissionState;
}

/**
 * Safe classification of a write recovery replay failure.
 * - `accessRequired` – storage is still blocked by a missing browser permission.
 * - `storageFailure` – write access was available but the underlying adapter failed.
 * - `unknown` – failure could not be classified.
 */
export type WriteAccessRecoveryFailureClassification =
  | 'accessRequired'
  | 'storageFailure'
  | 'unknown';

/**
 * Safe replay summary included in non-flushed {@link WriteAccessRecoveryResult} values.
 * Must never expose storage keys, document ids, file names, paths, or raw errors.
 */
export interface WriteAccessRecoveryReplaySummary {
  /** Number of queued saves written successfully during this flush attempt. */
  flushedCount: number;
  /** Number of saves still queued after the flush attempt. */
  pendingCount: number;
  /** Safe classification of the first failure encountered, when available. */
  failureClassification?: WriteAccessRecoveryFailureClassification | undefined;
  /** Safe sanitized summary of the first replay failure when available. */
  error?: SanitizedDiagnosticError | undefined;
}

/**
 * Result returned by a {@link WriteAccessRecoveryHandler} after a write recovery attempt.
 *
 * Indicates whether pending writes were flushed, are still blocked, or failed due to
 * a storage error. Must never expose handles, raw errors, document ids, file names, or bytes.
 */
export type WriteAccessRecoveryResult =
  | {
      /**
       * Outcome of the write recovery attempt:
       * - `flushed` – all pending writes were replayed and stored successfully.
       */
      status: 'flushed';
    }
  | {
      /**
       * Outcome of the write recovery attempt:
       * - `stillBlocked` – writes could not be replayed; the provider access is still blocked.
       * - `failed` – write replay was attempted but storage reported a failure.
       */
      status: 'failed' | 'stillBlocked';
      /** Safe counters and classification for the replay failure. */
      replay?: WriteAccessRecoveryReplaySummary | undefined;
    };

type WriteAccessRecoveryContext = {
  mountPath: string;
  operation: 'write';
  spaceName: string;
};

/**
 * Callback invoked by the registry after write permission is granted for a space.
 *
 * The registry calls each registered handler in sequence with a safe, service-internal
 * context. Handlers must not expose handles, paths outside the service context,
 * raw errors, document ids, file names, or bytes.
 * @param context - Safe service-internal context describing the recovered write space.
 * @returns A {@link WriteAccessRecoveryResult} describing the outcome.
 */
export type WriteAccessRecoveryHandler = (
  context: WriteAccessRecoveryContext,
) => Promise<WriteAccessRecoveryResult>;

/**
 * Identifies a pending browser directory access request by space name and operation.
 *
 * Read and write requests for the same space are tracked independently and do not
 * interfere with each other.
 */
export type FileSystemAccessRequestKey = {
  /** The type of filesystem access being requested. */
  operation: FileSystemAccessOperation;
  /** The name of the space (mounted directory) for which access is requested. */
  spaceName: string;
};

/**
 * Result of resolving a pending access request through the registry.
 *
 * The registry does not call `requestPermission` itself; it receives the browser
 * permission state from the service client and maps it to a safe outcome code.
 * Returned statuses never expose handles, raw errors, document ids, file names,
 * or bytes.
 */
export type ResolveAccessRequestResult =
  | {
      /**
       * Outcome of the resolved request:
       * - `granted` – permission was granted and all applicable recovery handlers succeeded.
       * - `denied` – the browser denied permission; the pending request remains in the registry.
       * - `cancelled` – the prompt was dismissed or permission was non-granted and non-denied;
       *   the pending request remains in the registry for retry.
       * - `missing` – no pending request exists for the given key (stale or already resolved).
       */
      status: 'granted' | 'denied' | 'cancelled' | 'missing';
      comparison?: WriteAccessRecoveryHandleComparison | undefined;
    }
  | {
      /**
       * Outcome of the resolved request:
       * - `grantedWithReplayFailures` – permission granted but a write recovery handler
       *   returned `stillBlocked`.
       * - `grantedWithStorageFailures` – permission granted but a write recovery handler
       *   returned `failed`.
       */
      status: 'grantedWithReplayFailures' | 'grantedWithStorageFailures';
      /** Safe replay summary forwarded from the failing write recovery handler. */
      replay?: WriteAccessRecoveryReplaySummary | undefined;
      /** Safe handle comparison summary when the main thread returned a granted handle. */
      comparison?: WriteAccessRecoveryHandleComparison | undefined;
    };

/**
 * Options passed to {@link createFileSystemAccessRequestRegistry}.
 */
export interface FileSystemAccessRequestRegistryOptions {
  /**
   * Virtual filesystem path prefix for the device-files subtree.
   *
   * Used to construct the mount path passed to write recovery handlers.
   * Must not include space names; the registry appends the space name itself.
   */
  deviceFilesPath: string;
}

/**
 * Service-internal registry for pending browser directory access requests and write
 * recovery handlers.
 *
 * The registry:
 * - stores pending File System Access API directory requests indexed by `{ spaceName, mode }`;
 * - does not call `requestPermission` — that stays on the main thread in the service client;
 * - does not own any UI state;
 * - does not know repository persistence details;
 * - coordinates registered write recovery handlers after a successful write permission grant.
 *
 * Returned statuses never expose handles, raw errors, document ids, file names, or bytes.
 *
 * Created via {@link createFileSystemAccessRequestRegistry}. Intended for use within the
 * file-system service and its service client only.
 */
export interface FileSystemAccessRequestRegistry {
  /**
   * Stores or replaces the pending access request for the given space and mode.
   *
   * If a request for the same `{ spaceName, mode }` already exists it is overwritten.
   * Read and write requests for the same space are stored independently.
   * @param params - Handle, mode, provider refresh callback, and space name.
   * @returns The normalized key identifying the stored request.
   */
  upsertRequest: (params: {
    handle: FileSystemDirectoryHandle;
    mode: WebFileSystemAccessMode;
    refreshProvider: (nextRootHandle?: FileSystemDirectoryHandle) => Promise<void>;
    spaceName: string;
  }) => { spaceName: string; mode: WebFileSystemAccessMode };

  /**
   * Removes all pending requests whose `spaceName` matches the given value.
   *
   * Both read and write requests for the space are removed.
   * @param spaceName - The space whose pending requests should be cleared.
   */
  clearForSpace: (spaceName: string) => void;

  /**
   * Returns the key for a pending request if one exists for the given operation and space,
   * or `undefined` if no matching request is pending.
   *
   * Does not expose the internal handle or provider details.
   * @param key - The operation and space name to look up.
   * @returns A promise resolving to the matching key, or `undefined`.
   */
  getRequest: (key: FileSystemAccessRequestKey) => Promise<FileSystemAccessRequestKey | undefined>;

  /**
   * Returns the handle and key for a pending request if one exists, or `undefined`.
   *
   * The returned handle is the `FileSystemDirectoryHandle` stored for the pending request.
   * It is provided so the service client can call `requestPermission` on the main thread;
   * the registry itself never calls `requestPermission`.
   * @param key - The operation and space name to look up.
   * @returns A promise resolving to the key plus handle, or `undefined` when not found.
   */
  prepareHandle: (
    key: FileSystemAccessRequestKey,
  ) => Promise<(FileSystemAccessRequestKey & { handle: FileSystemDirectoryHandle }) | undefined>;

  /**
   * Resolves a pending access request using the result of a browser permission check.
   *
   * - On `granted`: removes the request, calls `refreshProvider`, and — for write
   *   operations — invokes registered {@link WriteAccessRecoveryHandler}s in order,
   *   stopping at the first failure.
   * - On `denied` or `prompt`: leaves the request in the registry so it can be retried.
   * @param params - Key plus the `PermissionState` result from the browser.
   * @returns A promise resolving to a {@link ResolveAccessRequestResult}.
   */
  resolve: (
    params: FileSystemAccessRequestKey & {
      grantedHandle?: FileSystemDirectoryHandle | undefined;
      permissionState: PermissionState;
    },
  ) => Promise<ResolveAccessRequestResult>;

  /**
   * Cancels a pending request and removes it from the registry.
   * @param key - The operation and space name to cancel.
   * @returns A promise resolving to `true` if the request was found and removed,
   *   or `false` if no matching request existed.
   */
  cancel: (key: FileSystemAccessRequestKey) => Promise<boolean>;

  /**
   * Registers a handler that is called after a successful write permission grant.
   *
   * Handlers are invoked sequentially in registration order. If any handler returns
   * `stillBlocked` or `failed`, the registry stops immediately and returns the
   * corresponding failure status without calling subsequent handlers.
   * @param handler - The {@link WriteAccessRecoveryHandler} to register.
   * @returns An unregister function; calling it removes the handler from the registry.
   */
  registerWriteRecoveryHandler: (handler: WriteAccessRecoveryHandler) => () => void;
}

const operationToMode = (operation: FileSystemAccessOperation): WebFileSystemAccessMode =>
  operation === 'write' ? 'readwrite' : 'read';

const makeRequestKey = ({ mode, spaceName }: DeviceDirectoryAccessRequestKey) =>
  `${spaceName}:${mode}`;

/**
 * Creates a service-internal registry for pending device directory access requests
 * and write access recovery handlers.
 * @param options - {@link FileSystemAccessRequestRegistryOptions}
 * @returns A {@link FileSystemAccessRequestRegistry} instance.
 */
export const createFileSystemAccessRequestRegistry = ({
  deviceFilesPath,
}: FileSystemAccessRequestRegistryOptions): FileSystemAccessRequestRegistry => {
  const pendingRequests = new Map<string, DeviceDirectoryAccessRequest>();
  const writeRecoveryHandlers = new Set<WriteAccessRecoveryHandler>();

  const deleteRequest = (key: DeviceDirectoryAccessRequestKey) =>
    pendingRequests.delete(makeRequestKey(key));

  const upsertRequest = ({
    handle,
    mode,
    refreshProvider,
    spaceName,
  }: {
    handle: FileSystemDirectoryHandle;
    mode: WebFileSystemAccessMode;
    refreshProvider: (nextRootHandle?: FileSystemDirectoryHandle) => Promise<void>;
    spaceName: string;
  }): DeviceDirectoryAccessRequestKey => {
    const key = makeRequestKey({ mode, spaceName });
    pendingRequests.set(key, { spaceName, handle, mode, refreshProvider });
    return { mode, spaceName };
  };

  const clearForSpace = (spaceName: string) => {
    for (const [key, request] of pendingRequests.entries()) {
      if (request.spaceName === spaceName) {
        pendingRequests.delete(key);
      }
    }
  };

  const getRequest = (
    key: FileSystemAccessRequestKey,
  ): Promise<FileSystemAccessRequestKey | undefined> => {
    const request = pendingRequests.get(
      makeRequestKey({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );
    return Promise.resolve(
      request ? { operation: key.operation, spaceName: request.spaceName } : undefined,
    );
  };

  const prepareHandle = (
    key: FileSystemAccessRequestKey,
  ): Promise<(FileSystemAccessRequestKey & { handle: FileSystemDirectoryHandle }) | undefined> => {
    const request = pendingRequests.get(
      makeRequestKey({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );
    return Promise.resolve(
      request
        ? { handle: request.handle, operation: key.operation, spaceName: request.spaceName }
        : undefined,
    );
  };

  const querySafePermissionState = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<WriteAccessRecoveryHandlePermissionState> => {
    if (handle.queryPermission === undefined) {
      return 'unsupported';
    }

    try {
      return await handle.queryPermission({ mode: 'readwrite' });
    } catch {
      return 'queryFailed';
    }
  };

  const compareHandles = async ({
    grantedHandle,
    storedHandle,
  }: {
    grantedHandle: FileSystemDirectoryHandle | undefined;
    storedHandle: FileSystemDirectoryHandle;
  }): Promise<WriteAccessRecoveryHandleComparison | undefined> => {
    if (grantedHandle === undefined) {
      return undefined;
    }

    const storedHandlePermission = await querySafePermissionState(storedHandle);
    const returnedHandlePermission = await querySafePermissionState(grantedHandle);

    try {
      const sameEntry = await storedHandle.isSameEntry(grantedHandle);
      return {
        returnedHandleProvided: 'true',
        returnedHandleSameEntry: sameEntry ? 'true' : 'false',
        storedHandlePermission,
        returnedHandlePermission,
        handleComparisonResult: sameEntry ? 'sameEntry' : 'differentEntry',
      };
    } catch {
      return {
        returnedHandleProvided: 'true',
        returnedHandleSameEntry: 'unknown',
        storedHandlePermission,
        returnedHandlePermission,
        handleComparisonResult: 'queryFailed',
      };
    }
  };

  const resolve = async ({
    grantedHandle,
    operation,
    permissionState,
    spaceName,
  }: FileSystemAccessRequestKey & {
    grantedHandle?: FileSystemDirectoryHandle | undefined;
    permissionState: PermissionState;
  }): Promise<ResolveAccessRequestResult> => {
    const mode = operationToMode(operation);
    const requestKey = { mode, spaceName } satisfies DeviceDirectoryAccessRequestKey;
    const request = pendingRequests.get(makeRequestKey(requestKey));

    if (!request) {
      return { status: 'missing' };
    }

    if (permissionState !== 'granted') {
      return { status: permissionState === 'denied' ? 'denied' : 'cancelled' };
    }

    const comparison = await compareHandles({
      grantedHandle,
      storedHandle: request.handle,
    });

    deleteRequest(requestKey);
    const shouldReplaceStoredHandle =
      comparison?.handleComparisonResult === 'sameEntry' &&
      comparison.returnedHandlePermission === 'granted' &&
      comparison.storedHandlePermission !== 'granted' &&
      grantedHandle !== undefined;
    await request.refreshProvider(shouldReplaceStoredHandle ? grantedHandle : undefined);

    if (operation !== 'write') {
      return comparison === undefined ? { status: 'granted' } : { status: 'granted', comparison };
    }

    const mountPath = PathUtils.join(deviceFilesPath, spaceName);

    for (const handler of writeRecoveryHandlers) {
      // eslint-disable-next-line no-await-in-loop -- recovery handlers may depend on prior flush attempts
      const result = await handler({ mountPath, operation: 'write', spaceName });

      if (result.status === 'stillBlocked') {
        return comparison === undefined
          ? { status: 'grantedWithReplayFailures', replay: result.replay }
          : { status: 'grantedWithReplayFailures', replay: result.replay, comparison };
      }

      if (result.status === 'failed') {
        return comparison === undefined
          ? { status: 'grantedWithStorageFailures', replay: result.replay }
          : { status: 'grantedWithStorageFailures', replay: result.replay, comparison };
      }
    }

    return comparison === undefined ? { status: 'granted' } : { status: 'granted', comparison };
  };

  const cancel = (key: FileSystemAccessRequestKey): Promise<boolean> =>
    Promise.resolve(
      deleteRequest({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );

  const registerWriteRecoveryHandler = (handler: WriteAccessRecoveryHandler) => {
    writeRecoveryHandlers.add(handler);
    return () => {
      writeRecoveryHandlers.delete(handler);
    };
  };

  return {
    upsertRequest,
    clearForSpace,
    getRequest,
    prepareHandle,
    resolve,
    cancel,
    registerWriteRecoveryHandler,
  };
};
