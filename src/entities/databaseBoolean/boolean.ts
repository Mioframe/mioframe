import {
  createProperty,
  zodGeneralProperty,
} from '@shared/lib/databaseDocument/migrations/state/v1/property/general';
import type { output } from 'zod/v4-mini';
import { literal } from 'zod/v4-mini';

export const PROPERTY_TYPE_BOOLEAN = 'boolean';

export const zodBooleanProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_BOOLEAN),
);

export type BooleanProperty = output<typeof zodBooleanProperty>;

export const createBooleanProperty = (name: string): BooleanProperty =>
  createProperty(PROPERTY_TYPE_BOOLEAN, name);
