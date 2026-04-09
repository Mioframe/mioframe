import { zodGeneralProperty } from '@shared/lib/databaseDocument/migrations/versions/v1/property/general';
import type { output } from 'zod/v4-mini';
import { literal, extend, boolean, optional } from 'zod/v4-mini';

export const PROPERTY_TYPE_BOOLEAN = 'boolean';

export const zodBooleanProperty = extend(zodGeneralProperty(literal(PROPERTY_TYPE_BOOLEAN)), {
  indeterminate: optional(boolean()),
  default: optional(boolean()),
});

export type BooleanProperty = output<typeof zodBooleanProperty>;
