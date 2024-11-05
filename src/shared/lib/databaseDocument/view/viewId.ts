import { defineId } from '@shared/lib/defineId';
import type { TypeOf } from 'zod';

export const { generateId: generateViewId, zodId: zodViewId } =
  defineId('viewId');

export type ViewId = TypeOf<typeof zodViewId>;
