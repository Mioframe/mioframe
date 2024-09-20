import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createColumn, zodGeneralColumnDescription } from './general';

const TYPE_NAME = 'number';

export const zodNumberColumnDescription = zodGeneralColumnDescription(
  literal(TYPE_NAME),
);

export type NumberColumnDescription = TypeOf<typeof zodNumberColumnDescription>;

export const createNumberColumn = (name: string): NumberColumnDescription =>
  createColumn(TYPE_NAME, name);
