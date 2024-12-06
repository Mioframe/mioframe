import type { DocumentId, DocumentPayload } from '@automerge/automerge-repo';
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
import { throttle } from 'lodash-es';
import { parseSelf } from '../validateZodScheme';
import { from } from 'ix/Ix.asynciterable';
import { distinct, filter, map } from 'ix/Ix.asynciterable.operators';
import type { IterableCollection } from '@shared/ui/TreeMenu/useIterable';

const { debug } = createLogger('createDocumentFolder');

const THROTTLE_EVENTS = 1e3 / 10;

export const createDocumentFolder = (
  directory: DirectoryForDocumentFolder,
): DocumentFolder => {
  const repo = new Repo({
    storage: createFSStorageAdapter(directory),
  });

  const onAddDocument = throttle(
    ({ handle: { documentId }, isNew }: DocumentPayload) => {
      debug('onAddDocument');
      const extensions = isNew ? [documentId] : undefined;
      changeEvents.forEach((handler) =>
        handler(createChildrenContentIterable(extensions)),
      );
    },
    THROTTLE_EVENTS,
  );

  const onDeleteDocument = throttle(() => {
    debug('onDeleteDocument');
    changeEvents.forEach((handler) => handler(createChildrenContentIterable()));
  }, THROTTLE_EVENTS);

  repo.on('document', onAddDocument);
  repo.on('delete-document', onDeleteDocument);

  function createChildrenContentIterable(
    exceptions?: DocumentId[],
  ): AsyncIterable<[DocumentId, CFRDocument]> {
    const exceptionsSet = exceptions ? new Set(exceptions) : undefined;

    return from(directory.children).pipe(
      filter(([entryName]) => zodFileName.safeParse(entryName).success),
      map(
        ([entryName]): DocumentId =>
          parseSelf(fileNameToPartialKey(entryName)[0], zodDocumentId),
      ),
      distinct(),
      filter((documentId: DocumentId) => !exceptionsSet?.has(documentId)),
      map((documentId: DocumentId): [DocumentId, CFRDocument] => {
        const docHandle: CFRDocument = repo.find(documentId);
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
