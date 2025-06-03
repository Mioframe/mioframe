import { deepPutJSONObject } from '../changeObject';
import { defineMigrations } from '../defineMigrations';
import type { MergeDeep } from 'type-fest';
import type { Doc } from '@automerge/automerge-repo';
import { type DocumentContent } from './types';
import { createLogger } from '../logger';
import { clone, isNumber, isObjectType } from 'remeda';

const { debug } = createLogger('cfrDocumentMigrations');

const readVersion = (doc: unknown) => {
  const currentVersion: number = isObjectType(doc)
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
): Doc<DocumentContent> => {
  return defineMigrations((doc: object): MergeDeep<object, DocumentContent> => {
    debug('first migration', () => clone(doc));
    return deepPutJSONObject(doc, {
      name: 'new document',
      type: 'unknown',
      ...doc,
      version: 1,
    });
  })(data, readVersion(data));
};
