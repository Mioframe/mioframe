import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { Repo } from '@automerge/automerge-repo';
import type {
  DirectoryForDocumentFolder,
  zodDocumentContent,
  CFRDocument,
  DocumentFolder,
} from './types';
import {
  createFSStorageAdapter,
  zodDocumentId,
  zodFileName,
} from '../fsStorageAdapter';
import { createCFRDocument } from './cfrDocument';
import type { TypeOf } from 'zod';
import { fileNameToPartialKey } from '../fsStorageAdapter/createFSStorageAdapter';
import { createLogger } from '../logger';
import { isNil, throttle } from 'lodash-es';
import { checkSchema } from '../validateZodScheme';
import { from } from 'ix/Ix.asynciterable';
import { distinct, filter, map } from 'ix/Ix.asynciterable.operators';
import type { IterableCollection } from '@shared/ui/TreeMenu/useIterable';

const { debug } = createLogger('documentFolder');

const THROTTLE_EVENTS = 1e3 / 10;

export const createDocumentFolder = (
  directory: DirectoryForDocumentFolder,
): DocumentFolder => {
  const repo = new Repo({
    storage: createFSStorageAdapter(directory),
  });

  const onAddDocument = throttle(() => {
    changeEvents.forEach((handler) => handler(createChildrenContentIterable()));
  }, THROTTLE_EVENTS);

  const onDeleteDocument = throttle(() => {
    debug('onDeleteDocument');
    changeEvents.forEach((handler) => handler(createChildrenContentIterable()));
  }, THROTTLE_EVENTS);

  repo.on('document', onAddDocument);
  repo.on('delete-document', onDeleteDocument);

  function createChildrenContentIterable(): AsyncIterable<
    [DocumentId, CFRDocument]
  > {
    return from(directory.children).pipe(
      filter(([entryName]) => zodFileName.safeParse(entryName).success),
      map(([entryName]): DocumentId | undefined =>
        checkSchema(fileNameToPartialKey(entryName)?.[0], zodDocumentId),
      ),
      distinct(),
      filter((v) => !isNil(v)),
      map((documentId): [DocumentId, CFRDocument] => {
        const docHandle: DocHandle<unknown> = repo.find(documentId);
        return [documentId, createCFRDocument(docHandle)];
      }),
    );
  }

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => {
    debug('create', initialValue);

    const docHandle = repo.create(initialValue);

    const newCFRDocument = createCFRDocument(docHandle);

    return newCFRDocument;
  };

  const changeEvents = new Set<
    (content: IterableCollection<DocumentId, CFRDocument>) => unknown
  >();

  const onChange = (
    fn: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => {
    changeEvents.add(fn);
  };
  const offChange = (
    fn: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => {
    changeEvents.delete(fn);
  };

  const remove = (documentId: DocumentId) => {
    debug('remove', documentId);

    repo.delete(documentId);
  };

  const folder: DocumentFolder = {
    create,
    onChange,
    offChange,
    remove,
    get children() {
      return createChildrenContentIterable();
    },
  };

  return folder;
};
