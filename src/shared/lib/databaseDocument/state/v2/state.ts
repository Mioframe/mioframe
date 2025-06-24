import type { output } from 'zod/v4-mini';
import { extend, literal, optional } from 'zod/v4-mini';
import type { DatabaseState as DataBaseStateV1 } from '../v1';
import { zodDatabaseState as zodDatabaseStateV1 } from '../v1';
import { defineVersionState } from '../defineVersion';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { zodDatabaseView, zodDatabaseViewId } from './view';
import { zodStrictRecord } from '@shared/lib/strictRecord/zodStrictRecord';

export const zodDatabaseViewsMap = zodStrictRecord(
  zodDatabaseViewId,
  zodDatabaseView,
);

export type DatabaseViewsMap = output<typeof zodDatabaseViewsMap>;

export const databaseState = defineVersionState(
  extend(zodDatabaseStateV1, {
    version: literal(2),
    views: optional(zodDatabaseViewsMap),
  }),
  (oldState: DataBaseStateV1) => {
    return deepPutJsonObject(oldState, {
      version: 2,
      properties: {},
      data: {},
    } as const);
  },
);

export const zodDatabaseState = databaseState.zod;

export type DatabaseState = output<typeof zodDatabaseState>;
