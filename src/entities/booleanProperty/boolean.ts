import {
  createProperty,
  zodGeneralProperty,
} from '@/shared/lib/databaseDocument/property/general';
import type { TypeOf } from 'zod';
import { literal } from 'zod';

export const PROPERTY_TYPE_BOOLEAN = 'boolean';

export const zodBooleanProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_BOOLEAN),
);

export type BooleanProperty = TypeOf<typeof zodBooleanProperty>;

export const createBooleanProperty = (name: string): BooleanProperty =>
  createProperty(PROPERTY_TYPE_BOOLEAN, name);
