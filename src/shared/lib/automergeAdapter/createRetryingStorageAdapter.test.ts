import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { createRetryingStorageAdapter } from './createRetryingStorageAdapter';

const clone = (value: Uint8Array) => new Uint8Array(value);

describe('createRetryingStorageAdapter', () => {
  it('stores the latest failed save for one key and rethrows the original retryable error', async () => {
    const error = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
    });
    const key = ['doc-id', 'snapshot', 'hash-a'];
    const first = new Uint8Array([1, 2, 3]);
    const second = new Uint8Array([4, 5, 6]);

    await expect(wrapped.save(key, first)).rejects.toBe(error);
    await expect(wrapped.save(key, second)).rejects.toBe(error);

    first[0] = 99;
    second[0] = 88;

    expect(wrapped.hasPendingSaves()).toBe(true);
    await expect(wrapped.flushPendingSaves()).resolves.toEqual({
      flushedCount: 1,
      pendingCount: 0,
      status: 'flushed',
    });
    expect(adapter.save).toHaveBeenLastCalledWith(key, new Uint8Array([4, 5, 6]));
    expect(wrapped.hasPendingSaves()).toBe(false);
  });

  it('keeps retryable flush failures pending for a later retry', async () => {
    const error = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([1]))).rejects.toBe(
      error,
    );

    await expect(wrapped.flushPendingSaves()).resolves.toEqual({
      flushedCount: 0,
      pendingCount: 1,
      status: 'stillBlocked',
      failureClassification: 'accessRequired',
    });
    expect(wrapped.hasPendingSaves()).toBe(true);

    await expect(wrapped.flushPendingSaves()).resolves.toEqual({
      flushedCount: 1,
      pendingCount: 0,
      status: 'flushed',
    });
    expect(wrapped.hasPendingSaves()).toBe(false);
  });

  it('returns a safe failed result when flushing hits a non-retryable error', async () => {
    const queuedError = new Error('permission blocked');
    const flushError = new Error('disk full');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(queuedError)
        .mockRejectedValueOnce(flushError),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === queuedError,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([7]))).rejects.toBe(
      queuedError,
    );

    const result = await wrapped.flushPendingSaves();

    expect(result).toEqual({
      flushedCount: 0,
      pendingCount: 1,
      status: 'failed',
      failureClassification: 'storageFailure',
    });
    expect(Object.keys(result)).toEqual([
      'status',
      'flushedCount',
      'pendingCount',
      'failureClassification',
    ]);
    expect(wrapped.hasPendingSaves()).toBe(true);
  });

  it('removes a pending save when remove deletes the same storage key', async () => {
    const error = new Error('permission blocked');
    const key = ['doc-id', 'snapshot', 'hash-a'] as const;
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
      removeRange: vi.fn(),
      save: vi.fn<StorageAdapterInterface['save']>().mockRejectedValueOnce(error),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
    });

    await expect(wrapped.save([...key], new Uint8Array([1, 2, 3]))).rejects.toBe(error);
    expect(wrapped.hasPendingSaves()).toBe(true);

    await expect(wrapped.remove([...key])).resolves.toBeUndefined();

    expect(adapter.remove).toHaveBeenCalledWith(key);
    expect(wrapped.hasPendingSaves()).toBe(false);
    await expect(wrapped.flushPendingSaves()).resolves.toEqual({
      flushedCount: 0,
      pendingCount: 0,
      status: 'flushed',
    });
    expect(adapter.save).toHaveBeenCalledTimes(1);
  });

  it('removes only prefix-matching pending saves when removeRange deletes a storage range', async () => {
    const error = new Error('permission blocked');
    const matchingSnapshotKey = ['doc-id', 'snapshot', 'hash-a'] as const;
    const matchingIncrementalKey = ['doc-id', 'incremental', 'hash-b'] as const;
    const otherDocumentKey = ['other-doc', 'snapshot', 'hash-c'] as const;
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn().mockResolvedValue(undefined),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
    });

    await expect(wrapped.save([...matchingSnapshotKey], new Uint8Array([1]))).rejects.toBe(error);
    await expect(wrapped.save([...matchingIncrementalKey], new Uint8Array([2]))).rejects.toBe(
      error,
    );
    await expect(wrapped.save([...otherDocumentKey], new Uint8Array([3]))).rejects.toBe(error);

    await expect(wrapped.removeRange(['doc-id'])).resolves.toBeUndefined();

    expect(adapter.removeRange).toHaveBeenCalledWith(['doc-id']);
    expect(wrapped.hasPendingSaves()).toBe(true);
    await expect(wrapped.flushPendingSaves()).resolves.toEqual({
      flushedCount: 1,
      pendingCount: 0,
      status: 'flushed',
    });
    expect(adapter.save).toHaveBeenLastCalledWith(otherDocumentKey, new Uint8Array([3]));
    expect(adapter.save).toHaveBeenCalledTimes(4);
  });

  it('sets failureClassification to accessRequired when flush is still blocked', async () => {
    const blockedError = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(blockedError)
        .mockRejectedValueOnce(blockedError),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === blockedError,
    });

    await expect(wrapped.save(['key'], new Uint8Array([1]))).rejects.toBe(blockedError);

    const result = await wrapped.flushPendingSaves();

    expect(result.status).toBe('stillBlocked');
    expect(result.failureClassification).toBe('accessRequired');
  });

  it('sets failureClassification to storageFailure when flush fails for a non-retryable error', async () => {
    const queuedError = new Error('permission blocked');
    const storageError = new Error('disk write error');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi
        .fn<StorageAdapterInterface['save']>()
        .mockRejectedValueOnce(queuedError)
        .mockRejectedValueOnce(storageError),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === queuedError,
    });

    await expect(wrapped.save(['key'], new Uint8Array([1]))).rejects.toBe(queuedError);

    const result = await wrapped.flushPendingSaves();

    expect(result.status).toBe('failed');
    expect(result.failureClassification).toBe('storageFailure');
  });

  it('calls onSaveQueued callback with pendingCount when a save is queued', async () => {
    const error = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi.fn<StorageAdapterInterface['save']>().mockRejectedValueOnce(error),
    } satisfies StorageAdapterInterface;
    const onSaveQueued = vi.fn();
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
      onSaveQueued,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([1]))).rejects.toBe(
      error,
    );

    expect(onSaveQueued).toHaveBeenCalledTimes(1);
    expect(onSaveQueued).toHaveBeenCalledWith({ pendingCount: 1 });
  });

  it('does not call onSaveQueued when a save fails but is not queued', async () => {
    const error = new Error('disk full');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi.fn<StorageAdapterInterface['save']>().mockRejectedValueOnce(error),
    } satisfies StorageAdapterInterface;
    const onSaveQueued = vi.fn();
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: () => false,
      onSaveQueued,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([1]))).rejects.toBe(
      error,
    );

    expect(onSaveQueued).not.toHaveBeenCalled();
  });

  it('still queues the save correctly when no onSaveQueued callback is registered', async () => {
    const error = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi.fn<StorageAdapterInterface['save']>().mockRejectedValueOnce(error),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([1]))).rejects.toBe(
      error,
    );

    expect(wrapped.hasPendingSaves()).toBe(true);
  });

  it('onSaveQueued payload does not contain storage key, document id, or bytes', async () => {
    const error = new Error('permission blocked');
    const adapter = {
      load: vi.fn(),
      loadRange: vi.fn(),
      remove: vi.fn(),
      removeRange: vi.fn(),
      save: vi.fn<StorageAdapterInterface['save']>().mockRejectedValueOnce(error),
    } satisfies StorageAdapterInterface;
    const onSaveQueued = vi.fn();
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: (candidate) => candidate === error,
      onSaveQueued,
    });

    await expect(wrapped.save(['doc-id', 'snapshot', 'hash-a'], new Uint8Array([1]))).rejects.toBe(
      error,
    );

    const payload = onSaveQueued.mock.calls[0]?.[0];
    expect(Object.keys(payload ?? {})).toEqual(['pendingCount']);
  });

  it('delegates non-save operations to the wrapped adapter', async () => {
    const loaded = new Uint8Array([1, 2]);
    const range = [{ data: clone(loaded), key: ['doc-id', 'snapshot', 'hash-a'] }];
    const adapter = {
      load: vi.fn().mockResolvedValue(loaded),
      loadRange: vi.fn().mockResolvedValue(range),
      remove: vi.fn().mockResolvedValue(undefined),
      removeRange: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    } satisfies StorageAdapterInterface;
    const wrapped = createRetryingStorageAdapter(adapter, {
      shouldQueueFailedSave: () => false,
    });
    const key = ['doc-id', 'snapshot', 'hash-a'];

    await expect(wrapped.load(key)).resolves.toBe(loaded);
    await expect(wrapped.loadRange(['doc-id'])).resolves.toBe(range);
    await expect(wrapped.remove(key)).resolves.toBeUndefined();
    await expect(wrapped.removeRange(['doc-id'])).resolves.toBeUndefined();
  });
});
