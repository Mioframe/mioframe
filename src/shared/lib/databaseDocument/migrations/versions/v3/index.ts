import { defineVersion } from '@shared/lib/migrations';
import { databaseStateV2, DB_VIEW_LAYOUT, generateViewId, zodDatabaseViewsMap } from '../v2';
import type { DatabaseStateV2, DatabaseViewsMap } from '../v2/state';
import { extend, literal } from 'zod/v4-mini';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { isEmpty } from 'es-toolkit/compat';
import type { DatabaseTableView } from '..';
import { cloneDeep } from 'es-toolkit';
import { strictRecordIterableEntries, strictRecordSet } from '@shared/lib/strictRecord';

const assignMissingViewOrders = (views: DatabaseViewsMap) => {
  let nextOrder = -1;

  for (const [, view] of strictRecordIterableEntries(views)()) {
    if (typeof view.order === 'number' && Number.isFinite(view.order) && view.order > nextOrder) {
      nextOrder = view.order;
    }
  }

  for (const [, view] of strictRecordIterableEntries(views)()) {
    if (typeof view.order === 'number' && Number.isFinite(view.order)) {
      continue;
    }

    nextOrder += 1;
    view.order = nextOrder;
  }
};

export const databaseStateV3 = defineVersion(
  extend(databaseStateV2.schema, {
    version: literal(3),
    views: zodDatabaseViewsMap,
  }),
  (old: DatabaseStateV2) => {
    const oldSnapshot = cloneDeep(old);

    const newState = deepPatchJsonObject(oldSnapshot, {
      version: 3,
      views: {} satisfies DatabaseViewsMap,
    } as const);

    if (isEmpty(newState.views)) {
      const defaultViewId = generateViewId();
      const defaultView: DatabaseTableView = {
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'default view',
        order: 0,
      };

      strictRecordSet(newState.views, defaultViewId, defaultView);
    }

    assignMissingViewOrders(newState.views);

    return newState;
  },
);
