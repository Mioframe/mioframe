import type { TypeOf } from 'zod';
import { defineId } from '../../defineId';

export const { generateId: generateItemId, zodId: zodItemId } =
  defineId('itemId');

export type ItemId = TypeOf<typeof zodItemId>;
