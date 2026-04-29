import type { DatabaseViewsMap } from './migrations/versions';
import { strictRecordIterableEntries } from '../strictRecord';

export const getNextViewOrder = (views: DatabaseViewsMap): number => {
  let maxOrder = -1;

  for (const [, { order }] of strictRecordIterableEntries(views)()) {
    if (typeof order === 'number' && order > maxOrder) {
      maxOrder = order;
    }
  }

  return maxOrder + 1;
};
