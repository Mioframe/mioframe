import { defineMigrations } from '../../defineMigrations';
import { checkSchema } from '../../validateZodScheme';
import type { DatabaseTypeDocument } from '../types';
import { zodDatabaseType } from '../types';
import { isNumber, isObject } from 'lodash-es';
import type { DatabaseState as DatabaseStateV1 } from '../state/v1';
import { databaseState as databaseStateV1 } from '../state/v1';
import { databaseState as databaseStateV2 } from '../state/v2';

const readDatabaseVersion = (doc: unknown) => {
  const dbDocument = checkSchema(doc, zodDatabaseType);

  const currentVersion: number =
    dbDocument && 'body' in dbDocument
      ? isObject(dbDocument.body)
        ? 'version' in dbDocument.body
          ? isNumber(dbDocument.body.version)
            ? dbDocument.body.version
            : 0
          : 0
        : 0
      : 0;

  return currentVersion;
};

export const applyDatabaseDocumentMigration = (data: DatabaseTypeDocument) => {
  const currentDatabaseVersion = readDatabaseVersion(data);

  if (!isObject(data.body)) {
    data.body = {};
  }

  const bodyV0 = data.body as object;

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
