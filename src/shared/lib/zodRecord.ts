import type { output } from '@zod/mini';
import { type core, safeParse, transform } from '@zod/mini';
import { forEachObj, isObjectType, set } from 'remeda';

export const zodOnlyRecord = <
  K extends core.$ZodType<PropertyKey, PropertyKey>,
  V extends core.$ZodType,
>(
  keyType: K,
  valueType: V,
) =>
  transform((data): Record<output<K>, output<V>> => {
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
            set(newObj, parsedKey, parsedValue);
          }
        }
      });
    }

    return newObj;
  });
