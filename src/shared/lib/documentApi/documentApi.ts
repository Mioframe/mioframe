import { createLogModule } from '../logger';
import { parseSelf } from '../validateZodScheme';
import type { DocumentApi } from './types';
import { zodDocument, type CRDocument } from './types';
import type { ChangeFn } from '@automerge/automerge-repo/slim';

const { debug } = createLogModule('createDocumentApi');

export const createDocumentApi = (docHandle: DocumentApi): DocumentApi => {
  const doc = async () => {
    debug('doc');
    const originalDoc = await docHandle.doc();

    const parsedDoc = parseSelf(originalDoc, zodDocument);
    return parsedDoc;
  };

  const del = () => {
    debug('del');
    docHandle.delete();
  };

  const change = (callback: ChangeFn<CRDocument>) => {
    debug('change');
    docHandle.change((doc) => {
      callback(parseSelf(doc, zodDocument));
    });
  };

  const eventsMap = new Map<
    // outside
    (payload: { doc: CRDocument }) => unknown,
    // inside
    (payload: { doc: CRDocument }) => unknown
  >();

  const on = (
    event: 'change',
    fn: (payload: { doc: CRDocument }) => unknown,
  ) => {
    debug('on change');
    const insideFn = ({ doc }: { doc: CRDocument }) => {
      debug('change handler');
      fn({ doc: parseSelf(doc, zodDocument) });
    };
    eventsMap.set(fn, insideFn);
    docHandle.on(event, insideFn);
  };

  const off = (
    event: 'change',
    fn: (payload: { doc: CRDocument }) => unknown,
  ) => {
    debug('off change');
    const insideFn = eventsMap.get(fn);
    if (insideFn) {
      docHandle.off(event, insideFn);
      eventsMap.delete(fn);
    }
  };

  const documentApi: DocumentApi = {
    doc,
    delete: del,
    change,
    on,
    off,
  };

  return documentApi;
};
