import type { ValueKeyIterateeTypeGuard } from 'lodash';
import { pickBy as lodashPickBy } from 'lodash-es';

export const pickDictionaryBy = <
  K extends string | number | symbol,
  T,
  S extends T,
>(
  object: Record<K, T> | null | undefined,
  predicate: ValueKeyIterateeTypeGuard<T, S>,
) => <Record<K, S>>lodashPickBy(object, predicate);
