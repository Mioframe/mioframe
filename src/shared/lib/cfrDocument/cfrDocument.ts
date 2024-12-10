import { cloneDeep, isObject } from 'lodash-es';
import { createLogger } from '../logger';
import { checkSchema } from '../validateZodScheme';
import type { CFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { applyCFRDocumentMigration } from './migrations';

const { debug } = createLogger('createCFRDocument');

export const createCFRDocument = (
  docHandle: CFRDocument | DocHandle<unknown>,
): CFRDocument => {
  const doc = async () => {
    debug('doc');
    const originalDoc = await docHandle.doc();

    debug('doc originalDoc', () => ({ originalDoc: cloneDeep(originalDoc) }));

    const parsedDoc = checkSchema(originalDoc, zodDocumentContent);
    debug('doc parsedDoc', () => cloneDeep(parsedDoc));
    return parsedDoc;
  };

  const del = () => {
    debug('del');
    docHandle.delete();
  };

  const change = (callback: ChangeFn<DocumentContent>) => {
    debug('change');
    docHandle.change((doc) => {
      if (isObject(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  const eventsMap = new Map<
    // outside
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it doesn't matter what the function arguments are
    (...args: any[]) => unknown,
    // inside
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it doesn't matter what the function arguments are
    (...args: any[]) => unknown
  >();

  const on = (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => {
    debug('on change');
    const insideFn = ({ doc }: { doc?: unknown }) => {
      debug('change handler');
      fn({ doc: checkSchema(doc, zodDocumentContent) });
    };
    eventsMap.set(fn, insideFn);
    docHandle.on(event, insideFn);
  };

  const off = (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => {
    debug('off change');
    const insideFn = eventsMap.get(fn);
    if (insideFn) {
      docHandle.off(event, insideFn);
      eventsMap.delete(fn);
    }
  };

  const cfrDocument: CFRDocument = {
    doc,
    delete: del,
    change,
    on,
    off,
  };

  return cfrDocument;
};
