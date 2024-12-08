import { putObject } from '../changeObject';
import type { DataBaseStateV1 } from './versions';
import { initialDatabaseStateV1, initialDatabaseStateV2 } from './versions';
import { defineMigration } from '../defineMigration';
import type { MergeDeep } from 'type-fest';
import { checkSchema } from '../validateZodScheme';
import type {
  DatabaseDocumentWithContent,
  DatabaseTypeDocument,
} from './types';
import { zodDatabaseType } from './types';
import { isNumber, isObject } from 'lodash-es';

const readVersion = (doc: unknown) => {
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

export const applyDatabaseDocumentMigration = (
  data: DatabaseTypeDocument,
): DatabaseDocumentWithContent => {
  const currentVersion = readVersion(data);

  return defineMigration(
    (
      doc: DatabaseTypeDocument,
    ): MergeDeep<DatabaseTypeDocument, { body: DataBaseStateV1 }> => {
      return putObject(doc, {
        body: initialDatabaseStateV1(),
      });
    },
    (doc: MergeDeep<DatabaseTypeDocument, { body: DataBaseStateV1 }>) => {
      return putObject(doc, { body: initialDatabaseStateV2() });
    },
  )(data, currentVersion);
};
