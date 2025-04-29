import type { WritableDeep } from 'type-fest';
import { cloneDeep as lodashCloneDeep } from 'lodash-es';

export const writableDeepClone = <T>(v: T): WritableDeep<T> =>
  <WritableDeep<T>>lodashCloneDeep(v);
