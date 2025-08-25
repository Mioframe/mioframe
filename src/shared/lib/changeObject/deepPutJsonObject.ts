import { cloneDeep, isNil, isString } from 'es-toolkit';
import type { MergeDeep, PartialDeep } from 'type-fest';
import { isObjectLike } from '../typeGuards';

/**
 * overwrites modified values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export function deepPutJsonObject<
  T extends object,
  S extends PartialDeep<T> | object,
>(
  target: T,
  source: S,
  options?: {
    trimString?: boolean;
  },
): MergeDeep<T, S>;
export function deepPutJsonObject<T extends object, S extends object>(
  target: T,
  source: S,
  options: {
    trimString?: boolean;
  } = {},
): MergeDeep<T, S> {
  const { trimString = false } = options;

  (<(keyof typeof source)[]>Object.keys(source)).forEach((sourceKey) => {
    const sourceValue = source[sourceKey];
    if (sourceKey in target) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- checked sourceKey in target
      // @ts-expect-error
      const targetValue: unknown = target[sourceKey];
      if (sourceValue !== targetValue) {
        if (isObjectLike(targetValue) && isObjectLike(sourceValue)) {
          deepPutJsonObject(targetValue, sourceValue);
        } else if (isNil(sourceValue)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- everything is ok, it's just a deletion
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
          delete target[sourceKey];
        } else if (trimString && isString(sourceValue)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
          // @ts-expect-error
          target[sourceKey] = sourceValue.trim();
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
          // @ts-expect-error
          target[sourceKey] = cloneDeep(sourceValue);
        }
      }
    } else if (trimString && isString(sourceValue)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
      // @ts-expect-error
      target[sourceKey] = sourceValue.trim();
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- create new property
      // @ts-expect-error
      target[sourceKey] = sourceValue;
    }
  });

  return target as MergeDeep<T, S>;
}
