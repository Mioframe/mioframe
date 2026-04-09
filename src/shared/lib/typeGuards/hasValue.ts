import type { UnknownRecord, ValueOf } from 'type-fest';

export const hasValue = <T extends UnknownRecord>(value: unknown, obj: T): value is ValueOf<T> => {
  for (const key in obj) {
    if (Object.hasOwn(obj, key) && value === obj[key]) {
      return true;
    }
  }
  return false;
};
