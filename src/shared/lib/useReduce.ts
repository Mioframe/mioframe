/**
 * useReduce.ts
 *
 * A universal Vue 3 hook that performs an in-place, incremental "reduce" operation on a reactive iterable source.
 * Instead of returning a new accumulator object on every change, the hook mutates the same accumulator "in place",
 * thereby minimizing reactive updates and reducing memory allocations.
 *
 * This hook is particularly useful when you want to combine the functional convenience of Array.reduce with
 * the efficiency of updating only one accumulator object.
 */

import type { Ref } from 'vue';
import { ref, watchEffect } from 'vue';

/**
 * Default clearer function to reset the accumulator.
 *
 * If the accumulator is an Array, it resets the length to zero.
 * If it's a Set or Map, it calls the built-in .clear() method.
 * For plain objects, it iterates over own enumerable properties and deletes them.
 *
 * @param acc - The accumulator to be cleared.
 */
function defaultClearer(acc: any): void {
  if (Array.isArray(acc)) {
    // Clear an array by resetting its length.
    acc.length = 0;
  } else if (acc instanceof Set || acc instanceof Map) {
    // Use the built-in clear method for Set or Map.
    acc.clear();
  } else if (acc && typeof acc === 'object') {
    // For plain objects, remove all own properties.
    for (const key in acc) {
      if (Object.prototype.hasOwnProperty.call(acc, key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-unsafe-member-access -- universal object cleaning
        delete acc[key];
      }
    }
  }
}

/**
 * useReduce
 *
 * A universal Vue 3 hook that accumulates values from a reactive iterable source in an incremental manner.
 * Unlike standard reduce implementations which create a new accumulator on every update, this hook mutates the
 * accumulator "in place", thus minimizing unnecessary reactive updates and reducing memory allocations.
 *
 * @template T - The type of items in the source iterable.
 * @template A - The type of the accumulator.
 *
 * @param source - A reactive ref that wraps any iterable (e.g., Array, Set, Map, etc.) of type T.
 * @param reducer - A function that is called for each item in the source. It receives:
 *                  - acc: The current accumulator, which is mutated in place.
 *                  - item: The current element from the source.
 *                  - index: The index or iteration count.
 *                This function should update the accumulator directly.
 * @param initialValue - A mutable initial accumulator of type A. This object will be updated in place.
 * @param clearer - (Optional) A function used to clear the accumulator before filling it.
 *                  If not provided, the defaultClearer is used.
 *
 * @returns A ref containing the accumulator (of type A) that is updated reactively as the source changes.
 */
export function useReduceIterable<A, T>(
  source: Ref<Iterable<T> | undefined>,
  reducer: (acc: A, item: T, index: number) => void,
  initialValue: A,
  clearer?: (acc: A) => void,
): Ref<A> {
  // Wrap the accumulator in a shallowRef to limit reactivity cost.
  const result = <Ref<A>>ref(initialValue);

  watchEffect(() => {
    // Clear the accumulator using the provided clearer, or the defaultClearer if none is provided.
    (clearer || defaultClearer)(result.value);

    let index = 0;
    if (source.value) {
      // Iterate over the source and update the accumulator in place.
      for (const item of source.value) {
        reducer(result.value, item, index);
        index++;
      }
    }
  });

  return result;
}

export function useReduceRecord<A, K extends PropertyKey, V>(
  source: Ref<Record<K, V> | undefined>,
  reducer: (acc: A, value: V, key: K, index: number) => void,
  initialValue: A,
  clearer?: (acc: A) => void,
): Ref<A> {
  const result = <Ref<A>>ref(initialValue);

  watchEffect(() => {
    (clearer || defaultClearer)(result.value);

    let index = 0;
    if (source.value) {
      for (const key in source.value) {
        if (Object.hasOwnProperty.call(source.value, key)) {
          const value = source.value[key];
          reducer(result.value, value, key, index);
          index++;
        }
      }
    }
  });

  return result;
}

export function useReduceMap<A, K, V>(
  source: Ref<Map<K, V> | undefined>,
  reducer: (acc: A, value: V, key: K, index: number) => void,
  initialValue: A,
  clearer?: (acc: A) => void,
): Ref<A> {
  const result = <Ref<A>>ref(initialValue);

  watchEffect(() => {
    (clearer || defaultClearer)(result.value);

    if (source.value) {
      let index = 0;
      source.value.forEach((value, key) => {
        reducer(result.value, value, key, index);
        index += 1;
      });
    }
  });

  return result;
}
