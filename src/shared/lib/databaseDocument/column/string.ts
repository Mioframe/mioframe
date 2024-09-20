import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createColumn, zodGeneralColumnDescription } from './general';

const TYPE_NAME = 'string';

export const zodStringColumnDescription = zodGeneralColumnDescription(
  literal(TYPE_NAME),
);

export type StringColumnDescription = TypeOf<typeof zodStringColumnDescription>;

export const createStringColumn = (name: string): StringColumnDescription =>
  createColumn(TYPE_NAME, name);
