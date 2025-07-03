import type { output } from 'zod/v4-mini';
import { int, object, enum as zodEnum } from 'zod/v4-mini';
import { zodPropertyId } from '../../v1/property';
import { zodStrictRecord } from '@shared/lib/strictRecord/zodStrictRecord';

export enum SORT_DIRECTION {
  ascending,
  descending,
}

export const zodDatabaseSortDirection = zodEnum(SORT_DIRECTION);

export const zodDatabaseSortDescription = object({
  direction: zodDatabaseSortDirection,
  priority: int(),
});

export type DatabaseSortDescription = output<typeof zodDatabaseSortDescription>;

export const zodDatabaseSortMap = zodStrictRecord(
  zodPropertyId,
  zodDatabaseSortDescription,
);

export type DatabaseSortMap = output<typeof zodDatabaseSortMap>;
