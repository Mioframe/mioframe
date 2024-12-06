import type { AnyIterableInput } from '@shared/ui/TreeMenu/useIterable';
import { from } from 'ix/Ix.asynciterable';

/**
 * Synchronizes the target map to match the source map.
 *
 * Updates targetMap to reflect the keys and values of sourceMap.
 * Adds, updates, or removes entries as needed.
 *
 * @param sourceMap - The map to copy keys and values from.
 * @param targetMap - The map to be updated.
 * @template K, V
 */
export const updateMap = async <K, V>(
  sourceMap: AnyIterableInput<[K, V]>,
  targetMap: Map<K, V>,
) => {
  const targetKeys = new Set(targetMap.keys());

  await from(sourceMap).forEach(([key, value]) => {
    targetMap.set(key, value);
    targetKeys.delete(key);
  });

  for (const key of targetKeys) {
    targetMap.delete(key);
  }
};
