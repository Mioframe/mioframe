import type { TypeOf } from 'zod';
import { object, string } from 'zod';

export const zodView = object({
  name: string(),
  layout: string(),
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
