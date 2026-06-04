import type { StorageAdapterInterface, StorageKey } from '@automerge/automerge-repo';

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
  options: RetryingStorageAdapterOptions,
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
      return adapter.removeRange(keyPrefix);
    },
    async save(key, data) {
      try {
        await adapter.save(key, data);
      } catch (error) {
        if (options.shouldQueueFailedSave(error)) {
          queuePendingSave(key, data);
        }

        throw error;
      }
    },
    hasPendingSaves: () => pendingSaves.size > 0,
    async flushPendingSaves() {
      let flushedCount = 0;

      for (const [pendingKey, pendingSave] of pendingSaves.entries()) {
        try {
          // eslint-disable-next-line no-await-in-loop -- preserve save ordering per queued attempt
          await adapter.save(pendingSave.key, cloneBytes(pendingSave.data));
          pendingSaves.delete(pendingKey);
          flushedCount += 1;
        } catch (error) {
          if (options.shouldQueueFailedSave(error)) {
            return {
              status: 'stillBlocked',
              flushedCount,
              pendingCount: pendingSaves.size,
              failureClassification: 'accessRequired',
            };
          }

          return {
            status: 'failed',
            flushedCount,
            pendingCount: pendingSaves.size,
            failureClassification: 'storageFailure',
          };
        }
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
