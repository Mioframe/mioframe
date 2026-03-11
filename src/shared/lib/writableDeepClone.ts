import { cloneDeep } from 'es-toolkit';
import type { WritableDeep } from 'type-fest';

/**
 * Creates a deeply writable clone of an object.
 *
 * Uses es-toolkit's cloneDeep internally to create a complete copy
 * that can be freely mutated without affecting the original.
 *
 * @param v - Value to clone
 * @returns A deeply writable copy with WritableDeep<T> type
 *
 * @example
 * ```ts
 * const original = { nested: { value: 1 } } as const;
 * const clone = writableDeepClone(original);
 * clone.nested.value = 2; // OK - original is unchanged
 * ```
 */
export const writableDeepClone = <T>(v: T): WritableDeep<T> =>
  <WritableDeep<T>>cloneDeep(v);
