import { defineId } from '@shared/lib/defineId';
import type { output } from '@zod/mini';

export const { generateId: generateViewId, zodId: zodDatabaseViewId } =
  defineId('viewId');

export type DatabaseViewId = output<typeof zodDatabaseViewId>;
