import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createColumn, zodGeneralColumnDescription } from './general';

const TYPE_NAME = 'boolean';

export const zodBooleanColumnDescription = zodGeneralColumnDescription(
  literal(TYPE_NAME),
);

export type BooleanColumnDescription = TypeOf<
  typeof zodBooleanColumnDescription
>;

export const createBooleanColumn = (name: string): BooleanColumnDescription =>
  createColumn(TYPE_NAME, name);
