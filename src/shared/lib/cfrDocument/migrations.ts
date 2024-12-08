import { putObject } from '../changeObject';
import { defineMigration } from '../defineMigration';
import type { MergeDeep } from 'type-fest';
import type { Doc } from '@automerge/automerge-repo';
import { type DocumentContent } from './types';
import { isInteger, isNumber, isObject } from 'lodash-es';

const readVersion = (doc: unknown) => {
  const currentVersion: number = isObject(doc)
    ? 'version' in doc
      ? isNumber(doc.version) && isInteger(doc.version)
        ? doc.version
        : 0
      : 0
    : 0;

  return currentVersion;
};

export const applyCFRDocumentMigration = (
  data: object,
): Doc<DocumentContent> => {
  return defineMigration((doc: object): MergeDeep<object, DocumentContent> => {
    return putObject(doc, {
      name: 'new document',
      type: 'unknown',
      body: undefined,
      ...doc,
      version: 1,
    });
  })(data, readVersion(data));
};
