import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { Repo } from '@automerge/automerge-repo';
import type { zodDocumentContent, CFRDocument, RefRepo } from './types';
import { createFSStorageAdapter, zodFileName } from '../fsStorageAdapter';
import { createCFRDocument } from './cfrDocument';
import type { TypeOf } from 'zod';
import { fileNameToPartialKey } from '../fsStorageAdapter/createFSStorageAdapter';
import { isNil } from 'lodash-es';
import { is } from '../validateZodScheme';
import { from } from 'ix/Ix.asynciterable';
import { distinct, filter, map } from 'ix/Ix.asynciterable.operators';
import type { RefDirectory } from '../refFileSystem';
import { reactive, ref } from 'vue';

/**
 * Создание папки с документами
 * @param directory - директория для хранения документов
 * @returns
 */
export const refRepo = (directory: RefDirectory): RefRepo => {
  const repo = new Repo({
    storage: createFSStorageAdapter(directory),
  });

  const documents = ref<Map<DocumentId, CFRDocument>>(new Map());

  repo.on('document', ({ handle, isNew }) => {
    if (isNew) {
      documents.value.set(handle.documentId, createCFRDocument(handle));
    }
  });
  repo.on('delete-document', ({ documentId }) => {
    documents.value.delete(documentId);
  });

  const fetchDocuments = async () => {
    await from(directory.entries)
      .pipe(
        filter(([, entry]) => 'read' in entry),
        map(([name]): [DocumentId] | undefined => {
          if (is(name, zodFileName)) {
            const documentId = fileNameToPartialKey(name)?.[0];
            if (documentId) {
              return [documentId];
            }
          }
          return undefined;
        }),
        distinct(),
        filter((v) => !isNil(v)),
      )
      .forEach(([documentId]) => {
        const docHandle: DocHandle<unknown> = repo.find(documentId);
        documents.value.set(documentId, createCFRDocument(docHandle));
      });
  };

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => {
    const docHandle = repo.create(initialValue);

    const newCFRDocument = createCFRDocument(docHandle);

    return newCFRDocument;
  };

  const remove = (documentId: DocumentId) => {
    repo.delete(documentId);
  };

  void fetchDocuments();

  const repoRef: RefRepo = reactive({
    create,
    remove,
    documents,
  });

  return repoRef;
};
