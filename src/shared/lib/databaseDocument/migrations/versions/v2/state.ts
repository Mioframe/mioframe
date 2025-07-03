import type { output } from 'zod/v4-mini';
import { extend, literal, optional } from 'zod/v4-mini';
import type { DatabaseStateV1 as DataBaseStateV1 } from '../v1';
import { zodDatabaseStateV1 as zodDatabaseStateV1 } from '../v1';
import { defineVersion } from '../../../../migrations/defineVersion';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { zodDatabaseView, zodDatabaseViewId } from './view';
import { zodStrictRecord } from '@shared/lib/strictRecord/zodStrictRecord';
import { cloneDeep } from 'es-toolkit';

export const zodDatabaseViewsMap = zodStrictRecord(
  zodDatabaseViewId,
  zodDatabaseView,
);

export type DatabaseViewsMap = output<typeof zodDatabaseViewsMap>;

export const databaseStateV2 = defineVersion(
  extend(zodDatabaseStateV1, {
    version: literal(2),
    views: optional(zodDatabaseViewsMap),
  }),
  (oldState: DataBaseStateV1) => {
    const clonedState = cloneDeep(oldState);

    return deepPutJsonObject(clonedState, {
      version: 2,
      properties: {},
      data: {},
      views: {},
    } as const);
  },
);

export const zodDatabaseStateV2 = databaseStateV2.schema;

export type DatabaseStateV2 = output<typeof zodDatabaseStateV2>;
