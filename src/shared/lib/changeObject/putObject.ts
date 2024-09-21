import { isObject } from 'lodash-es';

/**
 * overwrites modified values from source to target
 * @param target - mutable object
 * @param source - object with new values
 */

export const putObject = <T extends object, S extends object>(
  target: T,
  source: S,
) => {
  (<(keyof S)[]>Object.keys(source)).forEach((sourceKey) => {
    const sourceValue = source[sourceKey];
    if (sourceKey in target) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- checked sourceKey in target
      // @ts-expect-error
      const targetValue: unknown = target[sourceKey];
      if (sourceValue !== targetValue) {
        if (isObject(targetValue) && isObject(sourceValue)) {
          putObject(targetValue, sourceValue);
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
};
