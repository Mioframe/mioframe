import type { output } from 'zod/v4-mini';
import { literal, object } from 'zod/v4-mini';
import { zodUnknownPropertiesMap } from './property';
import { defineVersionState } from '../defineVersion';
import type { EmptyObject } from 'type-fest';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { zodDatabaseData } from './item';

export const databaseState = defineVersionState(
  object({
    version: literal(1),
    data: zodDatabaseData,
    properties: zodUnknownPropertiesMap,
  }),
  (oldState: EmptyObject) => {
    return deepPutJsonObject(oldState, {
      version: 1,
      properties: {},
      data: {},
    } as const);
  },
);

export const zodDatabaseState = databaseState.zod;

export type DatabaseState = output<typeof zodDatabaseState>;
