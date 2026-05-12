/**
 * Type-safe utility for extracting keys from objects or arrays.
 *
 * For arrays, returns an array of indices (0, 1, 2, ...).
 * For objects, returns an array of object keys using Object.keys().
 * @param obj - The object or array to extract keys from
 * @returns Array of indices for arrays, or array of property keys for objects
 * @example
 * ```ts
 * keys({ a: 1, b: 2 }) // returns ['a', 'b']
 * keys([10, 20, 30])   // returns [0, 1, 2]
 * ```
 */
export function keys(obj: []): number[];
export function keys<T extends object>(obj: T): Array<keyof T>;
export function keys(obj: object | []): PropertyKey[] {
  if (Array.isArray(obj)) {
    return obj.map((_, index) => index);
  }
  return Object.keys(obj);
}
