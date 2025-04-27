import type { TypeOf } from 'zod';
import { array, literal, object, optional, string, union, unknown } from 'zod';
import { zodSortDescription } from './sorting';

export enum VIEW_LAYOUT {
  JSON = 'json',
  TABLE = 'table',
}

const zodGeneralView = object({
  name: string(),
  layout: unknown(),
});

const zodTableView = zodGeneralView.extend({
  layout: literal(VIEW_LAYOUT.TABLE),
  sorting: optional(array(zodSortDescription)),
});

const zodJsonView = zodGeneralView.extend({
  layout: literal(VIEW_LAYOUT.JSON),
});

export const zodView = union([zodTableView, zodJsonView]);

export type View = TypeOf<typeof zodView>;
