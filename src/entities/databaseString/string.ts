import type { output } from 'zod/v4-mini';
import { literal } from 'zod/v4-mini';
import {
  createProperty,
  zodGeneralProperty,
} from '../../shared/lib/databaseDocument/state/v1/property/general';

export const PROPERTY_TYPE_STRING = 'string';

export const zodStringProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_STRING),
);

export type StringProperty = output<typeof zodStringProperty>;

export const createStringProperty = (name: string): StringProperty =>
  createProperty(PROPERTY_TYPE_STRING, name);
