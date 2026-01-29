import { cloneDeep, isNil, isString } from 'es-toolkit';
import type { MergeDeep, PartialDeep } from 'type-fest';
import { isObjectLike } from '../typeGuards';
import { keys } from '../objectKeys';

export const DELETE_MARKER = '__@DELETE_MARKER@__';

export interface DeepPatchJsonObjectOptions {
  trimString?: boolean;
  deleteMarker?: string;
}

export type PatchSource<T> = PartialDeep<T>;

/**
 * overwrites modified values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export function deepPatchJsonObject<
  T extends object,
  S extends PatchSource<T> | object,
>(target: T, source: S, options?: DeepPatchJsonObjectOptions): MergeDeep<T, S>;
export function deepPatchJsonObject<T extends object, S extends object>(
  target: T,
  source: S,
  options: {
    trimString?: boolean;
    deleteMarker?: string;
  } = {},
): MergeDeep<T, S> {
  const { trimString = false, deleteMarker = DELETE_MARKER } = options;

  keys(source).forEach((sourceKey) => {
    const sourceValue = source[sourceKey];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- checked sourceKey in target
    // @ts-expect-error
    const targetValue: unknown = target[sourceKey];

    if (sourceValue === deleteMarker) {
      if (sourceKey in target) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- everything is ok, it's just a deletion
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
        delete target[sourceKey];
      }
    } else if (sourceValue !== targetValue) {
      if (sourceKey in target) {
        if (isNil(sourceValue) || sourceValue === deleteMarker) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- everything is ok, it's just a deletion
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
          delete target[sourceKey];
        } else if (isObjectLike(targetValue) && isObjectLike(sourceValue)) {
          deepPatchJsonObject(targetValue, sourceValue, options);
        } else if (trimString && isString(sourceValue)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
          // @ts-expect-error
          target[sourceKey] = sourceValue.trim();
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- replace property
          // @ts-expect-error
          target[sourceKey] = cloneDeep(sourceValue);
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
    }
  });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return target as MergeDeep<T, S>;
}
