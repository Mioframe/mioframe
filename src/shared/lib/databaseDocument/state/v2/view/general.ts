import type { output } from '@zod/mini';
import {
  array,
  extend,
  int,
  literal,
  object,
  optional,
  string,
  union,
  unknown,
} from '@zod/mini';
import { zodSortDescription } from './sorting';

export enum VIEW_LAYOUT {
  JSON = 'json',
  TABLE = 'table',
}

const zodGeneralView = object({
  name: string(),
  layout: unknown(),
  order: optional(int()),
});

export const zodTableView = extend(zodGeneralView, {
  layout: literal(VIEW_LAYOUT.TABLE),
  sorting: optional(array(zodSortDescription)),
});

const zodJsonView = extend(zodGeneralView, {
  layout: literal(VIEW_LAYOUT.JSON),
});

export const zodView = union([zodTableView, zodJsonView]);

export type View = output<typeof zodView>;
