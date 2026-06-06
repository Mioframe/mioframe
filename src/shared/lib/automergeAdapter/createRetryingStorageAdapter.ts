import type { StorageAdapterInterface, StorageKey } from '@automerge/automerge-repo';
import { sanitizeDiagnosticError } from '@shared/lib/diagnostics';
import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';

/**
 * Safe classification of a flush failure exposed to service-layer recovery.
 * Never includes storage keys, document ids, paths, file names, or bytes.
 * - `accessRequired` – the provider still requires browser permission (write-access blocked).
 * - `storageFailure` – write access was available but the underlying adapter reported an error.
 * - `unknown` – the failure could not be classified against known patterns.
 */
export type RetryingStorageAdapterFailureClassification =
  | 'accessRequired'
  | 'storageFailure'
  | 'unknown';

/**
 * Safe flush summary exposed to service-layer recovery flows.
 */
export interface RetryingStorageAdapterFlushResult {
  /** Aggregate flush outcome without exposing raw errors or payload data. */
  status: 'failed' | 'flushed' | 'stillBlocked';
  /** Number of queued saves written successfully during this flush attempt. */
  flushedCount: number;
  /** Number of saves that remain queued after the flush attempt. */
  pendingCount: number;
  /**
   * Safe classification of the first failure encountered during this flush attempt.
   * Present only when `status` is `'failed'` or `'stillBlocked'`.
   */
  failureClassification?: RetryingStorageAdapterFailureClassification;
  /** Safe sanitized summary of the first failure encountered during this flush attempt. */
  error?: SanitizedDiagnosticError | undefined;
}

/**
 * Safe summary passed to the {@link RetryingStorageAdapterOptions.onSaveFailure} callback.
 * Contains project-controlled classification values plus the raw caught error.
 * The raw `caughtError` stays within the same runtime boundary — the receiver
 * must sanitize it with `sanitizeDiagnosticError` before any diagnostics use.
 * Never serialize, queue, store, or send `caughtError` directly.
 */
export interface RetryingStorageAdapterSaveFailureInfo {
  /** Whether the failed save was queued for a later retry. */
  queued: boolean;
  /**
   * Safe classification of the failure.
   * - `accessRequired` – save was queued because write access was blocked.
   * - `storageFailure` – save was not queued because the underlying adapter reported a hard error.
   */
  failureClassification: 'accessRequired' | 'storageFailure';
  /** Number of saves currently queued after this failure. */
  pendingCount: number;
  /**
   * Raw error from the underlying adapter save call.
   * Must be sanitized by the receiver before any diagnostics use.
   */
  caughtError: unknown;
}

/**
 * External retry classifier used to keep this wrapper independent from provider-specific errors.
 */
export interface RetryingStorageAdapterOptions {
  /**
   * Returns true when a failed save should be kept for a later retry.
   * @param error - Unknown save failure from the wrapped adapter.
   * @returns Whether the failed save should be queued.
   */
  shouldQueueFailedSave: (error: unknown) => boolean;
  /**
   * Optional callback invoked on every primary save failure — both queued and non-queued.
   * Receives only safe project-controlled data — no storage keys, bytes, or raw errors.
   * Throwing inside this callback does not affect save or queue semantics.
   * @param info - Safe summary with queued status, classification, and pending count.
   */
  onSaveFailure?: ((info: RetryingStorageAdapterSaveFailureInfo) => void) | undefined;
  /**
   * Optional callback invoked before a primary save attempt.
   */
  onSaveStart?: (() => void) | undefined;
  /**
   * Optional callback invoked before a removeRange attempt.
   */
  onRemoveRangeStart?: (() => void) | undefined;
  /**
   * Optional callback invoked when removeRange throws.
   * @param error - Raw adapter error from removeRange.
   */
  onRemoveRangeFailure?: ((error: unknown) => void) | undefined;
  /**
   * Optional callback invoked before a pending-save flush begins.
   * @param info - Current number of queued saves before the flush attempt.
   */
  onFlushPendingSavesStart?: ((info: { pendingCount: number }) => void) | undefined;
  /**
   * Optional callback invoked after a pending-save flush finishes successfully.
   * @param info - Aggregate flush counts after a successful flush.
   */
  onFlushPendingSavesComplete?:
    | ((info: { flushedCount: number; pendingCount: number }) => void)
    | undefined;
  /**
   * Optional callback invoked when a pending-save flush stops at a failure.
   * @param info - Aggregate counts plus safe failure classification.
   */
  onFlushPendingSavesFailure?:
    | ((info: {
        error?: SanitizedDiagnosticError | undefined;
        failureClassification: RetryingStorageAdapterFailureClassification;
        flushedCount: number;
        pendingCount: number;
      }) => void)
    | undefined;
}

type PendingSave = {
  data: Uint8Array;
  key: StorageKey;
};

const cloneKey = (key: StorageKey): StorageKey => [...key];
const cloneBytes = (data: Uint8Array) => new Uint8Array(data);
const getPendingKey = (key: StorageKey) => JSON.stringify(key);
const keyStartsWith = (key: StorageKey, prefix: StorageKey) =>
  prefix.length <= key.length && prefix.every((segment, index) => key[index] === segment);

