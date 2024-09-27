import type { TypeOf } from 'zod';
import { literal } from 'zod';
import { createProperty, zodGeneralProperyDescription } from './general';

export const PROPERTY_TYPE_STRING = 'string';

export const zodStringPropertyDescription = zodGeneralProperyDescription(
  literal(PROPERTY_TYPE_STRING),
);

export type StringColumnDescription = TypeOf<
  typeof zodStringPropertyDescription
>;

export const createStringColumn = (name: string): StringColumnDescription =>
  createProperty(PROPERTY_TYPE_STRING, name);
