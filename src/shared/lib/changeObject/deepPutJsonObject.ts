import { cloneDeep, isString, isUndefined } from 'es-toolkit';
import { isUnknownRecord } from './isUnknownRecord';
import { isArray, isNil } from 'es-toolkit/compat';
import { keys } from '../objectKeys';

// fixme: добавить ограничение только для PlainObject

/**
 * overwrites all values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export const deepPutJsonObject = <S extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it doesn't matter what the target object is
  target: Record<any, any>,
  source: S,
  options: {
    trimString?: boolean;
  } = {},
): S => {
  const { trimString = false } = options;

  if (!Object.is(target, source)) {
    const targetKeys = new Set<string | number | symbol>(
      keys(target).reverse(),
    );

    keys(source).forEach((sourceKey) => {
      targetKeys.delete(sourceKey);
      const sourceValue = source[sourceKey];
      if (sourceKey in target) {
        const targetValue: unknown = target[sourceKey];
        if (sourceValue !== targetValue) {
          if (isUndefined(sourceValue)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
            delete target[sourceKey];
          } else if (
            isUnknownRecord(targetValue) &&
            isUnknownRecord(sourceValue)
          ) {
            deepPutJsonObject(targetValue, sourceValue, options);
          } else if (trimString && isString(sourceValue)) {
            target[sourceKey] = sourceValue.trim();
          } else {
            target[sourceKey] = cloneDeep(sourceValue);
          }
        }
      } else {
        if (isUndefined(sourceValue)) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete keys with undefined value
          delete target[sourceKey];
        } else if (trimString && isString(sourceValue)) {
          target[sourceKey] = sourceValue.trim();
        } else {
          target[sourceKey] = cloneDeep(sourceValue);
        }
      }
    });

    targetKeys.forEach((key) => {
      // @ts-expect-error -- target is any object
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete remaining keys
      delete target[key];
    });

    if (isArray(target)) {
      let newIndex = 0;
      for (let i = 0; i < target.length; i++) {
        const value = target[i];
        if (i in target && !isNil(value)) {
          target[newIndex++] = value;
        }
      }
      target.splice(newIndex);
    }
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return <S>target;
};
