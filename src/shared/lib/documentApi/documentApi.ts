import type { TypeOf } from 'zod';
import type { DocumentApi } from './types';
import { zodDocument } from './types';
import type { ReadonlyDeep } from 'type-fest';
import type { ChangeFn, Doc } from '@automerge/automerge-repo/slim';

export const createDocumentApi = <
  Z extends typeof zodDocument = typeof zodDocument,
>(
  docHandle: DocumentApi,
  zod?: Z,
): DocumentApi<TypeOf<Z>> => {
  const usedZod = zod ?? zodDocument;

  const doc = async () =>
    usedZod.parse(await docHandle.doc()) as ReadonlyDeep<Doc<TypeOf<Z>>>;

  const del = () => {
    docHandle.delete();
  };

  const change = (callback: ChangeFn<TypeOf<Z>>) => {
    docHandle.change((doc) => {
      callback(usedZod.parse(doc));
    });
  };

  const documentApi: DocumentApi<TypeOf<Z>> = {
    doc,
    delete: del,
    change,
  };

  return documentApi;
};
