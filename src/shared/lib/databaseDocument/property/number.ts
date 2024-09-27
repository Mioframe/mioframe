import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createProperty, zodGeneralProperyDescription } from './general';

export const PROPERTY_TYPE_NUMBER = 'number';

export const zodNumberPropertyDescription = zodGeneralProperyDescription(
  literal(PROPERTY_TYPE_NUMBER),
);

export type NumberColumnDescription = TypeOf<
  typeof zodNumberPropertyDescription
>;

export const createNumberColumn = (name: string): NumberColumnDescription =>
  createProperty(PROPERTY_TYPE_NUMBER, name);
