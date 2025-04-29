import type { output } from '@zod/mini';
import { custom, record, type core } from '@zod/mini';

export const zodRequireRecord = <
  K extends core.$ZodType<PropertyKey, PropertyKey>,
  V extends core.$ZodType,
>(
  keyType: K,
  valueType: V,
) =>
  custom<Record<output<K>, output<V>>>((data) =>
    record(keyType, valueType).parse(data),
  );
