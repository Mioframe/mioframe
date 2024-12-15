import type { TypeOf } from 'zod';
import { array, object, optional, string } from 'zod';
import { zodSortDescription } from './sorting';

export const zodView = object({
  name: string(),
  layout: string(),
  sorting: optional(array(zodSortDescription)),
});

export type View = TypeOf<typeof zodView>;

export const createView = (name: string, layout: string): View => ({
  name,
  layout,
});

export const VIEW_LAYOUT = {
  JSON: 'json',
  TABLE: 'table',
} as const;
