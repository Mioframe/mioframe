import type { UnknownRecord } from 'type-fest';
import { isUnknownRecord } from './isUnknownRecord';
import { createLogModule } from '../logger';

const { debug } = createLogModule('replaceObject');

/**
 * overwrites all values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */
export const replaceObject = <T extends UnknownRecord, S extends UnknownRecord>(
  target: T,
  source: S,
) => {
  debug('1', target, source);

  const targetKeys = new Set<string | number | symbol>(Object.keys(target));

  (<(keyof S)[]>Object.keys(source)).forEach((sourceKey) => {
    targetKeys.delete(sourceKey);
    const sourceValue = source[sourceKey];
    if (sourceKey in target) {
      const targetValue: unknown = target[sourceKey];
      if (sourceValue !== targetValue) {
        if (isUnknownRecord(targetValue) && isUnknownRecord(sourceValue)) {
          replaceObject(targetValue, sourceValue);
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

  targetKeys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete remaining keys
    delete target[key];
  });

  console.log(targetKeys, JSON.stringify(target));
  debug('end', target, source);
};
