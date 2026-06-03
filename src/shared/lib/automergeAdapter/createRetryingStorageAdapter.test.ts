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
    });
    expect(Object.keys(result)).toEqual(['status', 'flushedCount', 'pendingCount']);
    expect(wrapped.hasPendingSaves()).toBe(true);
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
