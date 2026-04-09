import { isFunction } from 'es-toolkit/compat';
import { isObjectLike } from './typeGuards';

/**
 * Type utilities for working with iterable structures.
 *
 * Provides TypeScript types and guards for working with iterable/asyncIterable
 * objects and items with children properties.
 */
export type Dictionary<K, V> = Iterable<[K, V]>;

export interface ItemWithChildren1<K extends string | number, T> {
  children: Iterable<[K, T]>;
}

export interface ItemWithChildren2<V extends [string | number, unknown]> {
  children: Iterable<V>;
}

export interface ItemWithChildren<T extends [string | number, unknown]> {
  children: Iterable<T>;
}

const hasIterator = <T>(v: unknown): v is Iterable<T> =>
  typeof v === 'object' &&
  v !== null &&
  Symbol.iterator in v &&
  typeof v[Symbol.iterator] === 'function';

const hasAsyncIterator = <T>(v: unknown): v is AsyncIterable<T> =>
  typeof v === 'object' &&
  v !== null &&
  Symbol.asyncIterator in v &&
  typeof v[Symbol.asyncIterator] === 'function';

export const isItemWithChildren = <
  V,
  T extends [string | number, unknown] = [string | number, unknown],
>(
  v: V,
): v is V & ItemWithChildren<T> =>
  isObjectLike(v) &&
  'children' in v &&
  (isFunction(v.children) ||
    (isObjectLike(v.children) && (hasIterator(v.children) || hasAsyncIterator(v.children))));