/**
 * Wraps an Automerge storage adapter with retryable failed-save buffering by storage key.
 * @param adapter - Underlying storage adapter used for actual IO.
 * @param options - External retry classifier that decides which save failures stay pending.
 * @returns Wrapped storage adapter plus a minimal pending-save recovery API.
 */
export const createRetryingStorageAdapter = (
  adapter: StorageAdapterInterface,
  {
    shouldQueueFailedSave,
    onSaveFailure,
    onSaveStart,
    onRemoveRangeStart,
    onRemoveRangeFailure,
    onFlushPendingSavesStart,
    onFlushPendingSavesComplete,
    onFlushPendingSavesFailure,
  }: RetryingStorageAdapterOptions,
) => {
  const pendingSaves = new Map<string, PendingSave>();

  const queuePendingSave = (key: StorageKey, data: Uint8Array) => {
    pendingSaves.set(getPendingKey(key), {
      data: cloneBytes(data),
      key: cloneKey(key),
    });
  };

  const deletePendingSave = (key: StorageKey) => {
    pendingSaves.delete(getPendingKey(key));
  };

  const deletePendingSaveRange = (keyPrefix: StorageKey) => {
    for (const [pendingKey, pendingSave] of pendingSaves.entries()) {
      if (keyStartsWith(pendingSave.key, keyPrefix)) {
        pendingSaves.delete(pendingKey);
      }
    }
  };

  const wrapped: StorageAdapterInterface & {
    flushPendingSaves(): Promise<RetryingStorageAdapterFlushResult>;
    hasPendingSaves(): boolean;
  } = {
    load: (key) => adapter.load(key),
    loadRange: (keyPrefix) => adapter.loadRange(keyPrefix),
    remove: (key) => {
      deletePendingSave(key);
      return adapter.remove(key);
    },
    removeRange: (keyPrefix) => {
      deletePendingSaveRange(keyPrefix);
      try {
        onRemoveRangeStart?.();
      } catch {
        // diagnostic callbacks must not affect adapter behavior
      }

      return adapter.removeRange(keyPrefix).catch((error) => {
        try {
          onRemoveRangeFailure?.(error);
        } catch {
          // diagnostic callbacks must not affect adapter behavior
        }
        throw error;
      });
    },
    async save(key, data) {
      try {
        onSaveStart?.();
      } catch {
        // diagnostic callbacks must not affect adapter behavior
      }

      try {
        await adapter.save(key, data);
      } catch (error) {
        const shouldQueue = shouldQueueFailedSave(error);
        if (shouldQueue) {
          queuePendingSave(key, data);
        }
        try {
          onSaveFailure?.({
            queued: shouldQueue,
            failureClassification: shouldQueue ? 'accessRequired' : 'storageFailure',
            pendingCount: pendingSaves.size,
            caughtError: error,
          });
        } catch {
          // diagnostic callbacks must not affect adapter behavior
        }
        throw error;
      }
    },
    hasPendingSaves: () => pendingSaves.size > 0,
    async flushPendingSaves() {
      let flushedCount = 0;
      try {
        onFlushPendingSavesStart?.({ pendingCount: pendingSaves.size });
      } catch {
        // diagnostic callbacks must not affect adapter behavior
      }

      for (const [pendingKey, pendingSave] of pendingSaves.entries()) {
        try {
          // eslint-disable-next-line no-await-in-loop -- preserve save ordering per queued attempt
          await adapter.save(pendingSave.key, cloneBytes(pendingSave.data));
          pendingSaves.delete(pendingKey);
          flushedCount += 1;
        } catch (error) {
          if (shouldQueueFailedSave(error)) {
            try {
              onFlushPendingSavesFailure?.({
                failureClassification: 'accessRequired',
                flushedCount,
                pendingCount: pendingSaves.size,
              });
            } catch {
              // diagnostic callbacks must not affect adapter behavior
            }
            return {
              status: 'stillBlocked',
              flushedCount,
              pendingCount: pendingSaves.size,
              failureClassification: 'accessRequired',
            };
          }

          const sanitizedError = sanitizeDiagnosticError(error);
          try {
            onFlushPendingSavesFailure?.({
              error: sanitizedError,
              failureClassification: 'storageFailure',
              flushedCount,
              pendingCount: pendingSaves.size,
            });
          } catch {
            // diagnostic callbacks must not affect adapter behavior
          }
          return {
            status: 'failed',
            flushedCount,
            pendingCount: pendingSaves.size,
            failureClassification: 'storageFailure',
            error: sanitizedError,
          };
        }
      }

      try {
        onFlushPendingSavesComplete?.({
          flushedCount,
          pendingCount: pendingSaves.size,
        });
      } catch {
        // diagnostic callbacks must not affect adapter behavior
      }

      return {
        status: 'flushed',
        flushedCount,
        pendingCount: pendingSaves.size,
      };
    },
  };

  return wrapped;
};
