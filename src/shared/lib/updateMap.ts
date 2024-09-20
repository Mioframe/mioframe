/**
 * Synchronizes the target map to match the source map.
 *
 * Updates targetMap to reflect the keys and values of sourceMap.
 * Adds, updates, or removes entries as needed.
 *
 * @param {Map<K, V>} sourceMap - The map to copy keys and values from.
 * @param {Map<K, V>} targetMap - The map to be updated.
 * @template K, V
 */
export const updateMap = <K, V>(
  sourceMap: Map<K, V>,
  targetMap: Map<K, V>,
): void => {
  const targetKeys = new Set(targetMap.keys());

  for (const [key, value] of sourceMap) {
    targetMap.set(key, value);
    targetKeys.delete(key);
  }

  for (const key of targetKeys) {
    targetMap.delete(key);
  }
};
