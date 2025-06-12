import type { core } from 'zod/v4-mini';
import { object, string, type output } from 'zod/v4-mini';
import { defineId } from '../../../../defineId';
import type { Primitive } from 'type-fest';

export const zodGeneralProperty = <
  L extends Primitive,
  ZOD_TYPE_NAME extends
    | core.$ZodLiteral<L>
    | core.$ZodUnknown
    | core.$ZodString = core.$ZodLiteral<L>,
>(
  zodType: ZOD_TYPE_NAME,
) =>
  object({
    name: string(),
    type: zodType,
  });

export type GeneralProperty<T extends Primitive = Primitive> = output<
  ReturnType<typeof zodGeneralProperty<T>>
>;

export const createProperty = <T extends string>(
  type: T,
  name: string,
): GeneralProperty<T> => ({
  name,
  type,
});

export const { generateId: generatePropertyId, zodId: zodDatabasePropertyId } =
  defineId('propertyId');

export type DatabasePropertyId = output<typeof zodDatabasePropertyId>;
