import { pickBy as lodashPickBy } from 'lodash-es';

type ValueKeyIterateeTypeGuard<T, S extends T> = (
  value: T,
  key: string,
) => value is S;

export const pickDictionaryBy = <
  K extends string | number | symbol,
  T,
  S extends T,
>(
  object: Record<K, T> | null | undefined,
  predicate: ValueKeyIterateeTypeGuard<T, S>,
) => <Record<K, S>>lodashPickBy(object, predicate);
