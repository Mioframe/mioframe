/**
 * Moves an element in an array from one index to another.
 *
 * Mutates the original array in place. Supports negative indices
 * which are normalized relative to array length.
 * @param arr - The array to modify (mutated in place)
 * @param fromIndex - Source index (supports negative indices)
 * @param toIndex - Destination index (supports negative indices)
 * @example
 * ```ts
 * const arr = [1, 2, 3, 4, 5];
 * moveArrayValue(arr, 0, 4); // arr becomes [2, 3, 4, 5, 1]
 * moveArrayValue(arr, -1, 0); // arr becomes [5, 2, 3, 4, 1]
 * ```
 */
export const moveArrayValue = (arr: unknown[], fromIndex: number, toIndex: number) => {
  const len = arr.length;

  const normalizeIndex = (index: number): number => {
    if (index < 0) index = len + index;
    if (index < 0) return 0;
    if (index >= len) return len - 1;
    return index;
  };

  const from = normalizeIndex(fromIndex);
  const to = normalizeIndex(toIndex);

  if (from === to) return;

  const element = arr[from];

  if (from < to) {
    for (let i = from; i < to; i++) {
      arr[i] = arr[i + 1];
    }
  } else {
    for (let i = from; i > to; i--) {
      arr[i] = arr[i - 1];
    }
  }

  arr[to] = element;
};
