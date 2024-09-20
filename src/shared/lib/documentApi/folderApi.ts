import type {
  DeleteDocumentPayload,
  DocumentId,
} from '@automerge/automerge-repo/slim';
import { Repo } from '@automerge/automerge-repo/slim';
import { next as Automerge } from '@automerge/automerge/slim';
import wasmUrl from '@automerge/automerge/automerge.wasm?url';
import type { DirectoryEntryFSApi } from '../fileSystemApi';
import type { zodDocument } from './types';
import { type DocumentApi, type FolderApi } from './types';
import {
  createFSStorageAdapter,
  zodDocumentId,
  zodFileName,
} from '../fsStorageAdapter';
import { createDocumentApi } from './documentApi';
import type { TypeOf } from 'zod';
import { fileNameToPartialKey } from '../fsStorageAdapter/createFSStorageAdapter';
import { createLogModule } from '../logger';
import { throttle } from 'lodash-es';
import { parseSelf } from '../validateZodScheme';

const { debug } = createLogModule('folderApi');

const THROTTLE_EVENTS = 1e3 / 10;

export const createFolderApi = (
  directoryEntryApi: DirectoryEntryFSApi,
): FolderApi => {
  let repo: Repo | undefined;

  const getRepo = async () => {
    if (!Automerge.isWasmInitialized()) {
      await Automerge.initializeWasm(wasmUrl);
    }

    if (!repo) {
      debug('create Repo');
      repo = new Repo({
        storage: createFSStorageAdapter(directoryEntryApi),
      });

      repo.on('document', onAddDocument);
      repo.on('delete-document', onDeleteDocument);
    }

    return repo;
  };

  const fsContentMapState = new Map<DocumentId, DocumentApi>();

  const getFSContent = async (
    exceptions?: DocumentId[],
  ): Promise<Map<DocumentId, DocumentApi>> => {
    const exceptionsSet = exceptions ? new Set(exceptions) : undefined;
    const directoryList = await directoryEntryApi.getList();

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
        const docHandle: DocumentApi = (await getRepo()).find(documentId);

        fsContentMapState.set(documentId, createDocumentApi(docHandle));
      }
    }

    return fsContentMapState;
  };

  const create = async <Z extends typeof zodDocument>(
    initialValue: TypeOf<Z>,
  ) => {
    debug('create', initialValue);

    const repo = await getRepo();

    return createDocumentApi(repo.create(initialValue));
  };

  const changeEvents = new Set<
    (content: Map<DocumentId, DocumentApi>) => unknown
  >();

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

  const onChange = (fn: (content: Map<DocumentId, DocumentApi>) => unknown) => {
    changeEvents.add(fn);
  };
  const offChange = (
    fn: (content: Map<DocumentId, DocumentApi>) => unknown,
  ) => {
    changeEvents.delete(fn);
  };

  const remove = async (documentId: DocumentId) => {
    debug('remove', documentId);

    const repo = await getRepo();
    repo.delete(documentId);
  };

  const folder: FolderApi = {
    getContent: getFSContent,
    create,
    onChange,
    offChange,
    remove,
  };

  return folder;
};
