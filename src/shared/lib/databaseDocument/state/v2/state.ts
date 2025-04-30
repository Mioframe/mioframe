import type { output } from '@zod/mini';
import { extend, literal, optional } from '@zod/mini';
import type { DatabaseState as DataBaseStateV1 } from '../v1';
import { zodDatabaseState as zodDatabaseStateV1 } from '../v1';
import { defineVersionState } from '../defineVersion';
import { putObject } from '@shared/lib/changeObject';
import { zodView, zodViewId } from './view';
import { zodOnlyRecord } from '@shared/lib/zodRecord';

export const zodDatabaseViewsMap = zodOnlyRecord(zodViewId, zodView);

export type DatabaseViewsMap = output<typeof zodDatabaseViewsMap>;

export const databaseState = defineVersionState(
  extend(zodDatabaseStateV1, {
    version: literal(2),
    views: optional(zodDatabaseViewsMap),
  }),
  (oldState: DataBaseStateV1) => {
    return putObject(oldState, {
      version: 2,
      properties: {},
      data: {},
    } as const);
  },
);

export const zodDatabaseState = databaseState.zod;
