import type { output } from '@zod/mini';
import { array, literal, object, optional, union } from '@zod/mini';
import { zodPropertyId } from '../../v1/property';
import { zodItemId } from '../../v1/item';

export const SORT_DIRECTION = {
  ascending: 'ascending',
  descending: 'descending',
} as const;

export const zodSortDirection = union([
  literal(SORT_DIRECTION.ascending),
  literal(SORT_DIRECTION.descending),
]);

export type SortDirection = output<typeof zodSortDirection>;

export const zodSortDescription = object({
  propertyId: zodPropertyId,
  direction: zodSortDirection,
  manual: optional(array(zodItemId)),
});

export type SortDescription = output<typeof zodSortDescription>;
