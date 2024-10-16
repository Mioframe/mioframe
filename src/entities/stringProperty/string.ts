import type { TypeOf } from 'zod';
import { literal } from 'zod';
import {
  createProperty,
  zodGeneralPropery,
} from '../../shared/lib/databaseDocument/property/general';

export const PROPERTY_TYPE_STRING = 'string';

export const zodStringProperty = zodGeneralPropery(
  literal(PROPERTY_TYPE_STRING),
);

export type StringProperty = TypeOf<typeof zodStringProperty>;

export const createStringProperty = (name: string): StringProperty =>
  createProperty(PROPERTY_TYPE_STRING, name);
