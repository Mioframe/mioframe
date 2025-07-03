import { cloneDeep, isUndefined } from 'es-toolkit';
import { isUnknownRecord } from './isUnknownRecord';
import { isArray, isNil } from 'es-toolkit/compat';
import { keys } from '../objectKeys';

/**
 * overwrites all values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export const deepReplaceJsonObject = <S extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it doesn't matter what the target object is
  target: Record<any, any>,
  source: S,
): S => {
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
          }
          if (isUnknownRecord(targetValue) && isUnknownRecord(sourceValue)) {
            deepReplaceJsonObject(targetValue, sourceValue);
          } else {
            target[sourceKey] = cloneDeep(sourceValue);
          }
        }
      } else {
        target[sourceKey] = cloneDeep(sourceValue);
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
  return <S>target;
};
