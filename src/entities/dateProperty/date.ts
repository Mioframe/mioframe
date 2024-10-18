import {
  createProperty,
  zodGeneralPropery,
} from '@shared/lib/databaseDocument/property/general';
import type { TypeOf } from 'zod';
import { literal } from 'zod';

export const PROPERTY_TYPE_DATE = 'date';

export const zodDateProperty = zodGeneralPropery(literal(PROPERTY_TYPE_DATE));

export type DateProperty = TypeOf<typeof zodDateProperty>;

export const createDateProperty = (name: string): DateProperty =>
  createProperty(PROPERTY_TYPE_DATE, name);
