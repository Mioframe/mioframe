import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createProperty, zodGeneralProperyDescription } from './general';

export const PROPERTY_TYPE_BOOLEAN = 'boolean';

export const zodBooleanPropertyDescription = zodGeneralProperyDescription(
  literal(PROPERTY_TYPE_BOOLEAN),
);

export type BooleanColumnDescription = TypeOf<
  typeof zodBooleanPropertyDescription
>;

export const createBooleanColumn = (name: string): BooleanColumnDescription =>
  createProperty(PROPERTY_TYPE_BOOLEAN, name);
