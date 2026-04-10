import { isPlainObject } from 'es-toolkit';
import { keys } from './objectKeys';

/**
 * Recursively removes empty structures from an object or array.
 *
 * Removes:
 * - Empty arrays
 * - Empty plain objects
 * - All properties that lead to empty structures
 *
 * @warning Mutates the original object/array in place
 *
 * @param data - Object, array, or primitive to process
 * @returns The same data with empty structures removed, or undefined if the structure itself is empty
 *
 * @example
 * ```ts
 * removeEmptyStructures({ a: [], b: {} });      // returns undefined
 * removeEmptyStructures({ a: [1], b: [] });     // returns { a: [1] }
 * removeEmptyStructures({ a: { b: {} } });     // returns undefined
 * removeEmptyStructures({ a: { b: { c: 1 } } }); // returns { a: { b: { c: 1 } } }
 * ```
 */
export const removeEmptyStructures = <T>(data: T): T | undefined => {
  if (data === null || typeof data !== 'object' || data instanceof Date || data instanceof RegExp) {
    return data;
  }

  if (Array.isArray(data)) {
    for (let i = data.length - 1; i >= 0; i--) {
      const result = removeEmptyStructures(data[i]);

      if (result === undefined) {
        data.splice(i, 1);
      }
    }

    if (data.length === 0) {
      return undefined;
    }

    return data;
  }

  if (isPlainObject(data)) {
    const dataKeys = keys(data);

    for (const key of dataKeys) {
      const result = removeEmptyStructures(data[key]);

      if (result === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- it's ok
        delete data[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return undefined;
    }

    return data;
  }

  return data;
};
