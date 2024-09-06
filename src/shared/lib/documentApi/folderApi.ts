import type { DocumentId } from '@automerge/automerge-repo/slim';
import { Repo } from '@automerge/automerge-repo/slim';
import { next as Automerge } from '@automerge/automerge/slim';
import wasmUrl from '@automerge/automerge/automerge.wasm?url';
import type { DirectoryEntryFSApi } from '../fileSystemApi';
import { zodDocument, type DocumentApi, type FolderApi } from './types';
import {
  createFSStorageAdapter,
  fileNameToKey,
  zodDocumentId,
  zodFileName,
} from '../fsStorageAdapter';
import { createDocumentApi } from './documentApi';
import type { TypeOf } from 'zod';

export const createFolderApi = (
  directoryEntryApi: DirectoryEntryFSApi,
): FolderApi => {
  let repo: Repo | undefined;

  const getRepo = async () => {
    if (!Automerge.isWasmInitialized()) {
      await Automerge.initializeWasm(wasmUrl);
    }

    if (!repo) {
      repo = new Repo({
        storage: createFSStorageAdapter(directoryEntryApi),
      });
    }

    return repo;
  };

  const getContent = async () => {
    const directoryList = await directoryEntryApi.getList();

    const contentMap: Map<DocumentId, DocumentApi> = new Map();

    for await (const [entryName] of directoryList) {
      if (zodFileName.safeParse(entryName).success) {
        const documentId = zodDocumentId.parse(fileNameToKey(entryName)[0]);
        const docHandle: DocumentApi = (await getRepo()).find(documentId);

        contentMap.set(documentId, createDocumentApi(docHandle, zodDocument));
      }
    }

    return contentMap;
  };

  const create = async <Z extends typeof zodDocument>(
    initialValue: TypeOf<Z>,
    zod: Z,
  ) => {
    const repo = await getRepo();

    return createDocumentApi(repo.create(initialValue), zod);
  };

  const folder: FolderApi = {
    getContent,
    create,
  };

  return folder;
};
