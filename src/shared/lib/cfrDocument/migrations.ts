import { deepPutJSONObject } from '../changeObject';
import { defineMigrations } from '../defineMigrations';
import type { MergeDeep } from 'type-fest';
import { type DocumentContent } from './types';
import { createLogger } from '../logger';
import { isNumber, isObjectLike } from 'es-toolkit/compat';
import { cloneDeep } from 'es-toolkit';
import type { AMDoc } from './automergeTypes';

const { debug } = createLogger('cfrDocumentMigrations');

const readVersion = (doc: unknown) => {
  const currentVersion: number = isObjectLike(doc)
    ? 'version' in doc
      ? isNumber(doc.version) && Number.isInteger(doc.version)
        ? doc.version
        : 0
      : 0
    : 0;

  return currentVersion;
};

export const applyCFRDocumentMigration = (
  data: object,
): AMDoc<DocumentContent> => {
  return defineMigrations((doc: object): MergeDeep<object, DocumentContent> => {
    debug('first migration', () => cloneDeep(doc));
    return deepPutJSONObject(doc, {
      name: 'new document',
      type: 'unknown',
      ...doc,
      version: 1,
    });
  })(data, readVersion(data));
};
