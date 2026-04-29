import { describe, expect, it } from 'vitest';
import { DB_VIEW_LAYOUT, generateViewId } from '../../versions';
import { databaseStateV3 } from './index';

describe('databaseStateV3', () => {
  it('backfills missing or invalid view order values after existing numeric orders', () => {
    const viewAId = generateViewId();
    const viewBId = generateViewId();
    const viewCId = generateViewId();

    const migratedState = databaseStateV3.up({
      version: 2,
      data: {},
      properties: {},
      views: {
        [viewAId]: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'view A',
          order: 2,
        },
        [viewBId]: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'view B',
        },
        [viewCId]: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'view C',
          order: Number.NaN,
        },
      },
    });

    expect(migratedState.views[viewAId]?.order).toBe(2);
    expect(migratedState.views[viewBId]?.order).toBe(3);
    expect(migratedState.views[viewCId]?.order).toBe(4);
  });
});
