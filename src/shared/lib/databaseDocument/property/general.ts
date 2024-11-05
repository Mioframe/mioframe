import type { ZodLiteral, ZodString, ZodUnknown } from 'zod';
import { object, string, type TypeOf } from 'zod';
import { defineId } from '../../defineId';

export const zodGeneralProperty = <
  L,
  ZOD_TYPE_NAME extends ZodLiteral<L> | ZodUnknown | ZodString = ZodLiteral<L>,
>(
  zodType: ZOD_TYPE_NAME,
) =>
  object({
    name: string(),
    type: zodType,
  });

export type GeneralProperty<T = unknown> = TypeOf<
  ReturnType<typeof zodGeneralProperty<T>>
>;

export const createProperty = <T extends string>(
  type: T,
  name: string,
): GeneralProperty<T> => ({
  name,
  type,
});

/**
 * Проверка валидности введённого значения, напр., для форм
 */
export interface ValidateValue {
  (value: unknown): boolean;
}

export const { generateId: generatePropertyId, zodId: zodPropertyId } =
  defineId('propertyId');

export type PropertyId = TypeOf<typeof zodPropertyId>;
