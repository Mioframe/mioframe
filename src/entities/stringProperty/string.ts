import type { TypeOf } from 'zod';
import { literal } from 'zod';
import {
  createProperty,
  zodGeneralProperty,
} from '../../shared/lib/databaseDocument/property/general';

export const PROPERTY_TYPE_STRING = 'string';

export const zodStringProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_STRING),
);

export type StringProperty = TypeOf<typeof zodStringProperty>;

export const createStringProperty = (name: string): StringProperty =>
  createProperty(PROPERTY_TYPE_STRING, name);
