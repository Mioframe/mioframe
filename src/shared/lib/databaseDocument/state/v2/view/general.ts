import type { output } from 'zod/v4-mini';
import {
  extend,
  int,
  literal,
  object,
  optional,
  string,
  union,
  unknown,
} from 'zod/v4-mini';
import { zodDatabaseSortList } from './sorting';

export enum DB_VIEW_LAYOUT {
  JSON = 'json',
  TABLE = 'table',
}

const zodGeneralView = object({
  name: string(),
  layout: unknown(),
  order: optional(int()),
});

export const zodDatabaseTableView = extend(zodGeneralView, {
  layout: literal(DB_VIEW_LAYOUT.TABLE),
  sorting: optional(zodDatabaseSortList),
});

const zodJsonView = extend(zodGeneralView, {
  layout: literal(DB_VIEW_LAYOUT.JSON),
});

export const zodDatabaseView = union([zodDatabaseTableView, zodJsonView]);

export type DatabaseView = output<typeof zodDatabaseView>;
