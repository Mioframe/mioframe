import { isPlainObject } from 'es-toolkit';
import { keys } from './objectKeys';

export const removeEmptyStructures = <T>(data: T): T | undefined => {
  if (
    data === null ||
    typeof data !== 'object' ||
    data instanceof Date ||
    data instanceof RegExp
  ) {
    return data;
  }

  if (Array.isArray(data)) {
    for (let i = data.length - 1; i >= 0; i--) {
      const result = removeEmptyStructures(data[i]);

      if (result === undefined) {
        data.splice(i, 1);
      }
    }

    if (data.length === 0) {
      return undefined;
    }

    return data;
  }

  if (isPlainObject(data)) {
    const dataKeys = keys(data);

    for (const key of dataKeys) {
      const result = removeEmptyStructures(data[key]);

      if (result === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- it's ok
        delete data[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return undefined;
    }

    return data;
  }

  return data;
};
