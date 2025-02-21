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
import { is } from '../validateZodScheme';
import type { AsyncIterableX } from 'ix/Ix.asynciterable';
import { from } from 'ix/Ix.asynciterable';
import { distinct, filter, map } from 'ix/Ix.asynciterable.operators';
import type { Collection } from '@shared/ui/TreeMenu/useIterable';

const { debug } = createLogger('documentFolder');

const THROTTLE_EVENTS = 1e3 / 10;

/**
 * Создание папки с документами
 * @param directory - директория для хранения документов
 * @returns
 * @deprecated - упразднить и упростить до простой работы с файловой системой через GeneralFileSystem. Не смешивать с документами и их репозиториями.
 */
export const createDocumentFolder = (
  directory: DirectoryForDocumentFolder,
): DocumentFolder => {
  const repo = new Repo({
    storage: createFSStorageAdapter(directory),
  });

  const onChangeFolder = throttle(() => {
    changeEvents.forEach((handler) => handler(createChildrenContentIterable()));
  }, THROTTLE_EVENTS);

  repo.on('document', onChangeFolder);
  repo.on('delete-document', onChangeFolder);

  function createChildrenContentIterable(): Collection<
    [DocumentId, CFRDocument] | [string, DocumentFolder]
  > {
    const source = from(directory.children);

    const folders: AsyncIterableX<
      [string, DocumentFolder] | [DocumentId, CFRDocument]
    > = source.pipe(
      map(
        ([name, entry]):
          | [string, DocumentFolder]
          | [DocumentId]
          | undefined => {
          if ('writeFile' in entry) {
            return [name, createDocumentFolder(entry)];
          }
          if (is(name, zodFileName)) {
            const documentId = fileNameToPartialKey(name)?.[0];
            if (documentId) {
              return [documentId];
            }
          }
          return undefined;
        },
      ),
      distinct(),
      filter((v) => !isNil(v)),
      map(
        ([key, value]):
          | [DocumentId, CFRDocument]
          | [string, DocumentFolder]
          | undefined => {
          if (is(key, zodDocumentId)) {
            const documentId: DocumentId = key;
            const docHandle: DocHandle<unknown> = repo.find(documentId);
            return [documentId, createCFRDocument(docHandle)];
          } else if (value) {
            return [key, value];
          }
        },
      ),
      filter((v) => !isNil(v)),
    );

    return folders;
  }

  const createDocument = <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => {
    debug('create', initialValue);

    const docHandle = repo.create(initialValue);

    const newCFRDocument = createCFRDocument(docHandle);

    return newCFRDocument;
  };

  const changeEvents = new Set<
    (
      content: Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>,
    ) => unknown
  >();

  const onChange = (
    fn: (
      content: Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>,
    ) => unknown,
  ) => {
    changeEvents.add(fn);
  };
  const offChange = (
    fn: (
      content: Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>,
    ) => unknown,
  ) => {
    changeEvents.delete(fn);
  };

  const remove = (documentId: DocumentId) => {
    debug('remove', documentId);

    repo.delete(documentId);
  };

  const createFolder = async (name: string): Promise<DocumentFolder> => {
    const newDirectory = await directory.createDirectory(name);

    onChangeFolder();

    return createDocumentFolder(newDirectory);
  };

  const folder: DocumentFolder = {
    get name() {
      return directory.getName();
    },
    createDocument,
    onChange,
    offChange,
    remove,
    get children(): Collection<
      [DocumentId, CFRDocument] | [string, DocumentFolder]
    > {
      return createChildrenContentIterable();
    },
    createFolder,
  };

  return folder;
};
