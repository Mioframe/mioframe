import { defineId } from '@shared/lib/defineId';
import type { output } from '@zod/mini';

export const { generateId: generateViewId, zodId: zodViewId } =
  defineId('viewId');

export type ViewId = output<typeof zodViewId>;
