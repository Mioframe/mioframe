/**
 * Checks if an array starts with a given prefix sequence.
 *
 * @param target - The array to check
 * @param prefix - The prefix sequence to look for
 * @returns true if target starts with prefix, false otherwise
 *
 * @example
 * ```ts
 * arrayStartsWith([1, 2, 3, 4], [1, 2]);    // true
 * arrayStartsWith([1, 2, 3, 4], [2, 3]);    // false
 * arrayStartsWith([1, 2, 3], [1, 2, 3, 4]); // false
 * ```
 */
export const arrayStartsWith = <T = unknown>(
  target: T[],
  prefix: T[],
): boolean =>
  prefix.length <= target.length && prefix.every((v, i) => v === target[i]);
