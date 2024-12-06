import type { UnknownRecord } from 'type-fest';
import { isUnknownRecord } from './isUnknownRecord';
import { cloneDeep } from 'lodash-es';

/**
 * overwrites all values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export const replaceObject = (target: UnknownRecord, source: UnknownRecord) => {
  const targetKeys = new Set<string | number | symbol>(Object.keys(target));

  (<(keyof UnknownRecord)[]>Object.keys(source)).forEach((sourceKey) => {
    targetKeys.delete(sourceKey);
    const sourceValue = source[sourceKey];
    if (sourceKey in target) {
      const targetValue: unknown = target[sourceKey];
      if (sourceValue !== targetValue) {
        if (isUnknownRecord(targetValue) && isUnknownRecord(sourceValue)) {
          replaceObject(targetValue, sourceValue);
        } else {
          target[sourceKey] = cloneDeep(sourceValue);
        }
      }
    } else {
      target[sourceKey] = cloneDeep(sourceValue);
    }
  });

  targetKeys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete remaining keys
    delete target[key];
  });
};
