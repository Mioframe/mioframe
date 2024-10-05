import type {
  DeleteDocumentPayload,
  DocumentId,
} from '@automerge/automerge-repo';
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

const { debug } = createLogger('createDocumentFolder');

const THROTTLE_EVENTS = 1e3 / 10;

export const createDocumentFolder = (
  directory: DirectoryForDocumentFolder,
): DocumentFolder => {
  const repo = new Repo({
    storage: createFSStorageAdapter(directory),
  });

  const onAddDocument = throttle(() => {
    debug('onAddDocument');
    void getFSContent().then((content) => {
      changeEvents.forEach((handler) => handler(content));
    });
  }, THROTTLE_EVENTS);

  const onDeleteDocument = throttle(({ documentId }: DeleteDocumentPayload) => {
    debug('onDeleteDocument');
    void getFSContent([documentId]).then((content) => {
      changeEvents.forEach((handler) => handler(content));
    });
  }, THROTTLE_EVENTS);

  repo.on('document', onAddDocument);
  repo.on('delete-document', onDeleteDocument);

  const fsContentMapState = new Map<DocumentId, CFRDocument>();

  const getFSContent = async (
    exceptions?: DocumentId[],
  ): Promise<Map<DocumentId, CFRDocument>> => {
    const exceptionsSet = exceptions ? new Set(exceptions) : undefined;
    const directoryList = await directory.getList();

    const currentDocumentSet = new Set<DocumentId>();

    for (const [entryName] of directoryList) {
      if (zodFileName.safeParse(entryName).success) {
        const documentId: DocumentId = parseSelf(
          fileNameToPartialKey(entryName)[0],
          zodDocumentId,
        );

        if (!exceptionsSet?.has(documentId)) {
          currentDocumentSet.add(documentId);
        }
      }
    }

    for (const [documentId] of fsContentMapState) {
      if (!currentDocumentSet.has(documentId)) {
        fsContentMapState.delete(documentId);
      }
    }

    for (const documentId of currentDocumentSet) {
      if (!fsContentMapState.has(documentId)) {
        const docHandle: CFRDocument = repo.find(documentId);

        fsContentMapState.set(documentId, createCFRDocument(docHandle));
      }
    }

    return fsContentMapState;
  };

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => {
    debug('create', initialValue);

    return createCFRDocument(repo.create(initialValue));
  };

  const changeEvents = new Set<
    (content: Map<DocumentId, CFRDocument>) => unknown
  >();

  const onChange = (fn: (content: Map<DocumentId, CFRDocument>) => unknown) => {
    changeEvents.add(fn);
  };
  const offChange = (
    fn: (content: Map<DocumentId, CFRDocument>) => unknown,
  ) => {
    changeEvents.delete(fn);
  };

  const remove = (documentId: DocumentId) => {
    debug('remove', documentId);

    repo.delete(documentId);
  };

  const folder: DocumentFolder = {
    getContent: getFSContent,
    create,
    onChange,
    offChange,
    remove,
  };

  return folder;
};
