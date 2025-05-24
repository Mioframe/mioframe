import type { output, core } from 'zod/v4-mini';
import { safeParse, transform } from 'zod/v4-mini';
import { forEachObj, isObjectType } from 'remeda';

export const zodOnlyRecord = <
  K extends core.$ZodType<PropertyKey, PropertyKey>,
  V extends core.$ZodType,
>(
  keyType: K,
  valueType: V,
) =>
  transform((data, ctx) => {
    const newObj = <Record<output<K>, output<V>>>{};

    if (isObjectType(data)) {
      forEachObj(data, (value, key) => {
        const { success: successKey, data: parsedKey } = safeParse(
          keyType,
          key,
        );
        if (successKey) {
          const { data: parsedValue, success: successValue } = safeParse(
            valueType,
            value,
          );
          if (successValue) {
            newObj[parsedKey] = parsedValue;
          }
        }
      });
      return newObj;
    }
    ctx.issues.push({
      code: 'custom',
      message: 'Not a object',
      input: data,
    });

    return newObj;
  });
