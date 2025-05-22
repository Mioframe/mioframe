import type { output } from '@zod/mini';
import { array, object, tuple, union, enum as zodEnum } from '@zod/mini';
import { zodPropertyId } from '../../v1/property';
import { zodItemId } from '../../v1/item';

export enum SORT_DIRECTION {
  ascending,
  descending,
}

export const zodDatabaseSortDirection = zodEnum(SORT_DIRECTION);

export const zodDatabaseSortDescription = object({
  propertyId: zodPropertyId,
  direction: zodDatabaseSortDirection,
});

export type DatabaseSort = output<typeof zodDatabaseSortDescription>;

export const zodDatabaseSortList = union([
  tuple([array(zodItemId)], zodDatabaseSortDescription),
  array(zodDatabaseSortDescription),
]);

export type DatabaseSortList = output<typeof zodDatabaseSortList>;
