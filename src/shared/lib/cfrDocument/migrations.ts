import { deepPutJsonObject } from '../changeObject';
import { defineMigrations } from '../defineMigrations';
import type { MergeDeep } from 'type-fest';
import { type CFRDocumentContent } from './types';
import { isNumber, isObjectLike } from 'es-toolkit/compat';
import type { AMDoc } from '../automerge/automergeTypes';

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
): AMDoc<CFRDocumentContent> => {
  return defineMigrations(
    (doc: object): MergeDeep<object, CFRDocumentContent> => {
      return deepPutJsonObject(doc, {
        name: 'new document',
        type: 'unknown',
        ...doc,
        version: 1,
      });
    },
  )(data, readVersion(data));
};
