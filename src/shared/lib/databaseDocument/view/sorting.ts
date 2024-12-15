import type { TypeOf } from 'zod';
import { array, literal, object, optional, union } from 'zod';
import { zodItemId } from '../item';
import { zodPropertyId } from '../property';

export const SORT_DIRECTION = {
  ascending: 'ascending',
  descending: 'descending',
} as const;

export const zodSortDirection = union([
  literal(SORT_DIRECTION.ascending),
  literal(SORT_DIRECTION.descending),
]);

export type SortDirection = TypeOf<typeof zodSortDirection>;

export const zodSortDescription = object({
  propertyId: zodPropertyId,
  direction: zodSortDirection,
  manual: optional(array(zodItemId)),
});

export type SortDescription = TypeOf<typeof zodSortDescription>;
