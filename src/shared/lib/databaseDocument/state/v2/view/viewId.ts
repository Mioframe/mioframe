import { defineId } from '@shared/lib/defineId';
import type { output } from 'zod/v4-mini';

export const { generateId: generateViewId, zodId: zodDatabaseViewId } =
  defineId('viewId');

export type DatabaseViewId = output<typeof zodDatabaseViewId>;
