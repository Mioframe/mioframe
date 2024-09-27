import type { ZodLiteral } from 'zod';
import { object, string, type TypeOf } from 'zod';
import { defineId } from '../../defineId';

export const zodGeneralProperyDescription = <
  L extends string,
  ZOD_TYPE_NAME extends ZodLiteral<L> = ZodLiteral<L>,
>(
  zodType: ZOD_TYPE_NAME,
) =>
  object({
    name: string(),
    type: zodType,
  });

export type GeneralPropertyDescription<T extends string> = TypeOf<
  ReturnType<typeof zodGeneralProperyDescription<T>>
>;

export const createProperty = <T extends string>(
  type: T,
  name: string,
): GeneralPropertyDescription<T> => ({
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
