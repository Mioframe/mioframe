import { defineMigrations } from '../../defineMigrations';
import { zodIs } from '../../validateZodScheme';
import type { DatabaseTypeDocument } from '../types';
import { zodDatabaseType } from '../types';
import type { DatabaseState as DatabaseStateV1 } from '../state/v1';
import { databaseState as databaseStateV1 } from '../state/v1';
import { databaseState as databaseStateV2 } from '../state/v2';
import { isObjectLike, isNumber } from 'es-toolkit/compat';

const readDatabaseVersion = (doc: unknown) => {
  const dbDocument = zodIs(doc, zodDatabaseType) ? doc : undefined;

  const currentVersion: number =
    dbDocument && 'body' in dbDocument
      ? isObjectLike(dbDocument.body)
        ? 'version' in dbDocument.body
          ? isNumber(dbDocument.body.version)
            ? dbDocument.body.version
            : 0
          : 0
        : 0
      : 0;

  return currentVersion;
};

export const migrateBody = (bodyV0: object, currentDatabaseVersion: number) => {
  const latestBody = defineMigrations(
    (bodyV0: object) => {
      return databaseStateV1.migration(bodyV0);
    },

    (bodyV1: DatabaseStateV1) => {
      return databaseStateV2.migration(bodyV1);
    },
  )(bodyV0, currentDatabaseVersion);

  return latestBody;
};

export const migrateDatabaseDocument = (data: DatabaseTypeDocument) => {
  const currentDatabaseVersion = readDatabaseVersion(data);

  if (!isObjectLike(data.body)) {
    data.body = {};
  }

  const bodyV0 = data.body as object;

  return migrateBody(bodyV0, currentDatabaseVersion);
};
