import type { core } from 'zod/v4-mini';
import { object, optional, string, unknown, type output } from 'zod/v4-mini';
import { defineId } from '../../../../../defineId';

export const zodGeneralProperty = <
  L extends string,
  ZOD_TYPE_NAME extends core.$ZodLiteral<L> | core.$ZodUnknown | core.$ZodString =
    core.$ZodLiteral<L>,
>(
  zodType: ZOD_TYPE_NAME,
) =>
  object({
    name: string(),
    type: zodType,
    default: optional(unknown()),
  });

export type GeneralProperty<T extends string = string> = output<
  ReturnType<typeof zodGeneralProperty<T>>
>;

export const createProperty = <T extends string>(type: T, name: string): GeneralProperty<T> => ({
  name,
  type,
});

export const { generateId: generatePropertyId, zodId: zodDatabasePropertyId } =
  defineId('propertyId');

export type DatabasePropertyId = output<typeof zodDatabasePropertyId>;
