import { clone } from 'remeda';
import type { WritableDeep } from 'type-fest';

export const writableDeepClone = <T>(v: T): WritableDeep<T> =>
  <WritableDeep<T>>clone(v);
