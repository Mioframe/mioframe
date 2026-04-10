import type { core, ZodMiniType } from 'zod/v4-mini';
import { safeParse, transform } from 'zod/v4-mini';
import { forEach } from 'es-toolkit/compat';
import type { StrictRecord } from './types';
import { isObjectLike } from '../typeGuards';

export const zodStrictRecord = <K extends string, V>(
  zodKey: core.$ZodType<K>,
  zodValue: core.$ZodType<V>,
): ZodMiniType<StrictRecord<K, V>> =>
  transform((data, ctx): StrictRecord<K, V> => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- creating empty typed record
    const newObj = <StrictRecord<K, V>>{};

    if (isObjectLike(data)) {
      forEach(data, (value, key) => {
        const { success: successKey, data: parsedKey } = safeParse(zodKey, key);
        if (successKey) {
          const { success: successValue, data: parsedValue } = safeParse(zodValue, value);
          if (successValue) {
            Object.assign(newObj, { [parsedKey]: parsedValue });
          }
        }
      });
      return newObj;
    }
    ctx.issues.push({
      code: 'custom',
      message: 'Not an object',
      input: data,
    });

    return newObj;
  });
