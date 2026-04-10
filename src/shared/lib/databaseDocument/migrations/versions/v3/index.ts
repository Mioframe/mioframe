import { defineVersion } from '@shared/lib/migrations';
import { databaseStateV2, DB_VIEW_LAYOUT, generateViewId, zodDatabaseViewsMap } from '../v2';
import type { DatabaseStateV2, DatabaseViewsMap } from '../v2/state';
import { extend, literal } from 'zod/v4-mini';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { isEmpty } from 'es-toolkit/compat';
import type { DatabaseTableView } from '..';
import { cloneDeep } from 'es-toolkit';
import { strictRecordSet } from '@shared/lib/strictRecord';

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
      };

      strictRecordSet(newState.views, defaultViewId, defaultView);
    }

    return newState;
  },
);
