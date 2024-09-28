import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createProperty, zodGeneralProperyDescription } from './general';

export const PROPERTY_TYPE_BOOLEAN = 'boolean';

export const zodBooleanPropertyDescription = zodGeneralProperyDescription(
  literal(PROPERTY_TYPE_BOOLEAN),
);

export type BooleanPropertyDescription = TypeOf<
  typeof zodBooleanPropertyDescription
>;

export const createBooleanColumn = (name: string): BooleanPropertyDescription =>
  createProperty(PROPERTY_TYPE_BOOLEAN, name);
