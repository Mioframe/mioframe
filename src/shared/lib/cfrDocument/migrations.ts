import { deepPutJsonObject } from '../changeObject';
import { defineMigrations } from '../migrations/defineMigrations';
import type { MergeDeep } from 'type-fest';
import { type CFRDocumentContent } from './types';
import type { AMDoc } from '../automerge/automergeTypes';
import { isObjectLike } from '../typeGuards/isObjectLike';
import { isInteger } from '../typeGuards/isInteger';

const readVersion = (doc: unknown) => {
  const currentVersion: number = isObjectLike(doc)
    ? 'version' in doc
      ? isInteger(doc.version)
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
  ).applyUpdate(data, readVersion(data));
};
