import { isNil } from 'lodash-es';

type IterableObject<T extends object> = T &
  Iterable<[keyof T, Exclude<T[keyof T], undefined | null>]>;

export const makeIterableObject = <T extends Record<string, unknown>>(
  obj: T,
): IterableObject<T> => {
  if (!(Symbol.iterator in obj)) {
    (<IterableObject<T>>obj)[Symbol.iterator] = function* () {
      for (const key in this) {
        const value = this[key];
        if (Object.hasOwn(this, key) && !isNil(value)) {
          yield [key, value] as [
            keyof T,
            Exclude<T[keyof T], undefined | null>,
          ];
        }
      }
    };
  }

  return <IterableObject<T>>obj;
};
