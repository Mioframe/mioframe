import type { ZodLiteral } from 'zod';
import { object, string, type TypeOf } from 'zod';
import { defineId } from '../../defineId';

export const zodGeneralColumnDescription = <
  L extends string,
  ZOD_TYPE_NAME extends ZodLiteral<L> = ZodLiteral<L>,
>(
  zodType: ZOD_TYPE_NAME,
) =>
  object({
    name: string(),
    type: zodType,
  });

export type GeneralColumnDescription<T extends string> = TypeOf<
  ReturnType<typeof zodGeneralColumnDescription<T>>
>;

export const createColumn = <T extends string>(
  type: T,
  name: string,
): GeneralColumnDescription<T> => ({
  name,
  type,
});

/**
 * Проверка валидности введённого значения, напр., для форм
 */
export interface ValidateValue {
  (value: unknown): boolean;
}

export const { generateId: generateColumnId, zodId: zodColumnId } =
  defineId('columnId');

export type ColumnId = TypeOf<typeof zodColumnId>;
