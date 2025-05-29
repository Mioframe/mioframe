import { cloneDeep } from 'es-toolkit';
import type { WritableDeep } from 'type-fest';

export const writableDeepClone = <T>(v: T): WritableDeep<T> =>
  <WritableDeep<T>>cloneDeep(v);
