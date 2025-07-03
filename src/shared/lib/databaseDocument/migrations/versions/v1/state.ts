import type { output } from 'zod/v4-mini';
import { literal, object } from 'zod/v4-mini';
import { zodUnknownPropertiesMap } from './property';
import { defineVersion } from '../../../../migrations/defineVersion';
import type { EmptyObject } from 'type-fest';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { zodDatabaseData } from './item';
import { cloneDeep } from 'es-toolkit';

export const databaseStateV1 = defineVersion(
  object({
    version: literal(1),
    data: zodDatabaseData,
    properties: zodUnknownPropertiesMap,
  }),
  (oldState: EmptyObject) => {
    const clonedState = cloneDeep(oldState);

    return deepPutJsonObject(clonedState, {
      version: 1,
      properties: {},
      data: {},
    } as const);
  },
);

export const zodDatabaseStateV1 = databaseStateV1.schema;

export type DatabaseStateV1 = output<typeof zodDatabaseStateV1>;
