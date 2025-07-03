import { defineMigrations } from '@shared/lib/migrations';
import type { DatabaseStateV1 } from './versions/v1';
import { databaseStateV1 } from './versions/v1';
import { databaseStateV2 } from './versions/v2';
import type { DatabaseStateV2 } from './versions/v2';
import { databaseStateV3 } from './versions/v3';

export const databaseBodyMigrations = defineMigrations(
  (bodyV0: object) => databaseStateV1.up(bodyV0),
  (bodyV1: DatabaseStateV1) => databaseStateV2.up(bodyV1),
  (bodyV2: DatabaseStateV2) => databaseStateV3.up(bodyV2),
);
