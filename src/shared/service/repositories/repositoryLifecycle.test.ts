import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { createRetirableStorageAdapter } from './repositoryLifecycle';

const createFakeAdapter = () =>
  ({
    load: vi.fn().mockResolvedValue(new Uint8Array([1])),
    loadRange: vi.fn().mockResolvedValue([{ key: ['a'], data: new Uint8Array([1]) }]),
    remove: vi.fn().mockResolvedValue(undefined),
    removeRange: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  }) satisfies StorageAdapterInterface;

describe('createRetirableStorageAdapter', () => {
  it('delegates every operation to the underlying adapter before retirement', async () => {
    const underlying = createFakeAdapter();
    const { adapter } = createRetirableStorageAdapter(underlying);

    await adapter.load(['a']);
    await adapter.loadRange(['a']);
    await adapter.remove(['a']);
    await adapter.removeRange(['a']);
    await adapter.save(['a'], new Uint8Array([2]));

    expect(underlying.load).toHaveBeenCalledWith(['a']);
    expect(underlying.loadRange).toHaveBeenCalledWith(['a']);
    expect(underlying.remove).toHaveBeenCalledWith(['a']);
    expect(underlying.removeRange).toHaveBeenCalledWith(['a']);
    expect(underlying.save).toHaveBeenCalledWith(['a'], new Uint8Array([2]));
  });

  it('resolves every operation as a safe no-op without reaching the underlying adapter after retire()', async () => {
    const underlying = createFakeAdapter();
    const { adapter, retire } = createRetirableStorageAdapter(underlying);

    retire();

    await expect(adapter.load(['a'])).resolves.toBeUndefined();
    await expect(adapter.loadRange(['a'])).resolves.toEqual([]);
    await expect(adapter.remove(['a'])).resolves.toBeUndefined();
    await expect(adapter.removeRange(['a'])).resolves.toBeUndefined();
    await expect(adapter.save(['a'], new Uint8Array([2]))).resolves.toBeUndefined();

    expect(underlying.load).not.toHaveBeenCalled();
    expect(underlying.loadRange).not.toHaveBeenCalled();
    expect(underlying.remove).not.toHaveBeenCalled();
    expect(underlying.removeRange).not.toHaveBeenCalled();
    expect(underlying.save).not.toHaveBeenCalled();
  });

  it('blocks a save issued after retire() even when it targets what is now a different, later identity', async () => {
    // Simulates a retired Repo/DocHandle attempting storage IO after the same path has been
    // retired: the gate must never let that write reach storage, regardless of what the path
    // now represents.
    const underlying = createFakeAdapter();
    const { adapter, retire } = createRetirableStorageAdapter(underlying);

    retire();
    await adapter.save(['stale-doc'], new Uint8Array([9]));

    expect(underlying.save).not.toHaveBeenCalled();
  });
});
