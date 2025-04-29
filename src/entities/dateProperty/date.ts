import {
  createProperty,
  zodGeneralProperty,
} from '@shared/lib/databaseDocument/state/v1/property/general';
import type { output } from '@zod/mini';
import { literal } from '@zod/mini';

export const PROPERTY_TYPE_DATE = 'date';

export const zodDateProperty = zodGeneralProperty(literal(PROPERTY_TYPE_DATE));

export type DateProperty = output<typeof zodDateProperty>;

export const createDateProperty = (name: string): DateProperty =>
  createProperty(PROPERTY_TYPE_DATE, name);
