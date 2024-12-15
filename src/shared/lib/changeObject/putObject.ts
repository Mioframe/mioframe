import { isObject, isUndefined } from 'lodash-es';
import type { MergeDeep, PartialDeep } from 'type-fest';

/**
 * overwrites modified values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export function putObject<T extends object, S extends PartialDeep<T> | object>(
  target: T,
  source: S,
): MergeDeep<T, S>;
export function putObject<T extends object, S extends object>(
  target: T,
  source: S,
): MergeDeep<T, S> {
  (<(keyof typeof source)[]>Object.keys(source)).forEach((sourceKey) => {
    const sourceValue = source[sourceKey];
    if (sourceKey in target) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- checked sourceKey in target
      // @ts-expect-error
      const targetValue: unknown = target[sourceKey];
      if (sourceValue !== targetValue) {
        if (isObject(targetValue) && isObject(sourceValue)) {
          putObject(targetValue, sourceValue);
        } else if (isUndefined(sourceValue)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- everything is ok, it's just a deletion
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
          delete target[sourceKey];
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
          // @ts-expect-error
          target[sourceKey] = sourceValue;
        }
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- create new property
      // @ts-expect-error
      target[sourceKey] = sourceValue;
    }
  });

  return target as MergeDeep<T, S>;
}
