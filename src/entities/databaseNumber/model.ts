import type { output } from 'zod/v4-mini';
import { literal } from 'zod/v4-mini';
import {
  createProperty,
  zodGeneralProperty,
} from '../../shared/lib/databaseDocument/migrations/state/v1/property/general';

export const PROPERTY_TYPE_NUMBER = 'number';

export const zodNumberProperty = zodGeneralProperty(
  literal(PROPERTY_TYPE_NUMBER),
);

export type NumberProperty = output<typeof zodNumberProperty>;

export const createNumberProperty = (name: string): NumberProperty =>
  createProperty(PROPERTY_TYPE_NUMBER, name);
