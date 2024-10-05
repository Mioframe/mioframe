import { cloneDeep } from 'lodash-es';
import { createLogger } from '../logger';
import { parseSelf } from '../validateZodScheme';
import type { CFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn } from '@automerge/automerge-repo';

const { debug } = createLogger('createCFRDocument');

export const createCFRDocument = (docHandle: CFRDocument): CFRDocument => {
  const doc = async () => {
    debug('doc');
    const originalDoc = await docHandle.doc();

    const parsedDoc = parseSelf(originalDoc, zodDocumentContent);
    debug('doc return', cloneDeep(parsedDoc));
    return parsedDoc;
  };

  const del = () => {
    debug('del');
    docHandle.delete();
  };

  const change = (callback: ChangeFn<DocumentContent>) => {
    debug('change');
    docHandle.change((doc) => {
      callback(parseSelf(doc, zodDocumentContent));
    });
  };

  const eventsMap = new Map<
    // outside
    (payload: { doc: DocumentContent }) => unknown,
    // inside
    (payload: { doc: DocumentContent }) => unknown
  >();

  const on = (
    event: 'change',
    fn: (payload: { doc: DocumentContent }) => unknown,
  ) => {
    debug('on change');
    const insideFn = ({ doc }: { doc: DocumentContent }) => {
      debug('change handler');
      fn({ doc: parseSelf(doc, zodDocumentContent) });
    };
    eventsMap.set(fn, insideFn);
    docHandle.on(event, insideFn);
  };

  const off = (
    event: 'change',
    fn: (payload: { doc: DocumentContent }) => unknown,
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
