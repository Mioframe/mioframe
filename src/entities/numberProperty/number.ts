import type { TypeOf } from 'zod';
import { literal } from 'zod';
import {
  createProperty,
  zodGeneralProperty,
} from '../../shared/lib/databaseDocument/property/general';

export const PROPERTY_TYPE_NUMBER = 'number';

export const zodNumberProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_NUMBER),
);

export type NumberProperty = TypeOf<typeof zodNumberProperty>;

export const createNumberProperty = (name: string): NumberProperty =>
  createProperty(PROPERTY_TYPE_NUMBER, name);
