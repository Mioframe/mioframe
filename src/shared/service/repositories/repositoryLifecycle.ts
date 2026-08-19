import type { Chunk, StorageAdapterInterface, StorageKey } from '@automerge/automerge-repo';

/**
 * Wraps a storage adapter with an explicit retirement gate. Once retired, every operation
 * becomes a safe no-op instead of reaching the underlying VFS path, so a cached repository whose
 * directory/mount identity has ended cannot perform storage IO into a later identity that happens
 * to reuse the same path.
 * @param adapter - Underlying storage adapter to guard.
 * @returns The gated adapter plus a `retire` function that permanently disables its IO.
 */
export const createRetirableStorageAdapter = (
  adapter: StorageAdapterInterface,
): { adapter: StorageAdapterInterface; retire: () => void } => {
  let retired = false;

  return {
    adapter: {
      ...adapter,
      load: (key: StorageKey) => (retired ? Promise.resolve(undefined) : adapter.load(key)),
      loadRange: (keyPrefix: StorageKey): Promise<Chunk[]> =>
        retired ? Promise.resolve([]) : adapter.loadRange(keyPrefix),
      remove: (key: StorageKey) => (retired ? Promise.resolve() : adapter.remove(key)),
      removeRange: (keyPrefix: StorageKey) =>
        retired ? Promise.resolve() : adapter.removeRange(keyPrefix),
      save: (key: StorageKey, data: Uint8Array) =>
        retired ? Promise.resolve() : adapter.save(key, data),
    },
    retire: () => {
      retired = true;
    },
  };
};
