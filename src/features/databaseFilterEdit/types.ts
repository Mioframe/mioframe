import { zodDatabasePropertyId, zodLOGICAL_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import type { output } from 'zod/v4-mini';
import { z } from 'zod/v4-mini';

export const zodFilterPath = z.array(
  z.union([zodLOGICAL_FILTER_OPERATOR, zodDatabasePropertyId, z.number()]),
);

export type FilterPath = output<typeof zodFilterPath>;
